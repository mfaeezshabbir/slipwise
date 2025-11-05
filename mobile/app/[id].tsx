import { View, Text } from '@/components/Themed';
import { getExpenseById, deleteExpense, updateExpense, type Expense } from '@/services/expense';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import Colors from '@/constants/Colors';

export default function ExpenseDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [expense, setExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editTitle, setEditTitle] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editNote, setEditNote] = useState('');

  useEffect(() => {
    loadExpense();
  }, [id]);

  const loadExpense = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const data = await getExpenseById(id as string);
      setExpense(data);
      setEditTitle(data.title);
      setEditAmount(data.amount.toString());
      setEditDate(data.date.split('T')[0]);
      setEditNote(data.note || '');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load expense';
      setError(msg);
      Alert.alert('Error', msg);
      setTimeout(() => router.back(), 2000);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete Expense', 'Are you sure you want to delete this expense?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            if (!id) return;
            await deleteExpense(id as string);
            router.replace('/');
          } catch (err) {
            const msg = err instanceof Error ? err.message : 'Failed to delete expense';
            console.error('[ExpenseDetail] Delete error:', err);
            Alert.alert('Error', msg);
          }
        },
      },
    ]);
  };

  const handleSave = async () => {
    if (!editTitle.trim()) {
      Alert.alert('Validation', 'Title is required');
      return;
    }

    const amountNum = parseFloat(editAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      Alert.alert('Validation', 'Amount must be a positive number');
      return;
    }

    if (!editDate.trim()) {
      Alert.alert('Validation', 'Date is required');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      if (!id) return;
      await updateExpense(id as string, {
        title: editTitle.trim(),
        amount: amountNum,
        date: editDate,
        note: editNote.trim() || undefined,
      });
      setEditing(false);
      await loadExpense();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update expense';
      console.error('[ExpenseDetail] Update error:', err);
      setError(msg);
      Alert.alert('Error', msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.light.brandPrimary} />
        <Text style={styles.loadingText}>Loading expense...</Text>
      </View>
    );
  }

  if (!expense) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorTitle}>Expense not found</Text>
        {error && <Text style={styles.errorText}>{error}</Text>}
        <Pressable style={styles.button} onPress={() => router.back()}>
          <Text style={styles.buttonText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  if (editing) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.heading}>Edit Expense</Text>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.formGroup}>
          <Text style={styles.label}>Title *</Text>
          <TextInput
            style={styles.input}
            value={editTitle}
            onChangeText={setEditTitle}
            editable={!saving}
            placeholderTextColor="#9ca3af"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Amount *</Text>
          <TextInput
            style={styles.input}
            value={editAmount}
            onChangeText={setEditAmount}
            keyboardType="decimal-pad"
            editable={!saving}
            placeholderTextColor="#9ca3af"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Date *</Text>
          <TextInput
            style={styles.input}
            value={editDate}
            onChangeText={setEditDate}
            placeholder="YYYY-MM-DD"
            editable={!saving}
            placeholderTextColor="#9ca3af"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Note (optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={editNote}
            onChangeText={setEditNote}
            multiline
            numberOfLines={4}
            editable={!saving}
            placeholderTextColor="#9ca3af"
          />
        </View>

        <View style={styles.buttonGroup}>
          <Pressable
            style={[styles.button, styles.cancelButton]}
            onPress={() => setEditing(false)}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#374151" />
            ) : (
              <Text style={styles.cancelButtonText}>Cancel</Text>
            )}
          </Pressable>
          <Pressable
            style={[styles.button, styles.submitButton]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Save</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.amount}>${Number(expense.amount).toFixed(2)}</Text>
        <Text style={styles.title}>{expense.title}</Text>
        <Text style={styles.meta}>{new Date(expense.date).toLocaleDateString()}</Text>

        {expense.note && (
          <View style={styles.noteSection}>
            <Text style={styles.noteLabel}>Note</Text>
            <Text style={styles.noteText}>{expense.note}</Text>
          </View>
        )}

        {expense.createdAt && (
          <Text style={styles.timestamp}>
            Created: {new Date(expense.createdAt).toLocaleString()}
          </Text>
        )}
      </View>

      <View style={styles.actionGroup}>
        <Pressable style={[styles.button, styles.editButton]} onPress={() => setEditing(true)}>
          <Text style={styles.buttonText}>Edit</Text>
        </Pressable>
        <Pressable style={[styles.button, styles.deleteButton]} onPress={handleDelete}>
          <Text style={styles.deleteButtonText}>Delete</Text>
        </Pressable>
      </View>

      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>← Back</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
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
  heading: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#f8fafc',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  amount: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.light.brandPrimary,
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 8,
  },
  meta: {
    fontSize: 14,
    color: '#6b7280',
  },
  noteSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  noteLabel: {
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  noteText: {
    color: '#6b7280',
    lineHeight: 20,
  },
  timestamp: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 16,
    fontStyle: 'italic',
  },
  errorTitle: {
    color: '#dc2626',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
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
    marginTop: 20,
  },
  actionGroup: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButton: {
    backgroundColor: Colors.light.brandPrimary,
  },
  deleteButton: {
    backgroundColor: '#fee2e2',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#e5e7eb',
  },
  cancelButtonText: {
    color: '#374151',
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: Colors.light.brandPrimary,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  deleteButtonText: {
    color: '#dc2626',
    fontWeight: '600',
  },
  backButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  backButtonText: {
    color: Colors.light.brandPrimary,
    fontWeight: '600',
  },
});
