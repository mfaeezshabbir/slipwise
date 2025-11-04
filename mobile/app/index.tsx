import ExpenseItem from '@/components/ExpenseItem';
import { Text, View } from '@/components/Themed';
import { getAllExpenses } from '@/services/expense';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, View as RNView, StyleSheet, FlatList } from 'react-native';
import Colors from '@/constants/Colors';

export default function DashboardScreen() {
  const router = useRouter();
  const [expenses, setExpenses] = useState<any[]>([]);

  const total = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);

  useEffect(() => {
    const load = async () => {
      const all = await getAllExpenses();
      setExpenses(all);
    };
    load();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>SlipWise — Expenses</Text>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Total</Text>
        <Text style={styles.summaryAmount}>${total.toFixed(2)}</Text>
        <Text style={styles.summaryMeta}>{expenses.length} items</Text>
      </View>

      <FlatList
        data={expenses}
        keyExtractor={(i) => i.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>No expenses yet. Tap Add to create one.</Text>
        }
        renderItem={({ item }) => <ExpenseItem expense={item} />}
      />

      <Pressable style={styles.addButton} onPress={() => router.push('add' as any)}>
        <Text style={styles.addButtonText}>+ Add</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
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
  list: {
    flex: 1,
  },
  empty: { color: '#6b7280', padding: 12 },
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
