import type { Expense } from '@/services/expense';
import React from 'react';
import { StyleSheet } from 'react-native';
import { Text, View } from './Themed';

export default function ExpenseItem({ expense }: { expense: Expense }) {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={styles.vendor}>{expense.vendor}</Text>
        <Text style={styles.amount}>${Number(expense.amount).toFixed(2)}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.meta}>{new Date(expense.date).toLocaleDateString()}</Text>
        <Text style={styles.meta}>{expense.category ?? 'Uncategorized'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  vendor: {
    fontWeight: '600',
    color: '#0f172a',
  },
  amount: {
    fontWeight: '700',
    color: '#2A3A69',
  },
  meta: {
    color: '#6b7280',
    fontSize: 12,
  },
});
