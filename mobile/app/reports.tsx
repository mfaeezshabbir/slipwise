import React, { useState, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  Pressable,
  Modal,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Text, View } from '@/components/Themed';
import { Header } from '@/components/Header';
import Colors, { spacing, typography } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { getAllExpenses, type Expense } from '@/services/expense';
import { useTheme } from '@/context/ThemeContext';
import { Card } from '@/components/Card';
import { BarChart } from 'react-native-chart-kit';
import { TrendingUp, TrendingDown, Calendar, ChevronDown, Zap } from 'lucide-react-native';

type PeriodType = 'week' | 'month' | 'quarter' | 'year';

interface DayData {
  day: string;
  amount: number;
  fullDay: string;
}

interface CategoryBreakdown {
  category: string;
  amount: number;
  percentage: number;
}

interface PeriodStats {
  total: number;
  dailyAverage: number;
  previousTotal: number;
  changePercent: number;
  mostExpensiveDay: { day: string; amount: number };
  categories: CategoryBreakdown[];
  dailyData: DayData[];
}

const chartConfig = {
  backgroundGradientFrom: '#fff',
  backgroundGradientFromOpacity: 0,
  backgroundGradientTo: '#fff',
  backgroundGradientToOpacity: 0,
  color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
  strokeWidth: 2,
  barPercentage: 0.7,
  useShadowColorFromDataset: false,
  decimalPlaces: 0,
};

