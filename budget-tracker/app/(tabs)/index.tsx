import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  Platform,
  Alert,
  KeyboardAvoidingView,
} from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useBudget } from '@/lib/budget-context';
import { useColors } from '@/hooks/use-colors';
import { TransactionType } from '@/constants/budget';
import { DonutChartSection } from '@/components/donut-chart-section';
import * as Haptics from 'expo-haptics';

export default function HomeScreen() {
  const colors = useColors();
  const { expenseCategories, incomeCategories, addTransaction, getMonthlyStats } = useBudget();

  const now = new Date();
  const monthStats = getMonthlyStats(now.getFullYear(), now.getMonth());

  // Form state
  const [txType, setTxType] = useState<TransactionType>('expense');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = txType === 'expense' ? expenseCategories : incomeCategories;

  const handleTypeChange = useCallback((type: TransactionType) => {
    setTxType(type);
    setSelectedCategoryId('');
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!selectedCategoryId) {
      Alert.alert('提示', '請選擇類別');
      return;
    }
    const amountNum = parseFloat(amount);
    if (!amount || isNaN(amountNum) || amountNum <= 0) {
      Alert.alert('提示', '請輸入有效金額');
      return;
    }

    setIsSubmitting(true);
    try {
      await addTransaction({
        date: selectedDate.toISOString().split('T')[0],
        type: txType,
        categoryId: selectedCategoryId,
        amount: amountNum,
        note,
      });
      setAmount('');
      setNote('');
      setSelectedCategoryId('');
      setSelectedDate(new Date());
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      Alert.alert('✓ 新增成功', '記帳資料已儲存');
    } catch {
      Alert.alert('新增失敗', '請稍後再試');
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedCategoryId, amount, selectedDate, txType, note, addTransaction]);

  const formatDate = (d: Date) =>
    `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;

  const formatCurrency = (n: number) =>
    `NT$ ${n.toLocaleString('zh-TW', { minimumFractionDigits: 0 })}`;

  const monthLabel = `${now.getFullYear()} 年 ${now.getMonth() + 1} 月`;

  // Lazy-load DateTimePicker to avoid issues on web
  const renderDatePicker = () => {
    if (!showDatePicker) return null;
    if (Platform.OS === 'web') {
      return (
        <input
          type="date"
          value={selectedDate.toISOString().split('T')[0]}
          max={new Date().toISOString().split('T')[0]}
          onChange={(e) => {
            if (e.target.value) setSelectedDate(new Date(e.target.value));
            setShowDatePicker(false);
          }}
          style={{
            width: '100%',
            padding: '10px',
            marginBottom: '12px',
            borderRadius: '10px',
            border: `1px solid ${colors.border}`,
            backgroundColor: colors.background,
            color: colors.foreground,
            fontSize: '15px',
          }}
        />
      );
    }
    // Native: use lazy import
    const DateTimePicker = require('@react-native-community/datetimepicker').default;
    return (
      <DateTimePicker
        value={selectedDate}
        mode="date"
        display={Platform.OS === 'ios' ? 'inline' : 'default'}
        onChange={(_: unknown, date?: Date) => {
          setShowDatePicker(Platform.OS === 'ios');
          if (date) setSelectedDate(date);
        }}
        maximumDate={new Date()}
      />
    );
  };

  return (
    <ScreenContainer>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={{ paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={{ backgroundColor: colors.primary, paddingTop: 20, paddingBottom: 28, paddingHorizontal: 20 }}>
            <Text style={{ color: '#fff', fontSize: 14, opacity: 0.85, marginBottom: 4 }}>
              {monthLabel}
            </Text>
            <Text style={{ color: '#fff', fontSize: 22, fontWeight: '700', marginBottom: 20 }}>
              記帳本
            </Text>

            {/* Stats Row */}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <StatCard
                label="本月收入"
                value={formatCurrency(monthStats.income)}
                color="#4ADE80"
                bgColor="rgba(74,222,128,0.15)"
              />
              <StatCard
                label="本月支出"
                value={formatCurrency(monthStats.expense)}
                color="#FCA5A5"
                bgColor="rgba(252,165,165,0.15)"
              />
              <StatCard
                label="結餘"
                value={formatCurrency(monthStats.balance)}
                color={monthStats.balance >= 0 ? '#93C5FD' : '#FCA5A5'}
                bgColor="rgba(147,197,253,0.15)"
              />
            </View>
          </View>

          {/* Form Card */}
          <View style={{
            margin: 16,
            backgroundColor: colors.surface,
            borderRadius: 16,
            padding: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 8,
            elevation: 3,
          }}>
            <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: '600', marginBottom: 14 }}>
              新增記帳
            </Text>

            {/* Type Toggle */}
            <View style={{ flexDirection: 'row', backgroundColor: colors.background, borderRadius: 10, padding: 3, marginBottom: 14 }}>
              {(['expense', 'income'] as TransactionType[]).map((t) => (
                <Pressable
                  key={t}
                  style={[
                    { flex: 1, paddingVertical: 9, borderRadius: 8, alignItems: 'center' },
                    txType === t && { backgroundColor: t === 'expense' ? colors.error : colors.success },
                  ]}
                  onPress={() => handleTypeChange(t)}
                >
                  <Text style={{
                    fontSize: 14,
                    fontWeight: '600',
                    color: txType === t ? '#fff' : colors.muted,
                  }}>
                    {t === 'expense' ? '💸 支出' : '💰 收入'}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Date Picker */}
            <FormLabel label="日期" />
            <Pressable
              style={{
                backgroundColor: colors.background,
                borderRadius: 10,
                padding: 13,
                marginBottom: 12,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
              onPress={() => setShowDatePicker(!showDatePicker)}
            >
              <Text style={{ color: colors.foreground, fontSize: 15 }}>{formatDate(selectedDate)}</Text>
              <Text style={{ color: colors.muted, fontSize: 13 }}>📅</Text>
            </Pressable>
            {renderDatePicker()}

            {/* Category */}
            <FormLabel label="類別" />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
              {categories.map((cat) => (
                <Pressable
                  key={cat.id}
                  style={[
                    {
                      paddingHorizontal: 12,
                      paddingVertical: 7,
                      borderRadius: 20,
                      borderWidth: 1.5,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 4,
                    },
                    selectedCategoryId === cat.id
                      ? { backgroundColor: cat.color, borderColor: cat.color }
                      : { backgroundColor: colors.background, borderColor: colors.border },
                  ]}
                  onPress={() => {
                    setSelectedCategoryId(cat.id);
                    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                >
                  <Text style={{ fontSize: 14 }}>{cat.icon}</Text>
                  <Text style={{
                    fontSize: 13,
                    fontWeight: '500',
                    color: selectedCategoryId === cat.id ? '#fff' : colors.foreground,
                  }}>
                    {cat.name}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Amount */}
            <FormLabel label="金額" />
            <View style={{
              backgroundColor: colors.background,
              borderRadius: 10,
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 13,
              marginBottom: 12,
            }}>
              <Text style={{ color: colors.muted, fontSize: 16, marginRight: 6 }}>NT$</Text>
              <TextInput
                style={{ flex: 1, color: colors.foreground, fontSize: 18, fontWeight: '600', paddingVertical: 12 }}
                placeholder="0"
                placeholderTextColor={colors.muted}
                keyboardType="decimal-pad"
                value={amount}
                onChangeText={setAmount}
                returnKeyType="done"
              />
            </View>

            {/* Note */}
            <FormLabel label="備註（選填）" />
            <TextInput
              style={{
                backgroundColor: colors.background,
                borderRadius: 10,
                padding: 13,
                color: colors.foreground,
                fontSize: 15,
                marginBottom: 16,
                minHeight: 44,
              }}
              placeholder="輸入備註..."
              placeholderTextColor={colors.muted}
              value={note}
              onChangeText={setNote}
              returnKeyType="done"
            />

            {/* Submit Button */}
            <Pressable
              style={({ pressed }) => [{
                backgroundColor: txType === 'expense' ? colors.error : colors.success,
                borderRadius: 12,
                paddingVertical: 14,
                alignItems: 'center',
                opacity: pressed || isSubmitting ? 0.8 : 1,
              }]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>
                {isSubmitting ? '新增中...' : `新增${txType === 'expense' ? '支出' : '收入'}`}
              </Text>
            </Pressable>
          </View>

          {/* Donut Chart Section */}
          <DonutChartSection />
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

function StatCard({ label, value, color, bgColor }: {
  label: string;
  value: string;
  color: string;
  bgColor: string;
}) {
  return (
    <View style={{ flex: 1, backgroundColor: bgColor, borderRadius: 12, padding: 12 }}>
      <Text style={{ color, fontSize: 11, fontWeight: '500', marginBottom: 4 }}>{label}</Text>
      <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }} numberOfLines={1}>{value}</Text>
    </View>
  );
}

function FormLabel({ label }: { label: string }) {
  const colors = useColors();
  return (
    <Text style={{
      color: colors.muted,
      fontSize: 12,
      fontWeight: '500',
      marginBottom: 6,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    }}>
      {label}
    </Text>
  );
}
