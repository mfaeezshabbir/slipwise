import ExpenseItem from '@/components/ExpenseItem';
import { Text, View } from '@/components/Themed';
import { getAllExpenses, type Expense } from '@/services/expense';
import Colors, { spacing, typography, borderRadius } from '@/constants/Colors';
import { useRouter, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  View as RNView,
} from 'react-native';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { AppLogo } from '@/components/Logo';
import { FAB } from '@/components/FAB';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useColorScheme } from '@/components/useColorScheme';

export default function DashboardScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadExpenses = useCallback(async () => {
    try {
      setError(null);
      const data = await getAllExpenses();
      setExpenses(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load expenses';
      console.error('Dashboard load error:', err);
      setError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (loading) {
        loadExpenses();
      }
    }, [loading, loadExpenses])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadExpenses();
  }, [loadExpenses]);

  const total = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const averageExpense = expenses.length > 0 ? total / expenses.length : 0;

  if (loading && !refreshing) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <AppLogo size={64} />
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: spacing.lg }} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Loading expenses...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header with Logo and Theme Toggle */}
      <View style={styles.headerSection}>
        <View style={styles.headerContent}>
          <View style={styles.logoSection}>
            <AppLogo size={40} />
            <View>
              <Text style={[styles.appName, { color: colors.text }]}>SlipWise</Text>
              <Text style={[styles.appTagline, { color: colors.textSecondary }]}>
                Track & Manage
              </Text>
            </View>
          </View>
          <View style={styles.headerActions}>
            <ThemeToggle />
          </View>
        </View>
      </View>

      {/* Summary Stats */}
      <Card shadowSize="medium" variant="elevated">
        <View style={styles.summaryGrid}>
          <View style={styles.statBlock}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total</Text>
            <Text style={[styles.statValue, { color: colors.primary }]}>${total.toFixed(2)}</Text>
          </View>

          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />

          <View style={styles.statBlock}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Items</Text>
            <Text style={[styles.statValue, { color: colors.success }]}>{expenses.length}</Text>
          </View>

          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />

          <View style={styles.statBlock}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Average</Text>
            <Text style={[styles.statValue, { color: colors.secondary }]}>
              ${averageExpense.toFixed(2)}
            </Text>
          </View>
        </View>
      </Card>

      {/* Error Message */}
      {error && (
        <Card shadowSize="small" variant="outlined">
          <View style={styles.errorContent}>
            <Text style={[styles.errorText, { color: colors.danger }]}>⚠️ {error}</Text>
            <Button
              size="sm"
              variant="outline"
              onPress={loadExpenses}
              style={{ marginTop: spacing.md }}
            >
              Retry
            </Button>
          </View>
        </Card>
      )}

      {/* Expenses List */}
      <View style={styles.listSection}>
        <Text style={[styles.listTitle, { color: colors.text }]}>Recent Expenses</Text>
        <FlatList
          scrollEnabled={false}
          data={expenses}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[!expenses.length && styles.emptyList]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            !error ? (
              <View style={styles.emptyStateContainer}>
                <View
                  style={[styles.emptyStateIcon, { backgroundColor: colors.backgroundSecondary }]}
                >
                  <AppLogo size={48} />
                </View>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  No expenses yet
                </Text>
                <Text style={[styles.emptySubtext, { color: colors.textTertiary }]}>
                  Create your first expense to get started
                </Text>
              </View>
            ) : null
          }
          renderItem={({ item }) => <ExpenseItem expense={item} />}
        />
      </View>

      {/* Floating Action Button */}
      {/* <View style={styles.fabContainer}>
        <FAB onPress={() => router.push('/add' as any)} label="+ Add Expense" size="large" />
      </View> */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: spacing.lg,
    paddingBottom: spacing.huge + spacing.xl,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.lg,
    ...typography.bodyMedium,
  },
  headerSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appName: {
    ...typography.h3,
    marginLeft: spacing.md,
    fontWeight: '700',
  },
  appTagline: {
    ...typography.bodySmall,
    marginLeft: spacing.md,
    marginTop: spacing.xs,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statBlock: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    marginHorizontal: spacing.md,
  },
  statLabel: {
    ...typography.labelSmall,
    marginBottom: spacing.xs,
  },
  statValue: {
    ...typography.h5,
    fontWeight: '700',
  },
  errorContent: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  errorText: {
    ...typography.bodyMedium,
    fontWeight: '500',
  },
  listSection: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  listTitle: {
    ...typography.h5,
    fontWeight: '700',
    marginBottom: spacing.lg,
  },
  emptyList: {
    flexGrow: 1,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.huge,
  },
  emptyStateIcon: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  emptyText: {
    ...typography.h6,
    marginBottom: spacing.sm,
  },
  emptySubtext: {
    ...typography.bodySmall,
  },
  fabContainer: {
    position: 'absolute',
    bottom: spacing.lg,
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: 'transparent',
  },
});