export default function Analytics() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
  const { currencySymbol } = useTheme();
  const screenWidth = Dimensions.get('window').width - spacing.lg * 2;

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<PeriodType>('week');
  const [showPeriodPicker, setShowPeriodPicker] = useState(false);
  const [stats, setStats] = useState<PeriodStats>({
    total: 0,
    dailyAverage: 0,
    previousTotal: 0,
    changePercent: 0,
    mostExpensiveDay: { day: '', amount: 0 },
    categories: [],
    dailyData: [],
  });

  const getPeriodDates = (
    type: PeriodType
  ): { start: Date; end: Date; prevStart: Date; prevEnd: Date } => {
    const end = new Date();
    const start = new Date();
    const prevEnd = new Date(start);
    const prevStart = new Date(start);

    switch (type) {
      case 'week':
        const dayOfWeek = start.getDay();
        start.setDate(start.getDate() - dayOfWeek);
        prevEnd.setDate(prevEnd.getDate() - dayOfWeek - 1);
        prevStart.setDate(prevStart.getDate() - dayOfWeek - 8);
        break;
      case 'month':
        start.setDate(1);
        prevEnd.setMonth(prevEnd.getMonth(), 0);
        prevStart.setMonth(prevStart.getMonth() - 1, 1);
        break;
      case 'quarter':
        const quarter = Math.floor(start.getMonth() / 3);
        start.setMonth(quarter * 3, 1);
        prevEnd.setMonth(quarter * 3, 0);
        prevStart.setMonth((quarter - 1) * 3, 1);
        break;
      case 'year':
        start.setMonth(0, 1);
        prevEnd.setMonth(0, 0);
        prevStart.setFullYear(prevStart.getFullYear() - 1, 0, 1);
        break;
    }

    return { start, end, prevStart, prevEnd };
  };

  const processExpenses = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAllExpenses();
      setExpenses(data);

      const { start, end, prevStart, prevEnd } = getPeriodDates(period);

      // Current period
      const currentExpenses = data.filter((e) => {
        const d = new Date(e.date);
        return d >= start && d <= end;
      });

      // Previous period
      const previousExpenses = data.filter((e) => {
        const d = new Date(e.date);
        return d >= prevStart && d <= prevEnd;
      });

      // Calculate totals
      const currentTotal = currentExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
      const previousTotal = previousExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
      const changePercent =
        previousTotal > 0 ? ((currentTotal - previousTotal) / previousTotal) * 100 : 0;

      // Daily data (aggregated by day of week for week view, or by date for others)
      const dayMap = new Map<string, { name: string; amount: number; fullDay: string }>();
      const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

      currentExpenses.forEach((expense) => {
        const expenseDate = new Date(expense.date);
        if (period === 'week') {
          const dayOfWeek = daysOfWeek[expenseDate.getDay()];
          const fullDay = expenseDate.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'short',
            day: 'numeric',
          });
          dayMap.set(dayOfWeek, {
            name: dayOfWeek,
            amount: (dayMap.get(dayOfWeek)?.amount || 0) + Number(expense.amount),
            fullDay,
          });
        } else {
          const dateStr = expenseDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          });
          dayMap.set(dateStr, {
            name: dateStr,
            amount: (dayMap.get(dateStr)?.amount || 0) + Number(expense.amount),
            fullDay: dateStr,
          });
        }
      });

      const dailyData: DayData[] =
        period === 'week'
          ? daysOfWeek.map((day) => ({
              day,
              amount: dayMap.get(day)?.amount || 0,
              fullDay: dayMap.get(day)?.fullDay || '',
            }))
          : Array.from(dayMap.values()).map((v) => ({
              day: v.name,
              amount: v.amount,
              fullDay: v.fullDay,
            }));

      // Find most expensive day
      const mostExpensiveDay =
        dailyData.length > 0
          ? dailyData.reduce((max, d) => (d.amount > max.amount ? d : max))
          : { day: '', amount: 0, fullDay: '' };

      // Categories
      const categoryMap = new Map<string, number>();
      currentExpenses.forEach((e) => {
        const cat = (e as any).category?.name || 'Other';
        categoryMap.set(cat, (categoryMap.get(cat) || 0) + Number(e.amount));
      });

      const categories: CategoryBreakdown[] = Array.from(categoryMap.entries())
        .map(([name, amount]) => ({
          category: name,
          amount,
          percentage: (amount / currentTotal) * 100 || 0,
        }))
        .sort((a, b) => b.amount - a.amount);

      const daysInPeriod = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      const dailyAverage = currentTotal / daysInPeriod;

      setStats({
        total: currentTotal,
        dailyAverage,
        previousTotal,
        changePercent,
        mostExpensiveDay: {
          day: mostExpensiveDay.fullDay || mostExpensiveDay.day,
          amount: mostExpensiveDay.amount,
        },
        categories,
        dailyData,
      });
    } catch (err) {
      console.error('Analytics load error:', err);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useFocusEffect(
    useCallback(() => {
      processExpenses();
    }, [processExpenses])
  );

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Loading analytics...
        </Text>
      </View>
    );
  }

  const barChartData = {
    labels: stats.dailyData.map((d) => d.day),
    datasets: [
      {
        data: stats.dailyData.map((d) => d.amount),
        color: () => colors.primary,
      },
    ],
  };

  const periodLabels = {
    week: 'This Week',
    month: 'This Month',
    quarter: 'This Quarter',
    year: 'This Year',
  };

  const isPositiveChange = stats.changePercent >= 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="Analytics" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Period Selector */}
        <View style={styles.periodSelector}>
          <Pressable
            onPress={() => setShowPeriodPicker(true)}
            style={({ pressed }) => [
              styles.periodButton,
              {
                backgroundColor: colors.cardBackground,
                borderColor: colors.border,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <Text style={[styles.periodButtonText, { color: colors.text }]}>
              {periodLabels[period]}
            </Text>
            <ChevronDown
              size={18}
              color={colors.textSecondary}
              style={{ marginLeft: spacing.sm }}
            />
          </Pressable>
        </View>

        {/* Header Stats */}
        <View style={styles.headerStats}>
          <View style={styles.changeIndicator}>
            <View
              style={[
                styles.changeIcon,
                { backgroundColor: isPositiveChange ? colors.secondary : colors.danger },
              ]}
            >
              {isPositiveChange ? (
                <TrendingUp size={20} color="#fff" />
              ) : (
                <TrendingDown size={20} color="#fff" />
              )}
            </View>
            <View>
              <Text
                style={[
                  styles.changePercent,
                  { color: isPositiveChange ? colors.secondary : colors.danger },
                ]}
              >
                {isPositiveChange ? '↑' : '↓'}
                {Math.abs(stats.changePercent).toFixed(1)}%
              </Text>
              <Text style={[styles.changeLabel, { color: colors.textSecondary }]}>
                than {period === 'week' ? 'last week' : 'last period'}
              </Text>
            </View>
          </View>

          <View style={styles.totalDisplay}>
            <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>Total Spent</Text>
            <Text style={[styles.totalAmount, { color: colors.text }]}>
              {currencySymbol}
              {stats.total.toFixed(0)}
            </Text>
          </View>
        </View>

        {/* Daily Spending Chart */}
        {stats.dailyData.length > 0 && (
          <Card style={[styles.chartCard, styles.elevation]}>
            <BarChart
              data={barChartData}
              width={screenWidth}
              height={200}
              yAxisLabel={currencySymbol}
              yAxisSuffix=""
              chartConfig={{
                ...chartConfig,
                backgroundGradientFrom: colors.cardBackground,
                backgroundGradientTo: colors.cardBackground,
                color: () => colors.primary,
                labelColor: () => colors.textSecondary,
              }}
              style={styles.chart}
              withVerticalLabels
              withHorizontalLabels
            />
          </Card>
        )}

        {/* Daily Average */}
        <Card style={styles.averageCard}>
          <View style={styles.averageHeader}>
            <Text style={[styles.averageLabel, { color: colors.textSecondary }]}>
              Daily Average
            </Text>
            <Text style={[styles.averageAmount, { color: colors.primary }]}>
              {currencySymbol}
              {stats.dailyAverage.toFixed(2)}
            </Text>
          </View>
          <Text style={[styles.averageInsight, { color: colors.textSecondary }]}>
            {stats.dailyAverage < 250
              ? `Great! You didn't exceed your daily average threshold of ${currencySymbol}250. 🎉`
              : `Your daily average is higher than the typical threshold of ${currencySymbol}250.`}
          </Text>
        </Card>

        {/* Weekly Insight */}
        <Card style={[styles.insightCard, styles.elevation]}>
          <View style={styles.insightHeader}>
            <View style={styles.insightTitleContainer}>
              <Zap size={18} color={colors.warning} style={{ marginRight: spacing.sm }} />
              <Text style={[styles.insightTitle, { color: colors.text }]}>
                {period === 'week' ? 'Weekly' : 'Period'} Insight
              </Text>
            </View>
            <Pressable style={styles.moreButton}>
              <Text style={[styles.moreButtonText, { color: colors.textSecondary }]}>⋯</Text>
            </Pressable>
          </View>

          <View style={styles.insightContent}>
            <View>
              <Text style={[styles.insightDate, { color: colors.text }]}>
                {stats.mostExpensiveDay.day}
              </Text>
              <Text style={[styles.insightDateLabel, { color: colors.textSecondary }]}>
                Most Expensive Day
              </Text>
            </View>
            <Text style={[styles.insightAmount, { color: colors.danger }]}>
              {currencySymbol}
              {stats.mostExpensiveDay.amount.toFixed(2)}
            </Text>
          </View>

          {/* Category bars */}
          <View style={styles.categoryBars}>
            {stats.categories.map((cat, idx) => (
              <View key={idx} style={styles.categoryBarContainer}>
                <View
                  style={[
                    styles.categoryBar,
                    {
                      backgroundColor: ['#F97316', '#3B82F6', '#EC4899', '#10B981', '#6366F1'][
                        idx % 5
                      ],
                      width: `${cat.percentage}%`,
                    },
                  ]}
                />
              </View>
            ))}
          </View>

          {/* Category list */}
          <View style={styles.categoryList}>
            {stats.categories.slice(0, 4).map((cat, idx) => (
              <View key={idx} style={styles.categoryRow}>
                <View style={styles.categoryRowLeft}>
                  <View
                    style={[
                      styles.categoryDot,
                      {
                        backgroundColor: ['#F97316', '#3B82F6', '#EC4899', '#10B981', '#6366F1'][
                          idx % 5
                        ],
                      },
                    ]}
                  />
                  <Text style={[styles.categoryName, { color: colors.text }]}>{cat.category}</Text>
                </View>
                <Text style={[styles.categoryRowAmount, { color: colors.text }]}>
                  {currencySymbol}
                  {cat.amount.toFixed(2)}
                </Text>
              </View>
            ))}
          </View>
        </Card>
      </ScrollView>

      {/* Period Picker Modal */}
      <Modal
        visible={showPeriodPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPeriodPicker(false)}
      >
        <Pressable
          style={[styles.modalOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}
          onPress={() => setShowPeriodPicker(false)}
        >
          <Card style={[styles.periodModal, { backgroundColor: colors.cardBackground }]}>
            {(['week', 'month', 'quarter', 'year'] as PeriodType[]).map((p) => (
              <Pressable
                key={p}
                onPress={() => {
                  setPeriod(p);
                  setShowPeriodPicker(false);
                }}
                style={({ pressed }) => [
                  styles.periodOption,
                  {
                    backgroundColor: period === p ? `${colors.primary}20` : 'transparent',
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.periodOptionText,
                    {
                      color: period === p ? colors.primary : colors.text,
                      fontWeight: period === p ? '700' : '500',
                    },
                  ]}
                >
                  {periodLabels[p]}
                </Text>
              </Pressable>
            ))}
          </Card>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.lg,
    ...typography.bodyMedium,
    fontWeight: '600',
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.huge,
  },
  periodSelector: {
    marginBottom: spacing.lg,
  },
  periodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
  },
  periodButtonText: {
    ...typography.labelLarge,
    fontWeight: '600',
  },
  headerStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xl,
    gap: spacing.lg,
  },
  changeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  changeIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  changePercent: {
    ...typography.labelLarge,
    fontWeight: '700',
  },
  changeLabel: {
    fontSize: 12,
    marginTop: spacing.xs,
  },
  totalDisplay: {
    alignItems: 'flex-end',
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: spacing.xs,
  },
  totalAmount: {
    ...typography.h4,
    fontWeight: '700',
  },
  chartCard: {
    marginBottom: spacing.lg,
    paddingVertical: spacing.lg,
  },
  elevation: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 6,
  },
  chart: {
    borderRadius: 12,
  },
  averageCard: {
    marginBottom: spacing.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  averageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  averageLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  averageAmount: {
    ...typography.h5,
    fontWeight: '700',
  },
  averageInsight: {
    fontSize: 13,
    lineHeight: 18,
  },
  insightCard: {
    marginBottom: spacing.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  insightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  insightTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  insightTitle: {
    ...typography.labelLarge,
    fontWeight: '700',
  },
  moreButton: {
    padding: spacing.sm,
  },
  moreButtonText: {
    fontSize: 18,
  },
  insightContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  insightDate: {
    ...typography.labelLarge,
    fontWeight: '700',
  },
  insightDateLabel: {
    fontSize: 12,
    marginTop: spacing.xs,
  },
  insightAmount: {
    ...typography.h5,
    fontWeight: '700',
  },
  categoryBars: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  categoryBarContainer: {
    flex: 1,
    height: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  categoryBar: {
    height: '100%',
    borderRadius: 4,
  },
  categoryList: {
    gap: spacing.md,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  categoryName: {
    fontSize: 13,
    fontWeight: '500',
  },
  categoryRowAmount: {
    fontSize: 13,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  periodModal: {
    borderRadius: 16,
    overflow: 'hidden',
    minWidth: 180,
  },
  periodOption: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  periodOptionText: {
    ...typography.bodyMedium,
    textAlign: 'center',
  },
});
