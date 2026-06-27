export type TransactionType = 'expense' | 'income';

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: TransactionType;
}

export interface Transaction {
  id: string;
  date: string; // ISO date string
  type: TransactionType;
  categoryId: string;
  amount: number;
  note: string;
  createdAt: string;
}

export const DEFAULT_EXPENSE_CATEGORIES: Category[] = [
  { id: 'food', name: '食物', icon: '🍔', color: '#FF6B6B', type: 'expense' },
  { id: 'transport', name: '交通', icon: '🚌', color: '#4ECDC4', type: 'expense' },
  { id: 'shopping', name: '購物', icon: '🛍️', color: '#FFE66D', type: 'expense' },
  { id: 'entertainment', name: '娛樂', icon: '🎮', color: '#A78BFA', type: 'expense' },
  { id: 'medical', name: '醫療', icon: '💊', color: '#F97316', type: 'expense' },
  { id: 'education', name: '教育', icon: '📚', color: '#60A5FA', type: 'expense' },
  { id: 'housing', name: '住宿', icon: '🏠', color: '#34D399', type: 'expense' },
  { id: 'other_expense', name: '其他', icon: '📦', color: '#9CA3AF', type: 'expense' },
];

export const DEFAULT_INCOME_CATEGORIES: Category[] = [
  { id: 'salary', name: '薪資', icon: '💼', color: '#34C759', type: 'income' },
  { id: 'bonus', name: '獎金', icon: '🎁', color: '#4F8EF7', type: 'income' },
  { id: 'investment', name: '投資', icon: '📈', color: '#A78BFA', type: 'income' },
  { id: 'side_job', name: '副業', icon: '💡', color: '#FFE66D', type: 'income' },
  { id: 'other_income', name: '其他', icon: '💰', color: '#9CA3AF', type: 'income' },
];

export const ALL_DEFAULT_CATEGORIES = [
  ...DEFAULT_EXPENSE_CATEGORIES,
  ...DEFAULT_INCOME_CATEGORIES,
];

export const MONTHS_ZH = [
  '一月', '二月', '三月', '四月', '五月', '六月',
  '七月', '八月', '九月', '十月', '十一月', '十二月',
];
