import { View, Text } from '@/components/Themed';
import { createExpense } from '@/services/expense';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  StyleSheet,
  TextInput,
  Pressable,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';

export default function AddExpenseScreen() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Validation', 'Title is required');
      return;
    }

    if (!amount.trim()) {
      Alert.alert('Validation', 'Amount is required');
      return;
    }

    if (!date.trim()) {
      Alert.alert('Validation', 'Date is required');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      Alert.alert('Validation', 'Amount must be a positive number');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await createExpense({
        title: title.trim(),
        amount: amountNum,
        date,
        note: note.trim() || undefined,
      });

      router.replace('/');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create expense';
      console.error('[AddExpense] Error:', err);
      setError(msg);
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>Add New Expense</Text>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.formGroup}>
        <Text style={styles.label}>Title *</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="e.g., Groceries, Gas, Coffee"
          editable={!loading}
          placeholderTextColor="#9ca3af"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Amount *</Text>
        <TextInput
          style={styles.input}
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          placeholder="12.50"
          editable={!loading}
          placeholderTextColor="#9ca3af"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Date *</Text>
        <TextInput
          style={styles.input}
          value={date}
          onChangeText={setDate}
          placeholder="YYYY-MM-DD"
          editable={!loading}
          placeholderTextColor="#9ca3af"
        />
        <Text style={styles.hint}>Format: YYYY-MM-DD</Text>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Note (optional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={note}
          onChangeText={setNote}
          placeholder="Add any additional notes..."
          multiline
          numberOfLines={4}
          editable={!loading}
          placeholderTextColor="#9ca3af"
        />
      </View>

      <View style={styles.buttonGroup}>
        <Pressable
          style={[styles.button, styles.cancelButton]}
          onPress={handleCancel}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#374151" />
          ) : (
            <Text style={styles.cancelButtonText}>Cancel</Text>
          )}
        </Pressable>
        <Pressable
          style={[styles.button, styles.submitButton]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Save Expense</Text>
          )}
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
  },
  heading: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  errorContainer: {
    backgroundColor: '#fee2e2',
    borderLeftWidth: 4,
    borderLeftColor: '#dc2626',
    padding: 12,
    borderRadius: 6,
    marginBottom: 16,
  },
  errorText: {
    color: '#991b1b',
    fontWeight: '500',
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontWeight: '600',
    marginBottom: 8,
    color: '#0f172a',
  },
  hint: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#0f172a',
  },
  textArea: {
    textAlignVertical: 'top',
    paddingTop: 12,
    minHeight: 100,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#e5e7eb',
  },
  cancelButtonText: {
    color: '#374151',
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#2A3A69',
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
