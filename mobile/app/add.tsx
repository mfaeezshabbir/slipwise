import { View, Text } from '@/components/Themed';
import { createExpense } from '@/services/expense';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, ScrollView, Alert, View as RNView } from 'react-native';
import Colors, { spacing, typography, borderRadius } from '@/constants/Colors';
import { TextInput } from '@/components/TextInput';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Header } from '@/components/Header';
import { useColorScheme } from '@/components/useColorScheme';

interface FormErrors {
  title?: string;
  amount?: string;
  date?: string;
}

export default function AddExpenseScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const validateForm = () => {
    const newErrors: FormErrors = {};

    if (!title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!amount.trim()) {
      newErrors.amount = 'Amount is required';
    } else {
      const amountNum = parseFloat(amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        newErrors.amount = 'Amount must be a positive number';
      }
    }

    if (!date.trim()) {
      newErrors.date = 'Date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      const amountNum = parseFloat(amount);

      await createExpense({
        title: title.trim(),
        amount: amountNum,
        date,
        note: note.trim() || undefined,
      });

      // Success - navigate back
      router.replace('/');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create expense';
      console.error('[AddExpense] Error:', err);
      Alert.alert('Error', msg);
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

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Card shadowSize="small">
          <View style={styles.formContainer}>
            {/* Title Input */}
            <TextInput
              label="Title"
              placeholder="e.g., Groceries, Gas, Coffee"
              value={title}
              onChangeText={(text) => {
                setTitle(text);
                if (errors.title) setErrors({ ...errors, title: undefined });
              }}
              error={errors.title}
              editable={!loading}
            />

            {/* Amount Input */}
            <TextInput
              label="Amount"
              placeholder="0.00"
              value={amount}
              onChangeText={(text) => {
                setAmount(text);
                if (errors.amount) setErrors({ ...errors, amount: undefined });
              }}
              keyboardType="decimal-pad"
              error={errors.amount}
              editable={!loading}
            />

            {/* Date Input */}
            <TextInput
              label="Date"
              placeholder={new Date().toISOString().split('T')[0]}
              value={date}
              onChangeText={(text) => {
                setDate(text);
                if (errors.date) setErrors({ ...errors, date: undefined });
              }}
              hint="Format: YYYY-MM-DD"
              editable={!loading}
            />

            {/* Note Input */}
            <RNView style={styles.noteSection}>
              <Text style={[styles.noteLabel, { color: colors.text }]}>Note (Optional)</Text>
              <RNView
                style={[
                  styles.noteInputWrapper,
                  {
                    backgroundColor: colors.inputBackground,
                    borderColor: colors.inputBorder,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.noteInputText,
                    { color: note ? colors.text : colors.textTertiary },
                  ]}
                >
                  {note || 'Add any additional notes...'}
                </Text>
              </RNView>
            </RNView>

            {/* Category Suggestion */}
            {title && (
              <Card variant="outlined">
                <Text style={[styles.suggestionText, { color: colors.textSecondary }]}>
                  💡 Tip: Include category keywords like "food", "transport", "shopping",
                  "entertainment", "health", or "utilities" in your title or note for better
                  organization.
                </Text>
              </Card>
            )}
          </View>
        </Card>
      </ScrollView>

      {/* Action Buttons */}
      <View style={[styles.buttonContainer, { backgroundColor: colors.background }]}>
        <Button
          variant="outline"
          size="md"
          onPress={handleCancel}
          disabled={loading}
          fullWidth
          style={{ marginRight: spacing.md }}
        >
          Cancel
        </Button>
        <Button size="md" onPress={handleSubmit} disabled={loading} loading={loading} fullWidth>
          Save Expense
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.lg,
    paddingBottom: spacing.huge,
  },
  formContainer: {
    gap: spacing.md,
  },
  noteSection: {
    marginBottom: spacing.lg,
  },
  noteLabel: {
    ...typography.labelLarge,
    marginBottom: spacing.sm,
  },
  noteInputWrapper: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    minHeight: 100,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  noteScroll: {
    flex: 1,
  },
  noteInput: {
    flex: 1,
  },
  noteInputText: {
    ...typography.bodyMedium,
  },
  suggestionText: {
    ...typography.bodySmall,
    fontStyle: 'italic',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    gap: spacing.md,
  },
});
