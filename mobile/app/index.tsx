import ExpenseItem from '@/components/ExpenseItem';
import { Text, View } from '@/components/Themed';
import { getAllExpenses, type Expense } from '@/services/expense';
import Colors from '@/constants/Colors';
import { useRouter, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from 'react-native';

export default function DashboardScreen() {
  const router = useRouter();
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

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.light.brandPrimary} />
        <Text style={styles.loadingText}>Loading expenses...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>SlipWise — Expenses</Text>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Total</Text>
        <Text style={styles.summaryAmount}>${total.toFixed(2)}</Text>
        <Text style={styles.summaryMeta}>{expenses.length} items</Text>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
          <Pressable onPress={loadExpenses} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      )}

      <FlatList
        data={expenses}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, !expenses.length && styles.emptyList]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          !error ? (
            <Text style={styles.empty}>No expenses yet. Create one to get started!</Text>
          ) : null
        }
        renderItem={({ item }) => <ExpenseItem expense={item} />}
      />

      <Pressable style={styles.addButton} onPress={() => router.push('/add' as any)}>
        <Text style={styles.addButtonText}>+ Add Expense</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: Colors.light.brandPrimary,
    fontWeight: '600',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  summaryCard: {
    backgroundColor: Colors.light.brandPrimary,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  summaryLabel: { color: '#dbeafe', fontSize: 12 },
  summaryAmount: { color: '#fff', fontSize: 24, fontWeight: '800', marginTop: 6 },
  summaryMeta: { color: '#e0f2f1', marginTop: 4 },
  errorContainer: {
    backgroundColor: '#fee2e2',
    borderLeftWidth: 4,
    borderLeftColor: '#dc2626',
    padding: 12,
    borderRadius: 6,
    marginBottom: 12,
  },
  errorText: {
    color: '#991b1b',
    fontWeight: '500',
    marginBottom: 8,
  },
  retryButton: {
    backgroundColor: '#dc2626',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  list: {
    flexGrow: 1,
  },
  emptyList: {
    justifyContent: 'center',
  },
  empty: {
    color: '#6b7280',
    padding: 12,
    textAlign: 'center',
    fontSize: 14,
  },
  addButton: {
    backgroundColor: '#2A3A69',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
