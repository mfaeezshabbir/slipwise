import { View } from '@/components/Themed';
import { createExpense } from '@/services/expense';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import Colors from '@/constants/Colors';
import { Header } from '@/components/Header';
import { ExpenseForm, type ExpenseFormData } from '@/components/ExpenseForm';
import { useColorScheme } from '@/components/useColorScheme';

export default function AddExpenseScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: ExpenseFormData) => {
    try {
      setLoading(true);

      await createExpense({
        title: data.title,
        amount: parseFloat(data.amount),
        date: data.date,
        note: data.note || undefined,
        categoryId: data.categoryId,
      });

      // Success - navigate back to home
      router.replace('/');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title="Add Expense"
        subtitle="Create a new expense record"
        showBackButton
        onBackPress={handleCancel}
      />

      <ExpenseForm
        mode="add"
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={loading}
        submitButtonText="Save Expense"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
