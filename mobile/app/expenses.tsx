import React, { useState, useCallback, useMemo } from 'react';
import { StyleSheet, FlatList, ActivityIndicator, Pressable, View as RNView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Text, View } from '@/components/Themed';
import { Header } from '@/components/Header';
import Colors, { spacing } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { getAllExpenses, type Expense } from '@/services/expense';
import { getAllIncomes, type Income } from '@/services/income';
import { useTheme } from '@/context/ThemeContext';
import { Button } from '@/components/Button';

type TransactionType = 'all' | 'income' | 'expense';
type PeriodType = 'daily' | 'weekly' | 'monthly' | 'all';

interface Transaction {
  id: string;
  title: string;
  amount: number;
  date: string;
  note?: string;
  category?: { id: string; name: string };
  isIncome: boolean; // true for income, false for expense
  account?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface GroupedTransaction {
  date: string;
  transactions: Transaction[];
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function getGroupKey(date: string, period: PeriodType): string {
  const d = new Date(date);
  if (period === 'daily') {
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } else if (period === 'weekly') {
    const week = getWeekNumber(d);
    const year = d.getFullYear();
    return `Week ${week} of ${year}`;
  } else if (period === 'monthly') {
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }
  return 'All Time';
}

export default function History() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { currencySymbol } = useTheme();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [transactionType, setTransactionType] = useState<TransactionType>('all');
  const [period, setPeriod] = useState<PeriodType>('all');

  const loadTransactions = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const [expenseData, incomeData] = await Promise.all([getAllExpenses(), getAllIncomes()]);
      setExpenses(expenseData);
      setIncomes(incomeData);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load transactions';
      console.error('History load error:', err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadTransactions();
    }, [loadTransactions])
  );

  // Combine and filter transactions by type
  const filteredTransactions = useMemo(() => {
    let combined: Transaction[] = [];

    if (transactionType !== 'income') {
      combined = combined.concat(
        expenses.map((e) => ({
          id: e.id,
          title: e.title,
          amount: e.amount,
          date: e.date,
          note: e.note,
          category: e.category,
          isIncome: false,
          account: e.account,
          createdAt: e.createdAt,
          updatedAt: e.updatedAt,
        }))
      );
    }

    if (transactionType !== 'expense') {
      combined = combined.concat(
        incomes.map((i) => ({
          id: i.id,
          title: i.title,
          amount: i.amount,
          date: i.date,
          note: i.note,
          category: i.category,
          isIncome: true,
          account: i.account,
          createdAt: i.createdAt,
          updatedAt: i.updatedAt,
        }))
      );
    }

    return combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [expenses, incomes, transactionType]);

  // Group transactions by period
  const groupedTransactions = useMemo(() => {
    const groups: { [key: string]: GroupedTransaction } = {};

    filteredTransactions.forEach((transaction) => {
      const key = getGroupKey(transaction.date, period);
      if (!groups[key]) {
        groups[key] = { date: key, transactions: [] };
      }
      groups[key].transactions.push(transaction);
    });

    return Object.values(groups);
  }, [filteredTransactions, period]);

  const handleExpensePress = (expenseId: string) => {
    router.push(`/expense/${expenseId}`);
  };

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Loading history...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="History" />

      {/* Transaction Type Tabs */}
      <View style={[styles.filterContainer, { backgroundColor: colors.cardBackground }]}>
        <Pressable
          onPress={() => setTransactionType('all')}
          style={({ pressed }) => [
            styles.filterButton,
            {
              backgroundColor: transactionType === 'all' ? colors.primary : 'transparent',
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <Text
            style={[
              styles.filterButtonText,
              { color: transactionType === 'all' ? '#fff' : colors.text },
            ]}
          >
            All
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setTransactionType('income')}
          style={({ pressed }) => [
            styles.filterButton,
            {
              backgroundColor: transactionType === 'income' ? colors.success : 'transparent',
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <Text
            style={[
              styles.filterButtonText,
              { color: transactionType === 'income' ? '#fff' : colors.text },
            ]}
          >
            Income
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setTransactionType('expense')}
          style={({ pressed }) => [
            styles.filterButton,
            {
              backgroundColor: transactionType === 'expense' ? colors.danger : 'transparent',
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <Text
            style={[
              styles.filterButtonText,
              { color: transactionType === 'expense' ? '#fff' : colors.text },
            ]}
          >
            Expenses
          </Text>
        </Pressable>
      </View>

      {/* Period Selector */}
      <View style={[styles.filterContainer, { backgroundColor: colors.cardBackground }]}>
        <Pressable
          onPress={() => setPeriod('daily')}
          style={({ pressed }) => [
            styles.filterButton,
            {
              backgroundColor: period === 'daily' ? colors.primary : 'transparent',
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <Text
            style={[styles.filterButtonText, { color: period === 'daily' ? '#fff' : colors.text }]}
          >
            Daily
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setPeriod('weekly')}
          style={({ pressed }) => [
            styles.filterButton,
            {
              backgroundColor: period === 'weekly' ? colors.primary : 'transparent',
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <Text
            style={[styles.filterButtonText, { color: period === 'weekly' ? '#fff' : colors.text }]}
          >
            Weekly
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setPeriod('monthly')}
          style={({ pressed }) => [
            styles.filterButton,
            {
              backgroundColor: period === 'monthly' ? colors.primary : 'transparent',
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <Text
            style={[
              styles.filterButtonText,
              { color: period === 'monthly' ? '#fff' : colors.text },
            ]}
          >
            Monthly
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setPeriod('all')}
          style={({ pressed }) => [
            styles.filterButton,
            {
              backgroundColor: period === 'all' ? colors.primary : 'transparent',
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <Text
            style={[styles.filterButtonText, { color: period === 'all' ? '#fff' : colors.text }]}
          >
            All Time
          </Text>
        </Pressable>
      </View>

      {error && (
        <View style={[styles.errorContainer, { backgroundColor: colors.backgroundSecondary }]}>
          <Text style={[styles.errorText, { color: colors.danger }]}>⚠️ {error}</Text>
          <Button
            size="sm"
            variant="outline"
            onPress={loadTransactions}
            style={{ marginTop: spacing.md }}
          >
            Retry
          </Button>
        </View>
      )}

      {!error && filteredTransactions.length === 0 && (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No {transactionType === 'all' ? 'transactions' : transactionType}s found
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.textTertiary }]}>
            {transactionType === 'all'
              ? 'Create your first transaction to get started'
              : `Try viewing all transactions or adjust the period filter`}
          </Text>
        </View>
      )}

      <FlatList
        data={groupedTransactions}
        keyExtractor={(item) => item.date}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 50 }]}
        scrollEnabled={groupedTransactions.length > 0}
        renderItem={({ item: group }) => (
          <RNView key={group.date}>
            {/* Group Header */}
            <Text style={[styles.groupHeader, { color: colors.textSecondary }]}>{group.date}</Text>

            {/* Transactions in group */}
            {group.transactions.map((transaction) => (
              <Pressable
                key={transaction.id}
                onPress={() => handleExpensePress(transaction.id)}
                style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
              >
                <View
                  style={[
                    styles.item,
                    { backgroundColor: colors.cardBackground, borderColor: colors.border },
                  ]}
                >
                  <View style={styles.itemHeader}>
                    <Text style={[styles.itemTitle, { color: colors.text }]}>
                      {transaction.title}
                    </Text>
                    <Text
                      style={[
                        styles.itemAmount,
                        {
                          color: transaction.isIncome ? colors.success : colors.danger,
                        },
                      ]}
                    >
                      {transaction.isIncome ? '+' : '-'}
                      {currencySymbol}
                      {Number(transaction.amount).toFixed(2)}
                    </Text>
                  </View>
                  <Text style={[styles.itemMeta, { color: colors.textSecondary }]}>
                    {new Date(transaction.date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </Text>
                  {transaction.note && (
                    <Text
                      style={[styles.itemNote, { color: colors.textTertiary }]}
                      numberOfLines={1}
                    >
                      {transaction.note}
                    </Text>
                  )}
                </View>
              </Pressable>
            ))}
          </RNView>
        )}
      />
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
    fontSize: 16,
    fontWeight: '500',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
    borderRadius: 8,
  },
  filterButton: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  errorContainer: {
    margin: spacing.lg,
    padding: spacing.lg,
    borderRadius: 12,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  emptySubtext: {
    fontSize: 14,
  },
  list: {
    padding: spacing.lg,
  },
  groupHeader: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  item: {
    padding: spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  itemTitle: {
    fontWeight: '700',
    flex: 1,
  },
  itemAmount: {
    fontWeight: '700',
    marginLeft: spacing.md,
  },
  itemMeta: {
    fontSize: 13,
    marginBottom: spacing.xs,
  },
  itemNote: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: spacing.xs,
  },
});
