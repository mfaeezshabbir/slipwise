import { View } from '@/components/Themed';
import { createExpense } from '@/services/expense';
import { createIncome } from '@/services/income';
import { useRouter, useLocalSearchParams } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Colors from '@/constants/Colors';
import { Header } from '@/components/Header';
import { ExpenseForm, type ExpenseFormData } from '@/components/ExpenseForm';
import { IncomeForm, type IncomeFormData } from '@/components/IncomeForm';
import { useColorScheme } from '@/components/useColorScheme';

type TransactionType = 'income' | 'expense';

export default function AddTransactionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
  const [loading, setLoading] = useState(false);
  const [transactionType, setTransactionType] = useState<TransactionType>('expense');
  const [initialData, setInitialData] = useState<ExpenseFormData | IncomeFormData | undefined>();

  // Determine transaction type from params or default to expense
  useEffect(() => {
    const type = (params.type as string) || 'expense';
    setTransactionType((type === 'income' ? 'income' : 'expense') as TransactionType);
  }, [params.type]);

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

  const handleSubmit = async (data: ExpenseFormData | IncomeFormData) => {
    try {
      setLoading(true);

      if (transactionType === 'income') {
        await createIncome({
          title: data.title,
          amount: parseFloat(data.amount),
          date: data.date,
          note: data.note || undefined,
          categoryId: data.categoryId,
        });
      } else {
        await createExpense({
          title: data.title,
          amount: parseFloat(data.amount),
          date: data.date,
          note: data.note || undefined,
          categoryId: data.categoryId,
        });
      }

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

  const isIncome = transactionType === 'income';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title={isIncome ? 'Add Income' : 'Add Expense'}
        subtitle={isIncome ? 'Record a new income source' : 'Create a new expense record'}
        showBackButton
        onBackPress={handleCancel}
      />

      {isIncome ? (
        <IncomeForm
          mode="add"
          initialData={initialData as IncomeFormData}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={loading}
          submitButtonText="Save"
        />
      ) : (
        <ExpenseForm
          mode="add"
          initialData={initialData as ExpenseFormData}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={loading}
          submitButtonText="Save"
          onOCR={handleOCR}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
