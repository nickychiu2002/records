import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  ScrollView,
  Animated,
  Easing,
  Dimensions,
  Platform,
  StyleSheet,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useBudget } from '@/lib/budget-context';
import { useColors } from '@/hooks/use-colors';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_SIZE = Math.min(SCREEN_WIDTH - 80, 240);
const RADIUS = (CHART_SIZE - 48) / 2;
const STROKE_WIDTH = 28;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

type ChartPeriod = 'month' | 'quarter' | 'year';

const PERIODS = [
  { id: 'month' as ChartPeriod, label: '本月支出', emoji: '📅' },
  { id: 'quarter' as ChartPeriod, label: '本季支出', emoji: '📊' },
  { id: 'year' as ChartPeriod, label: '本年支出', emoji: '📈' },
];

function getQuarter(month: number) {
  return Math.floor(month / 3);
}

export function DonutChartSection() {
  const colors = useColors();
  const [selectedPeriod, setSelectedPeriod] = useState<ChartPeriod | null>(null);

  const handleOpen = (period: ChartPeriod) => {
    setSelectedPeriod(period);
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  return (
    <View style={{ marginHorizontal: 16, marginTop: 4, marginBottom: 16 }}>
      <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: '600', marginBottom: 12 }}>
        支出分析
      </Text>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        {PERIODS.map((p) => (
          <Pressable
            key={p.id}
            style={({ pressed }) => [
              styles.periodCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                opacity: pressed ? 0.75 : 1,
                transform: [{ scale: pressed ? 0.96 : 1 }],
              },
            ]}
            onPress={() => handleOpen(p.id)}
          >
            <Text style={{ fontSize: 26, marginBottom: 8 }}>{p.emoji}</Text>
            <Text style={{ color: colors.foreground, fontSize: 12, fontWeight: '600', textAlign: 'center' }}>
              {p.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {selectedPeriod !== null && (
        <ChartModal
          period={selectedPeriod}
          onClose={() => setSelectedPeriod(null)}
        />
      )}
    </View>
  );
}

function ChartModal({ period, onClose }: { period: ChartPeriod; onClose: () => void }) {
  const colors = useColors();
  const { transactions, getCategoryBreakdown } = useBudget();
  const animValue = useRef(new Animated.Value(0)).current;
  const [progress, setProgress] = useState(0);

  const now = new Date();
  const config = PERIODS.find((p) => p.id === period)!;

  const filtered = transactions.filter((t) => {
    if (t.type !== 'expense') return false;
    const d = new Date(t.date);
    if (period === 'month') {
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    } else if (period === 'quarter') {
      return d.getFullYear() === now.getFullYear() && getQuarter(d.getMonth()) === getQuarter(now.getMonth());
    } else {
      return d.getFullYear() === now.getFullYear();
    }
  });

  const breakdown = getCategoryBreakdown(filtered, 'expense');
  const total = filtered.reduce((s, t) => s + t.amount, 0);

  useEffect(() => {
    animValue.setValue(0);
    setProgress(0);
    const id = animValue.addListener(({ value }) => setProgress(value));
    Animated.timing(animValue, {
      toValue: 1,
      duration: 900,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
    return () => animValue.removeListener(id);
  }, [period]);

  const center = CHART_SIZE / 2;

  // Build arc segments
  let cumulative = 0;
  const segments = breakdown.map((item) => {
    const fraction = item.amount / total;
    const startAngle = cumulative;
    cumulative += fraction;
    return { ...item, startAngle, fraction };
  });

  return (
    <Modal
      visible
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {/* Header */}
        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
          <View>
            <Text style={{ color: colors.foreground, fontSize: 18, fontWeight: '700' }}>
              {config.label}
            </Text>
          </View>
          <Pressable
            style={[styles.closeBtn, { backgroundColor: colors.surface }]}
            onPress={onClose}
          >
            <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: '600' }}>✕</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
          {breakdown.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={{ fontSize: 48, marginBottom: 12 }}>📭</Text>
              <Text style={{ color: colors.muted, fontSize: 16 }}>此期間尚無支出資料</Text>
              <Text style={{ color: colors.muted, fontSize: 13, marginTop: 6 }}>
                新增記帳後即可查看分析
              </Text>
            </View>
          ) : (
            <>
              {/* Chart */}
              <View style={{ alignItems: 'center', marginBottom: 8 }}>
                <Svg
                  width={CHART_SIZE}
                  height={CHART_SIZE}
                  style={{ transform: [{ rotate: '-90deg' }] }}
                >
                  {/* Background track */}
                  <Circle
                    cx={center}
                    cy={center}
                    r={RADIUS}
                    stroke={colors.border}
                    strokeWidth={STROKE_WIDTH}
                    fill="none"
                  />
                  {/* Animated segments */}
                  {segments.map((seg, i) => {
                    const visibleFraction = Math.max(0, Math.min(seg.fraction, progress - seg.startAngle));
                    const dash = visibleFraction * CIRCUMFERENCE;
                    const gap = CIRCUMFERENCE - dash;
                    // offset: start at -startAngle from top (12 o'clock)
                    const offset = CIRCUMFERENCE - seg.startAngle * CIRCUMFERENCE;
                    if (dash <= 0) return null;
                    return (
                      <Circle
                        key={i}
                        cx={center}
                        cy={center}
                        r={RADIUS}
                        stroke={seg.category.color}
                        strokeWidth={STROKE_WIDTH}
                        fill="none"
                        strokeDasharray={`${dash} ${gap}`}
                        strokeDashoffset={offset}
                        strokeLinecap="butt"
                      />
                    );
                  })}
                </Svg>

                {/* Center label */}
                <View style={[styles.chartCenter, { width: CHART_SIZE, height: CHART_SIZE }]}>
                  <Text style={{ color: colors.muted, fontSize: 12, marginBottom: 2 }}>總支出</Text>
                  <Text style={{ color: colors.foreground, fontSize: 20, fontWeight: '700' }}>
                    NT$ {total.toLocaleString('zh-TW')}
                  </Text>
                </View>
              </View>

              {/* Legend */}
              <View style={{ gap: 8, marginTop: 8 }}>
                {breakdown.map((item) => (
                  <View
                    key={item.category.id}
                    style={[styles.legendRow, { backgroundColor: colors.surface }]}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10 }}>
                      <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: item.category.color }} />
                      <Text style={{ fontSize: 16 }}>{item.category.icon}</Text>
                      <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: '500' }}>
                        {item.category.name}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: '600' }}>
                        NT$ {item.amount.toLocaleString('zh-TW')}
                      </Text>
                      <Text style={{ color: colors.muted, fontSize: 12 }}>
                        {item.percentage.toFixed(1)}%
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  periodCard: {
    flex: 1,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 0.5,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  chartCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    padding: 12,
  },
});
