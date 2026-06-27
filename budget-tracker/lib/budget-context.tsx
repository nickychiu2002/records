import React, { createContext, useContext, useEffect, useReducer, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Transaction,
  Category,
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES,
} from '@/constants/budget';

const STORAGE_KEY_TRANSACTIONS = '@budget_transactions';
const STORAGE_KEY_CATEGORIES = '@budget_categories';
const STORAGE_KEY_GOOGLE_SHEET = '@budget_google_sheet';

interface GoogleSheetConfig {
  spreadsheetId: string;
  apiKey: string;
  sheetName: string;
  enabled: boolean;
}

interface BudgetState {
  transactions: Transaction[];
  expenseCategories: Category[];
  incomeCategories: Category[];
  googleSheet: GoogleSheetConfig;
  isLoading: boolean;
  isSyncing: boolean;
}

type BudgetAction =
  | { type: 'LOAD_DATA'; payload: Partial<BudgetState> }
  | { type: 'ADD_TRANSACTION'; payload: Transaction }
  | { type: 'DELETE_TRANSACTION'; payload: string }
  | { type: 'UPDATE_CATEGORY_COLOR'; payload: { id: string; color: string } }
  | { type: 'UPDATE_GOOGLE_SHEET'; payload: Partial<GoogleSheetConfig> }
  | { type: 'SET_SYNCING'; payload: boolean };

const initialState: BudgetState = {
  transactions: [],
  expenseCategories: DEFAULT_EXPENSE_CATEGORIES,
  incomeCategories: DEFAULT_INCOME_CATEGORIES,
  googleSheet: {
    spreadsheetId: '',
    apiKey: '',
    sheetName: 'Sheet1',
    enabled: false,
  },
  isLoading: true,
  isSyncing: false,
};

function budgetReducer(state: BudgetState, action: BudgetAction): BudgetState {
  switch (action.type) {
    case 'LOAD_DATA':
      return { ...state, ...action.payload, isLoading: false };
    case 'ADD_TRANSACTION':
      return { ...state, transactions: [action.payload, ...state.transactions] };
    case 'DELETE_TRANSACTION':
      return {
        ...state,
        transactions: state.transactions.filter((t) => t.id !== action.payload),
      };
    case 'UPDATE_CATEGORY_COLOR': {
      const updateCat = (cats: Category[]) =>
        cats.map((c) => (c.id === action.payload.id ? { ...c, color: action.payload.color } : c));
      return {
        ...state,
        expenseCategories: updateCat(state.expenseCategories),
        incomeCategories: updateCat(state.incomeCategories),
      };
    }
    case 'UPDATE_GOOGLE_SHEET':
      return { ...state, googleSheet: { ...state.googleSheet, ...action.payload } };
    case 'SET_SYNCING':
      return { ...state, isSyncing: action.payload };
    default:
      return state;
  }
}

