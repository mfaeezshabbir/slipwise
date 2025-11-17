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
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  ChevronDown,
  Zap,
  AlertCircle,
  Target,
  Flame,
  ArrowUp,
  ArrowDown,
} from 'lucide-react-native';

type PeriodType = 'week' | 'month' | 'quarter' | 'year';
type TransactionType = 'all' | 'income' | 'expense';

interface DayData {
  day: string;
  amount: number;
  fullDay: string;
}

interface CategoryBreakdown {
  category: string;
  amount: number;
  percentage: number;
  trend?: 'up' | 'down' | 'neutral';
  trendPercent?: number;
}

interface Insight {
  type: 'warning' | 'success' | 'info';
  title: string;
  description: string;
  icon: string;
}

interface PeriodStats {
  total: number;
  income: number;
  expenses: number;
  dailyAverage: number;
  previousTotal: number;
  changePercent: number;
  mostExpensiveDay: { day: string; amount: number };
  leastExpensiveDay: { day: string; amount: number };
  categories: CategoryBreakdown[];
  dailyData: DayData[];
  highestSpendingDay: { day: string; amount: number };
  budgetUtilization: number;
  insights: Insight[];
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
  const { currencySymbol, dailyBudget } = useTheme();
  const screenWidth = Dimensions.get('window').width - spacing.lg * 2;

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<PeriodType>('week');
  const [showPeriodPicker, setShowPeriodPicker] = useState(false);
  const [transactionType, setTransactionType] = useState<TransactionType>('all');
  const [stats, setStats] = useState<PeriodStats>({
    total: 0,
    income: 0,
    expenses: 0,
    dailyAverage: 0,
    previousTotal: 0,
    changePercent: 0,
    mostExpensiveDay: { day: '', amount: 0 },
    leastExpensiveDay: { day: '', amount: 0 },
    highestSpendingDay: { day: '', amount: 0 },
    budgetUtilization: 0,
    categories: [],
    dailyData: [],
    insights: [],
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

      // Filter by transaction type
      let filteredData = data;
      if (transactionType === 'income') {
        filteredData = data.filter((e) => (e.type || 'expense') === 'income');
      } else if (transactionType === 'expense') {
        filteredData = data.filter((e) => (e.type || 'expense') === 'expense');
      }

      // Current period
      const currentExpenses = filteredData.filter((e) => {
        const d = new Date(e.date);
        return d >= start && d <= end;
      });

      // Previous period
      const previousExpenses = filteredData.filter((e) => {
        const d = new Date(e.date);
        return d >= prevStart && d <= prevEnd;
      });

      // Calculate totals for income and expenses separately
      const allCurrentExpenses = data.filter((e) => {
        const d = new Date(e.date);
        return d >= start && d <= end;
      });

      const incomeTotal = allCurrentExpenses
        .filter((e) => (e.type || 'expense') === 'income')
        .reduce((sum, e) => sum + Number(e.amount), 0);

      const expenseTotal = allCurrentExpenses
        .filter((e) => (e.type || 'expense') === 'expense')
        .reduce((sum, e) => sum + Number(e.amount), 0);

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

      // Find most and least expensive days
      const mostExpensiveDay =
        dailyData.length > 0
          ? dailyData.reduce((max, d) => (d.amount > max.amount ? d : max))
          : { day: '', amount: 0, fullDay: '' };

      const leastExpensiveDay =
        dailyData.filter((d) => d.amount > 0).length > 0
          ? dailyData
              .filter((d) => d.amount > 0)
              .reduce((min, d) => (d.amount < min.amount ? d : min))
          : { day: '', amount: 0, fullDay: '' };

      // Categories with trend analysis
      const categoryMap = new Map<string, number>();
      const categoryMapPrev = new Map<string, number>();

      currentExpenses.forEach((e) => {
        const cat = (e as any).category?.name || 'Other';
        categoryMap.set(cat, (categoryMap.get(cat) || 0) + Number(e.amount));
      });

      previousExpenses.forEach((e) => {
        const cat = (e as any).category?.name || 'Other';
        categoryMapPrev.set(cat, (categoryMapPrev.get(cat) || 0) + Number(e.amount));
      });

      const categories: CategoryBreakdown[] = Array.from(categoryMap.entries())
        .map(([name, amount]) => {
          const prevAmount = categoryMapPrev.get(name) || 0;
          const trendPercent = prevAmount > 0 ? ((amount - prevAmount) / prevAmount) * 100 : 0;
          let trend: 'up' | 'down' | 'neutral' = 'neutral';
          if (trendPercent > 5) trend = 'up';
          else if (trendPercent < -5) trend = 'down';

          return {
            category: name,
            amount,
            percentage: (amount / currentTotal) * 100 || 0,
            trend,
            trendPercent: Math.abs(trendPercent),
          };
        })
        .sort((a, b) => b.amount - a.amount);

      const daysInPeriod = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      const dailyAverage = currentTotal / daysInPeriod;

      // Budget utilization (using daily budget from context, only for expenses)
      const budgetPerDay = transactionType === 'income' ? 0 : dailyBudget;
      const totalBudget = budgetPerDay * daysInPeriod;
      const budgetUtilization = totalBudget > 0 ? (expenseTotal / totalBudget) * 100 : 0;

      // Generate insights
      const insights: Insight[] = [];

      if (transactionType !== 'income') {
        if (budgetUtilization > 100) {
          insights.push({
            type: 'warning',
            title: 'Over Budget',
            description: `You've spent ${(budgetUtilization - 100).toFixed(0)}% more than your typical daily budget.`,
            icon: '⚠️',
          });
        } else if (budgetUtilization < 50) {
          insights.push({
            type: 'success',
            title: 'Great Savings!',
            description: `You're ${(100 - budgetUtilization).toFixed(0)}% under your typical spending.`,
            icon: '🎉',
          });
        }
      }

      if (categories.length > 0 && categories[0].trend === 'up' && categories[0].trendPercent) {
        insights.push({
          type: 'warning',
          title: `${categories[0].category} Spike`,
          description: `${categories[0].category} is up ${categories[0].trendPercent.toFixed(0)}% compared to last period.`,
          icon: '📈',
        });
      }

      if (dailyAverage > dailyBudget * 1.2 && transactionType !== 'income') {
        insights.push({
          type: 'info',
          title: 'High Daily Average',
          description: `Your daily average of ${dailyAverage.toFixed(0)} is above your daily budget.`,
          icon: '💰',
        });
      }

      if (insights.length === 0) {
        insights.push({
          type: 'success',
          title: 'On Track',
          description:
            transactionType === 'income'
              ? "You're earning well! Keep it up."
              : 'Your spending patterns look healthy and consistent.',
          icon: '✅',
        });
      }

      setStats({
        total: currentTotal,
        income: incomeTotal,
        expenses: expenseTotal,
        dailyAverage,
        previousTotal,
        changePercent,
        mostExpensiveDay: {
          day: mostExpensiveDay.fullDay || mostExpensiveDay.day,
          amount: mostExpensiveDay.amount,
        },
        leastExpensiveDay: {
          day: leastExpensiveDay.fullDay || leastExpensiveDay.day,
          amount: leastExpensiveDay.amount,
        },
        highestSpendingDay: {
          day: mostExpensiveDay.fullDay || mostExpensiveDay.day,
          amount: mostExpensiveDay.amount,
        },
        budgetUtilization,
        categories,
        dailyData,
        insights,
      });
    } catch (err) {
      console.error('Analytics load error:', err);
    } finally {
      setLoading(false);
    }
  }, [period, transactionType, dailyBudget]);

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

        {/* Transaction Type Tabs */}
        <View style={styles.transactionTabs}>
          {(['all', 'income', 'expense'] as TransactionType[]).map((type) => (
            <Pressable
              key={type}
              onPress={() => setTransactionType(type)}
              style={({ pressed }) => [
                styles.transactionTab,
                {
                  backgroundColor:
                    transactionType === type
                      ? type === 'income'
                        ? colors.success
                        : type === 'expense'
                          ? colors.danger
                          : colors.primary
                      : colors.cardBackground,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <Text
                style={[
                  styles.transactionTabText,
                  {
                    color: transactionType === type ? '#fff' : colors.text,
                    fontWeight: transactionType === type ? '700' : '500',
                  },
                ]}
              >
                {type === 'all' ? 'All' : type === 'income' ? 'Income' : 'Expenses'}
              </Text>
            </Pressable>
          ))}
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

        {/* Cash Flow Summary */}
        {transactionType === 'all' && (
          <Card style={[styles.cashFlowCard, styles.elevation]}>
            <Text style={[styles.cashFlowTitle, { color: colors.text }]}>Cash Flow</Text>
            <View style={styles.cashFlowRow}>
              <View style={styles.cashFlowItem}>
                <Text style={[styles.cashFlowLabel, { color: colors.textSecondary }]}>Income</Text>
                <Text style={[styles.cashFlowAmount, { color: colors.success }]}>
                  {currencySymbol}
                  {stats.income.toFixed(0)}
                </Text>
              </View>
              <View style={styles.cashFlowDivider} />
              <View style={styles.cashFlowItem}>
                <Text style={[styles.cashFlowLabel, { color: colors.textSecondary }]}>
                  Expenses
                </Text>
                <Text style={[styles.cashFlowAmount, { color: colors.danger }]}>
                  {currencySymbol}
                  {stats.expenses.toFixed(0)}
                </Text>
              </View>
              <View style={styles.cashFlowDivider} />
              <View style={styles.cashFlowItem}>
                <Text style={[styles.cashFlowLabel, { color: colors.textSecondary }]}>Net</Text>
                <Text
                  style={[
                    styles.cashFlowAmount,
                    { color: stats.income - stats.expenses >= 0 ? colors.success : colors.danger },
                  ]}
                >
                  {currencySymbol}
                  {(stats.income - stats.expenses).toFixed(0)}
                </Text>
              </View>
            </View>
          </Card>
        )}

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
            {stats.dailyAverage < dailyBudget
              ? `Great! You didn't exceed your daily budget of ${currencySymbol}${dailyBudget.toFixed(2)}. 🎉`
              : `Your daily average is ${((stats.dailyAverage / dailyBudget) * 100 - 100).toFixed(0)}% higher than your budget.`}
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

        {/* Budget Utilization Card */}
        <Card style={[styles.budgetCard, styles.elevation]}>
          <View style={styles.budgetHeader}>
            <View style={styles.budgetTitleContainer}>
              <Target size={18} color={colors.primary} style={{ marginRight: spacing.sm }} />
              <Text style={[styles.budgetTitle, { color: colors.text }]}>Budget Status</Text>
            </View>
            <Text style={[styles.budgetPercent, { color: colors.primary }]}>
              {stats.budgetUtilization.toFixed(0)}%
            </Text>
          </View>

          <View style={styles.budgetBar}>
            <View
              style={[
                styles.budgetFill,
                {
                  width: `${Math.min(stats.budgetUtilization, 100)}%`,
                  backgroundColor:
                    stats.budgetUtilization > 100
                      ? colors.danger
                      : stats.budgetUtilization > 75
                        ? colors.warning
                        : colors.success,
                },
              ]}
            />
          </View>

          <Text style={[styles.budgetLabel, { color: colors.textSecondary }]}>
            {stats.budgetUtilization > 100
              ? `Over budget by ${currencySymbol}${(stats.total - 250 * Math.ceil((new Date().getTime() - new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime()) / (1000 * 60 * 60 * 24))).toFixed(0)}`
              : `Remaining budget: ${currencySymbol}${Math.max(0, 250 * Math.ceil((new Date().getTime() - new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime()) / (1000 * 60 * 60 * 24)) - stats.total).toFixed(0)}`}
          </Text>
        </Card>

        {/* Smart Insights Section */}
        <View style={styles.insightsSection}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Smart Insights</Text>
          </View>

          {stats.insights.map((insight, idx) => (
            <Card
              key={idx}
              style={[
                styles.insightItemCard,
                styles.elevation,
                {
                  borderLeftWidth: 4,
                  borderLeftColor:
                    insight.type === 'warning'
                      ? colors.warning
                      : insight.type === 'success'
                        ? colors.success
                        : colors.primary,
                },
              ]}
            >
              <View style={styles.insightItemContent}>
                <Text style={styles.insightIcon}>{insight.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.insightItemTitle, { color: colors.text }]}>
                    {insight.title}
                  </Text>
                  <Text style={[styles.insightItemDescription, { color: colors.textSecondary }]}>
                    {insight.description}
                  </Text>
                </View>
              </View>
            </Card>
          ))}
        </View>

        {/* Category Trends */}
        {stats.categories.length > 0 && (
          <Card style={[styles.trendsCard, styles.elevation]}>
            <View style={styles.trendsHeader}>
              <View style={styles.trendsTitleContainer}>
                <Flame size={18} color={colors.danger} style={{ marginRight: spacing.sm }} />
                <Text style={[styles.trendsTitle, { color: colors.text }]}>Category Trends</Text>
              </View>
            </View>

            <View style={styles.trendsList}>
              {stats.categories.slice(0, 5).map((cat, idx) => (
                <View key={idx} style={styles.trendItem}>
                  <View style={styles.trendLeft}>
                    <View
                      style={[
                        styles.trendDot,
                        {
                          backgroundColor: ['#F97316', '#3B82F6', '#EC4899', '#10B981', '#6366F1'][
                            idx % 5
                          ],
                        },
                      ]}
                    />
                    <View>
                      <Text style={[styles.trendCategory, { color: colors.text }]}>
                        {cat.category}
                      </Text>
                      {cat.trend && cat.trendPercent !== undefined && (
                        <View style={styles.trendIndicator}>
                          {cat.trend === 'up' ? (
                            <ArrowUp size={12} color={colors.danger} />
                          ) : cat.trend === 'down' ? (
                            <ArrowDown size={12} color={colors.success} />
                          ) : null}
                          <Text
                            style={[
                              styles.trendPercent,
                              {
                                color:
                                  cat.trend === 'up'
                                    ? colors.danger
                                    : cat.trend === 'down'
                                      ? colors.success
                                      : colors.textSecondary,
                              },
                            ]}
                          >
                            {cat.trend === 'neutral'
                              ? 'Stable'
                              : `${cat.trendPercent.toFixed(0)}% ${cat.trend === 'up' ? 'higher' : 'lower'}`}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <Text style={[styles.trendAmount, { color: colors.text }]}>
                    {currencySymbol}
                    {cat.amount.toFixed(0)}
                  </Text>
                </View>
              ))}
            </View>
          </Card>
        )}

        {/* Quick Stats */}
        <View style={styles.quickStatsGrid}>
          <Card style={[styles.quickStatCard, styles.elevation]}>
            <Text style={[styles.quickStatLabel, { color: colors.textSecondary }]}>
              Least Spent Day
            </Text>
            <Text style={[styles.quickStatValue, { color: colors.success }]}>
              {currencySymbol}
              {stats.leastExpensiveDay.amount.toFixed(0)}
            </Text>
            <Text style={[styles.quickStatDate, { color: colors.textSecondary }]}>
              {stats.leastExpensiveDay.day}
            </Text>
          </Card>

          <Card style={[styles.quickStatCard, styles.elevation]}>
            <Text style={[styles.quickStatLabel, { color: colors.textSecondary }]}>Per Item</Text>
            <Text style={[styles.quickStatValue, { color: colors.primary }]}>
              {currencySymbol}
              {expenses.length > 0 ? (stats.total / expenses.length).toFixed(2) : '0.00'}
            </Text>
            <Text style={[styles.quickStatDate, { color: colors.textSecondary }]}>Average</Text>
          </Card>
        </View>
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
  // Budget Card Styles
  budgetCard: {
    marginBottom: spacing.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  budgetTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  budgetTitle: {
    ...typography.labelLarge,
    fontWeight: '700',
  },
  budgetPercent: {
    ...typography.h5,
    fontWeight: '700',
  },
  budgetBar: {
    height: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  budgetFill: {
    height: '100%',
    borderRadius: 6,
  },
  budgetLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  // Insights Section Styles
  insightsSection: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.labelLarge,
    fontWeight: '700',
  },
  insightItemCard: {
    marginBottom: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  insightItemContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  insightIcon: {
    fontSize: 20,
    marginTop: spacing.xs,
  },
  insightItemTitle: {
    ...typography.labelMedium,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  insightItemDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  // Trends Card Styles
  trendsCard: {
    marginBottom: spacing.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  trendsHeader: {
    marginBottom: spacing.lg,
  },
  trendsTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendsTitle: {
    ...typography.labelLarge,
    fontWeight: '700',
  },
  trendsList: {
    gap: spacing.md,
  },
  trendItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  trendLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  trendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  trendCategory: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  trendIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  trendPercent: {
    fontSize: 11,
    fontWeight: '600',
  },
  trendAmount: {
    fontSize: 13,
    fontWeight: '700',
  },
  // Quick Stats Grid
  quickStatsGrid: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginBottom: spacing.lg,
  },
  quickStatCard: {
    flex: 1,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
  },
  quickStatLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  quickStatValue: {
    ...typography.h5,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  quickStatDate: {
    fontSize: 11,
  },
  // Transaction Type Tabs
  transactionTabs: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
    justifyContent: 'space-between',
  },
  transactionTab: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  transactionTabText: {
    fontSize: 13,
    fontWeight: '600',
  },
  // Cash Flow Card
  cashFlowCard: {
    marginBottom: spacing.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  cashFlowTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: spacing.lg,
  },
  cashFlowRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cashFlowItem: {
    flex: 1,
    alignItems: 'center',
  },
  cashFlowLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  cashFlowAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  cashFlowDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    marginHorizontal: spacing.md,
  },
});
