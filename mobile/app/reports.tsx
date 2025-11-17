import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  Pressable,
  View as RNView,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Text, View } from '@/components/Themed';
import { Header } from '@/components/Header';
import Colors, { spacing, typography } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { getAllExpenses, type Expense } from '@/services/expense';
import { useTheme } from '@/context/ThemeContext';
import { Card } from '@/components/Card';
import { LineChart, PieChart, BarChart } from 'react-native-chart-kit';
import { TrendingUp, Calendar } from 'lucide-react-native';

type FilterPeriod = '7d' | '30d' | '90d' | 'all';

const chartConfig = {
  backgroundGradientFrom: '#fff',
  backgroundGradientFromOpacity: 0,
  backgroundGradientTo: '#fff',
  backgroundGradientToOpacity: 0,
  color: (opacity = 1) => `rgba(26, 255, 146, ${opacity})`,
  strokeWidth: 2.5,
  barPercentage: 0.65,
  useShadowColorFromDataset: false,
  decimalPlaces: 2,
};

interface CategoryTotal {
  category: string;
  total: number;
  percentage: number;
}

interface DailyTotal {
  date: string;
  amount: number;
}

export default function Analytics() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
  const { currencySymbol } = useTheme();
  const screenWidth = Dimensions.get('window').width - spacing.lg * 2;

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterPeriod>('30d');
  const [categoryData, setCategoryData] = useState<CategoryTotal[]>([]);
  const [dailyData, setDailyData] = useState<DailyTotal[]>([]);
  const [stats, setStats] = useState({
    totalExpenses: 0,
    averageExpense: 0,
    maxExpense: 0,
    minExpense: 0,
    dailyAverage: 0,
  });

  const getDateRange = (period: FilterPeriod): { start: Date; end: Date } => {
    const end = new Date();
    const start = new Date();

    switch (period) {
      case '7d':
        start.setDate(start.getDate() - 7);
        break;
      case '30d':
        start.setDate(start.getDate() - 30);
        break;
      case '90d':
        start.setDate(start.getDate() - 90);
        break;
      case 'all':
        start.setFullYear(start.getFullYear() - 10);
        break;
    }
    return { start, end };
  };

  const loadAndProcessExpenses = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAllExpenses();
      setExpenses(data);

      const { start, end } = getDateRange(filter);
      const filteredExpenses = data.filter((expense) => {
        const expenseDate = new Date(expense.date);
        return expenseDate >= start && expenseDate <= end;
      });

      const categoryMap = new Map<string, number>();
      const dailyMap = new Map<string, number>();

      filteredExpenses.forEach((expense) => {
        const category = (expense as any).category?.name || 'Other';
        categoryMap.set(category, (categoryMap.get(category) || 0) + Number(expense.amount));

        const date = new Date(expense.date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        });
        dailyMap.set(date, (dailyMap.get(date) || 0) + Number(expense.amount));
      });

      const totalExpenses = filteredExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
      const averageExpense =
        filteredExpenses.length > 0 ? totalExpenses / filteredExpenses.length : 0;
      const maxExpense =
        filteredExpenses.length > 0
          ? Math.max(...filteredExpenses.map((e) => Number(e.amount)))
          : 0;
      const minExpense =
        filteredExpenses.length > 0
          ? Math.min(...filteredExpenses.map((e) => Number(e.amount)))
          : 0;
      const daysInRange = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      const dailyAverage = totalExpenses / daysInRange;

      setStats({
        totalExpenses,
        averageExpense,
        maxExpense,
        minExpense,
        dailyAverage,
      });

      const categories = Array.from(categoryMap.entries())
        .map(([category, total]) => ({
          category,
          total,
          percentage: (total / totalExpenses) * 100 || 0,
        }))
        .sort((a, b) => b.total - a.total);

      const daily = Array.from(dailyMap.entries())
        .map(([date, amount]) => ({ date, amount }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      setCategoryData(categories);
      setDailyData(daily);
    } catch (err) {
      console.error('Analytics load error:', err);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useFocusEffect(
    useCallback(() => {
      loadAndProcessExpenses();
    }, [loadAndProcessExpenses])
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

  const pieChartData = categoryData.slice(0, 5).map((item, index) => ({
    name: item.category,
    amount: item.total,
    color: ['#F97316', '#3B82F6', '#EC4899', '#10B981', '#6366F1'][index % 5],
    legendFontColor: colors.text,
    legendFontSize: 12,
  }));

  const lineChartData = {
    labels: dailyData.slice(-14).map((d) => d.date.split(' ')[1] || d.date),
    datasets: [
      {
        data: dailyData.slice(-14).map((d) => d.amount),
        color: () => colors.primary,
        strokeWidth: 2.5,
      },
    ],
  };

  const barChartData = {
    labels: categoryData.slice(0, 5).map((c) => c.category.substring(0, 10)),
    datasets: [
      {
        data: categoryData.slice(0, 5).map((c) => c.total),
        color: () => colors.primary,
      },
    ],
  };

  const filterPeriods: { label: string; value: FilterPeriod }[] = [
    { label: '7D', value: '7d' },
    { label: '30D', value: '30d' },
    { label: '90D', value: '90d' },
    { label: 'All', value: 'all' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="Analytics" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Filter Buttons */}
        <View style={styles.filterContainer}>
          {filterPeriods.map((period) => (
            <Pressable
              key={period.value}
              onPress={() => setFilter(period.value)}
              style={({ pressed }) => [
                styles.filterButton,
                {
                  backgroundColor: filter === period.value ? colors.primary : colors.cardBackground,
                  borderColor: filter === period.value ? colors.primary : colors.border,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  {
                    color: filter === period.value ? '#fff' : colors.textSecondary,
                    fontWeight: filter === period.value ? '700' : '600',
                  },
                ]}
              >
                {period.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryGrid}>
          <Card
            style={[styles.summaryCard, { borderLeftWidth: 4, borderLeftColor: colors.primary }]}
          >
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Total</Text>
            <Text style={[styles.summaryValue, { color: colors.primary }]}>
              {currencySymbol}
              {stats.totalExpenses.toFixed(2)}
            </Text>
          </Card>

          <Card
            style={[styles.summaryCard, { borderLeftWidth: 4, borderLeftColor: colors.success }]}
          >
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Daily Avg</Text>
            <Text style={[styles.summaryValue, { color: colors.success }]}>
              {currencySymbol}
              {stats.dailyAverage.toFixed(2)}
            </Text>
          </Card>

          <Card
            style={[styles.summaryCard, { borderLeftWidth: 4, borderLeftColor: colors.secondary }]}
          >
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Per Item</Text>
            <Text style={[styles.summaryValue, { color: colors.secondary }]}>
              {currencySymbol}
              {stats.averageExpense.toFixed(2)}
            </Text>
          </Card>

          <Card
            style={[styles.summaryCard, { borderLeftWidth: 4, borderLeftColor: colors.danger }]}
          >
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Highest</Text>
            <Text style={[styles.summaryValue, { color: colors.danger }]}>
              {currencySymbol}
              {stats.maxExpense.toFixed(2)}
            </Text>
          </Card>
        </View>

        {/* Spending Trend Chart */}
        {dailyData.length > 0 && (
          <Card style={[styles.chartCard, styles.chartCardElevated]}>
            <View style={styles.chartHeader}>
              <View style={styles.chartTitleContainer}>
                <TrendingUp size={20} color={colors.primary} style={{ marginRight: spacing.sm }} />
                <Text style={[styles.chartTitle, { color: colors.text }]}>Spending Trend</Text>
              </View>
              <Text style={[styles.chartSubtitle, { color: colors.textSecondary }]}>
                Last {dailyData.length} days
              </Text>
            </View>

            <View style={[styles.chartGradient, { backgroundColor: colors.backgroundSecondary }]}>
              <LineChart
                data={lineChartData}
                width={screenWidth}
                height={240}
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
            </View>
          </Card>
        )}

        {/* Category Breakdown (Pie Chart) */}
        {pieChartData.length > 0 && (
          <Card style={[styles.chartCard, styles.chartCardElevated]}>
            <View style={styles.chartHeader}>
              <Text style={[styles.chartTitle, { color: colors.text }]}>Spending by Category</Text>
              <Text style={[styles.chartSubtitle, { color: colors.textSecondary }]}>
                Top 5 categories
              </Text>
            </View>

            <View style={styles.chartGradient}>
              <PieChart
                data={pieChartData}
                width={screenWidth}
                height={240}
                chartConfig={chartConfig}
                accessor="amount"
                backgroundColor="transparent"
                paddingLeft="15"
                center={[screenWidth / 2 - spacing.lg, 0]}
              />
            </View>
          </Card>
        )}

        {/* Top Categories (Bar Chart) */}
        {barChartData.datasets[0].data.length > 0 && (
          <Card style={[styles.chartCard, styles.chartCardElevated]}>
            <View style={styles.chartHeader}>
              <Text style={[styles.chartTitle, { color: colors.text }]}>Top Categories</Text>
              <Text style={[styles.chartSubtitle, { color: colors.textSecondary }]}>
                Ranked by amount
              </Text>
            </View>

            <View style={styles.chartGradient}>
              <BarChart
                data={barChartData}
                width={screenWidth}
                height={240}
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
            </View>
          </Card>
        )}

        {/* Category Details Table */}
        {categoryData.length > 0 && (
          <Card style={styles.tableCard}>
            <Text style={[styles.chartTitle, { color: colors.text, marginBottom: spacing.lg }]}>
              Category Breakdown
            </Text>
            {categoryData.map((item, index) => (
              <RNView key={index}>
                <View style={styles.tableRow}>
                  <View style={styles.tableRowLeft}>
                    <Text style={[styles.categoryName, { color: colors.text }]}>
                      {item.category}
                    </Text>
                    <View
                      style={[styles.percentageBadge, { backgroundColor: `${colors.primary}20` }]}
                    >
                      <Text style={[styles.percentageText, { color: colors.primary }]}>
                        {item.percentage.toFixed(1)}%
                      </Text>
                    </View>
                  </View>
                  <View style={styles.tableRowRight}>
                    <Text style={[styles.categoryAmount, { color: colors.danger }]}>
                      {currencySymbol}
                      {item.total.toFixed(2)}
                    </Text>
                  </View>
                </View>
                <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        backgroundColor: ['#F97316', '#3B82F6', '#EC4899', '#10B981', '#6366F1'][
                          index % 5
                        ],
                        width: `${item.percentage}%`,
                      },
                    ]}
                  />
                </View>
                {index !== categoryData.length - 1 && (
                  <View style={[styles.tableDivider, { backgroundColor: colors.border }]} />
                )}
              </RNView>
            ))}
          </Card>
        )}

        {/* Empty State */}
        {expenses.length === 0 && (
          <View style={styles.emptyContainer}>
            <Calendar size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No expenses yet</Text>
            <Text style={[styles.emptySubtext, { color: colors.textTertiary }]}>
              Start adding expenses to see analytics
            </Text>
          </View>
        )}
      </ScrollView>
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
  filterContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
    justifyContent: 'space-between',
  },
  filterButton: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterButtonText: {
    fontSize: 12,
    letterSpacing: 0.5,
  },
  summaryGrid: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  summaryCard: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryValue: {
    ...typography.h5,
    fontWeight: '700',
  },
  chartCard: {
    marginBottom: spacing.lg,
    paddingBottom: spacing.lg,
  },
  chartCardElevated: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  chartHeader: {
    marginBottom: spacing.lg,
  },
  chartTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  chartTitle: {
    ...typography.labelLarge,
    fontWeight: '700',
  },
  chartSubtitle: {
    fontSize: 12,
  },
  chartGradient: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  chart: {
    borderRadius: 12,
  },
  tableCard: {
    marginBottom: spacing.lg,
  },
  tableRow: {
    marginBottom: spacing.md,
  },
  tableRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  tableRowRight: {
    alignItems: 'flex-end',
  },
  categoryName: {
    ...typography.bodyMedium,
    fontWeight: '600',
    flex: 1,
  },
  percentageBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 8,
  },
  percentageText: {
    fontSize: 11,
    fontWeight: '700',
  },
  categoryAmount: {
    ...typography.labelLarge,
    fontWeight: '700',
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  tableDivider: {
    height: 1,
    marginVertical: spacing.md,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.huge,
    gap: spacing.md,
  },
  emptyText: {
    ...typography.h6,
  },
  emptySubtext: {
    ...typography.bodySmall,
  },
});