interface BudgetContextValue extends BudgetState {
  addTransaction: (t: Omit<Transaction, 'id' | 'createdAt'>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  updateCategoryColor: (id: string, color: string) => Promise<void>;
  updateGoogleSheet: (config: Partial<GoogleSheetConfig>) => Promise<void>;
  getMonthlyStats: (year: number, month: number) => { income: number; expense: number; balance: number };
  getQuarterlyStats: (year: number, quarter: number) => { income: number; expense: number; balance: number };
  getYearlyStats: (year: number) => { income: number; expense: number; balance: number };
  getCategoryBreakdown: (transactions: Transaction[], type: 'expense' | 'income') => { category: Category; amount: number; percentage: number }[];
}

const BudgetContext = createContext<BudgetContextValue | null>(null);

export function BudgetProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(budgetReducer, initialState);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [txRaw, catRaw, gsRaw] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY_TRANSACTIONS),
        AsyncStorage.getItem(STORAGE_KEY_CATEGORIES),
        AsyncStorage.getItem(STORAGE_KEY_GOOGLE_SHEET),
      ]);

      const transactions: Transaction[] = txRaw ? JSON.parse(txRaw) : [];
      const categoriesData = catRaw ? JSON.parse(catRaw) : null;
      const googleSheet = gsRaw ? JSON.parse(gsRaw) : initialState.googleSheet;

      dispatch({
        type: 'LOAD_DATA',
        payload: {
          transactions,
          expenseCategories: categoriesData?.expense ?? DEFAULT_EXPENSE_CATEGORIES,
          incomeCategories: categoriesData?.income ?? DEFAULT_INCOME_CATEGORIES,
          googleSheet,
        },
      });
    } catch {
      dispatch({ type: 'LOAD_DATA', payload: {} });
    }
  };

  const saveTransactions = async (transactions: Transaction[]) => {
    await AsyncStorage.setItem(STORAGE_KEY_TRANSACTIONS, JSON.stringify(transactions));
  };

  const saveCategories = async (expense: Category[], income: Category[]) => {
    await AsyncStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify({ expense, income }));
  };

  const addTransaction = useCallback(async (data: Omit<Transaction, 'id' | 'createdAt'>) => {
    const tx: Transaction = {
      ...data,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    // Use functional update pattern to avoid stale closure
    dispatch({ type: 'ADD_TRANSACTION', payload: tx });
    // Read latest state from storage to avoid stale closure
    const storedRaw = await AsyncStorage.getItem(STORAGE_KEY_TRANSACTIONS);
    const stored: Transaction[] = storedRaw ? JSON.parse(storedRaw) : [];
    const updated = [tx, ...stored];
    await saveTransactions(updated);
  }, []);

  const deleteTransaction = useCallback(async (id: string) => {
    dispatch({ type: 'DELETE_TRANSACTION', payload: id });
    const storedRaw = await AsyncStorage.getItem(STORAGE_KEY_TRANSACTIONS);
    const stored: Transaction[] = storedRaw ? JSON.parse(storedRaw) : [];
    const updated = stored.filter((t) => t.id !== id);
    await saveTransactions(updated);
  }, []);

  const updateCategoryColor = useCallback(async (id: string, color: string) => {
    dispatch({ type: 'UPDATE_CATEGORY_COLOR', payload: { id, color } });
    const catRaw = await AsyncStorage.getItem(STORAGE_KEY_CATEGORIES);
    const catData = catRaw ? JSON.parse(catRaw) : { expense: DEFAULT_EXPENSE_CATEGORIES, income: DEFAULT_INCOME_CATEGORIES };
    const newExpense = (catData.expense as Category[]).map((c) => c.id === id ? { ...c, color } : c);
    const newIncome = (catData.income as Category[]).map((c) => c.id === id ? { ...c, color } : c);
    await saveCategories(newExpense, newIncome);
  }, []);

  const updateGoogleSheet = useCallback(async (config: Partial<GoogleSheetConfig>) => {
    dispatch({ type: 'UPDATE_GOOGLE_SHEET', payload: config });
    const gsRaw = await AsyncStorage.getItem(STORAGE_KEY_GOOGLE_SHEET);
    const current = gsRaw ? JSON.parse(gsRaw) : initialState.googleSheet;
    const updated = { ...current, ...config };
    await AsyncStorage.setItem(STORAGE_KEY_GOOGLE_SHEET, JSON.stringify(updated));
  }, []);

  const getMonthlyStats = useCallback((year: number, month: number) => {
    const filtered = state.transactions.filter((t) => {
      const d = new Date(t.date);
      return d.getFullYear() === year && d.getMonth() === month;
    });
    return calcStats(filtered);
  }, [state.transactions]);

  const getQuarterlyStats = useCallback((year: number, quarter: number) => {
    const startMonth = quarter * 3;
    const filtered = state.transactions.filter((t) => {
      const d = new Date(t.date);
      return d.getFullYear() === year && d.getMonth() >= startMonth && d.getMonth() < startMonth + 3;
    });
    return calcStats(filtered);
  }, [state.transactions]);

  const getYearlyStats = useCallback((year: number) => {
    const filtered = state.transactions.filter((t) => new Date(t.date).getFullYear() === year);
    return calcStats(filtered);
  }, [state.transactions]);

  const getCategoryBreakdown = useCallback((transactions: Transaction[], type: 'expense' | 'income') => {
    const categories = type === 'expense' ? state.expenseCategories : state.incomeCategories;
    const filtered = transactions.filter((t) => t.type === type);
    const total = filtered.reduce((sum, t) => sum + t.amount, 0);

    return categories
      .map((cat) => {
        const amount = filtered
          .filter((t) => t.categoryId === cat.id)
          .reduce((sum, t) => sum + t.amount, 0);
        return {
          category: cat,
          amount,
          percentage: total > 0 ? (amount / total) * 100 : 0,
        };
      })
      .filter((item) => item.amount > 0)
      .sort((a, b) => b.amount - a.amount);
  }, [state.expenseCategories, state.incomeCategories]);

  return (
    <BudgetContext.Provider
      value={{
        ...state,
        addTransaction,
        deleteTransaction,
        updateCategoryColor,
        updateGoogleSheet,
        getMonthlyStats,
        getQuarterlyStats,
        getYearlyStats,
        getCategoryBreakdown,
      }}
    >
      {children}
    </BudgetContext.Provider>
  );
}

export function useBudget() {
  const ctx = useContext(BudgetContext);
  if (!ctx) throw new Error('useBudget must be used within BudgetProvider');
  return ctx;
}

function calcStats(transactions: Transaction[]) {
  const income = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  return { income, expense, balance: income - expense };
}

async function syncToGoogleSheet(tx: Transaction, config: GoogleSheetConfig) {
  try {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}/values/${config.sheetName}:append?valueInputOption=USER_ENTERED&key=${config.apiKey}`;
    const row = [
      tx.date,
      tx.type === 'income' ? '收入' : '支出',
      tx.categoryId,
      tx.amount,
      tx.note,
      tx.createdAt,
    ];
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: [row] }),
    });
  } catch {
    // Silent fail - data is saved locally
  }
}
