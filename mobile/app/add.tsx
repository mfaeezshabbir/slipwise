import { View } from '@/components/Themed';
import { createExpense } from '@/services/expense';
import { useRouter, useLocalSearchParams } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Colors from '@/constants/Colors';
import { Header } from '@/components/Header';
import { ExpenseForm, type ExpenseFormData } from '@/components/ExpenseForm';
import { useColorScheme } from '@/components/useColorScheme';

export default function AddExpenseScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
  const [loading, setLoading] = useState(false);
  const [initialData, setInitialData] = useState<ExpenseFormData | undefined>();

  // Parse OCR data from route params if available
  useEffect(() => {
    if (params.title || params.amount || params.note) {
      setInitialData({
        title: (params.title as string) || '',
        amount: (params.amount as string) || '',
        date: (params.date as string) || new Date().toISOString().split('T')[0],
        note: (params.note as string) || '',
        categoryId: (params.categoryId as string) || undefined,
      });
    }
  }, [params.title, params.amount, params.note, params.date, params.categoryId]);

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

  const handleOCR = () => {
    router.push('/ocr');
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
        initialData={initialData}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={loading}
        submitButtonText="Save Expense"
        onOCR={handleOCR}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
