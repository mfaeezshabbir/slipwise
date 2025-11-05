import type { Expense } from '@/services/expense';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Pressable } from 'react-native';
import { Text, View } from './Themed';

export default function ExpenseItem({ expense }: { expense: Expense }) {
  const router = useRouter();

  const handlePress = () => {
    router.push(`/${expense.id}` as any);
  };

  return (
    <Pressable onPress={handlePress}>
      <View style={styles.container}>
        <View style={styles.row}>
          <Text style={styles.title}>{expense.title}</Text>
          <Text style={styles.amount}>${Number(expense.amount).toFixed(2)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.meta}>{new Date(expense.date).toLocaleDateString()}</Text>
          {expense.note && <Text style={styles.note}>{expense.note}</Text>}
        </View>
      </View>
    </Pressable>
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
  title: {
    fontWeight: '600',
    color: '#0f172a',
    flex: 1,
  },
  amount: {
    fontWeight: '700',
    color: '#2A3A69',
  },
  meta: {
    color: '#6b7280',
    fontSize: 12,
  },
  note: {
    color: '#6b7280',
    fontSize: 12,
    maxWidth: 150,
  },
});
