import { View, Text } from '@/components/Themed';
import { getExpenseById, deleteExpense, updateExpense, type Expense } from '@/services/expense';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, ScrollView, Alert, ActivityIndicator, View as RNView } from 'react-native';
import Colors, { spacing, typography, borderRadius } from '@/constants/Colors';
import { Header } from '@/components/Header';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { TextInput } from '@/components/TextInput';
import { CategoryIcon } from '@/components/Icons';
import { useColorScheme } from '@/components/useColorScheme';

interface FormErrors {
  title?: string;
  amount?: string;
  date?: string;
}

export default function ExpenseDetailScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
  const { id } = useLocalSearchParams<{ id: string }>();
  const [expense, setExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

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
      const data = await getExpenseById(id as string);
      setExpense(data);
      setEditTitle(data.title);
      setEditAmount(data.amount.toString());
      setEditDate(data.date.split('T')[0]);
      setEditNote(data.note || '');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load expense';
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

  const validateForm = () => {
    const newErrors: FormErrors = {};

    if (!editTitle.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!editAmount.trim()) {
      newErrors.amount = 'Amount is required';
    } else {
      const amountNum = parseFloat(editAmount);
      if (isNaN(amountNum) || amountNum <= 0) {
        newErrors.amount = 'Amount must be a positive number';
      }
    }

    if (!editDate.trim()) {
      newErrors.date = 'Date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);
      if (!id) return;
      const amountNum = parseFloat(editAmount);
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
      Alert.alert('Error', msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Loading expense...
        </Text>
      </View>
    );
  }

  if (!expense) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Header title="Not Found" showBackButton onBackPress={() => router.back()} />
        <View style={styles.centerContent}>
          <Text style={[styles.errorTitle, { color: colors.danger }]}>Expense not found</Text>
          <Button onPress={() => router.back()} style={{ marginTop: spacing.lg }}>
            Go Back
          </Button>
        </View>
      </View>
    );
  }

  if (editing) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Header title="Edit Expense" showBackButton onBackPress={() => setEditing(false)} />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Card shadowSize="small">
            <View style={styles.formContainer}>
              <TextInput
                label="Title"
                value={editTitle}
                onChangeText={(text) => {
                  setEditTitle(text);
                  if (errors.title) setErrors({ ...errors, title: undefined });
                }}
                error={errors.title}
                editable={!saving}
              />

              <TextInput
                label="Amount"
                value={editAmount}
                onChangeText={(text) => {
                  setEditAmount(text);
                  if (errors.amount) setErrors({ ...errors, amount: undefined });
                }}
                keyboardType="decimal-pad"
                error={errors.amount}
                editable={!saving}
              />

              <TextInput
                label="Date"
                value={editDate}
                onChangeText={(text) => {
                  setEditDate(text);
                  if (errors.date) setErrors({ ...errors, date: undefined });
                }}
                hint="Format: YYYY-MM-DD"
                editable={!saving}
              />

              <RNView style={styles.noteSection}>
                <Text style={[styles.noteLabel, { color: colors.text }]}>Note</Text>
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
                      { color: editNote ? colors.text : colors.textTertiary },
                    ]}
                  >
                    {editNote || 'Add notes...'}
                  </Text>
                </RNView>
              </RNView>
            </View>
          </Card>
        </ScrollView>

        <View style={[styles.buttonContainer, { backgroundColor: colors.background }]}>
          <Button
            variant="outline"
            size="md"
            onPress={() => setEditing(false)}
            disabled={saving}
            fullWidth
            style={{ marginRight: spacing.md }}
          >
            Cancel
          </Button>
          <Button size="md" onPress={handleSave} disabled={saving} loading={saving} fullWidth>
            Save Changes
          </Button>
        </View>
      </View>
    );
  }

  const getCategoryColor = (note?: string) => {
    const categoryKeywords: Record<string, string> = {
      food: '#F97316',
      transport: '#3B82F6',
      entertainment: '#EC4899',
      health: '#10B981',
      shopping: '#6366F1',
      utilities: '#F59E0B',
    };

    if (!note) return '#6B7280';
    const lowerNote = note.toLowerCase();
    for (const [key, color] of Object.entries(categoryKeywords)) {
      if (lowerNote.includes(key)) return color;
    }
    return '#6B7280';
  };

  const categoryColor = getCategoryColor(expense.note);
  const category = expense.note?.split(/[,\s]/)[0] || 'Other';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="Expense Details" showBackButton onBackPress={() => router.back()} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Amount Card */}
        <Card shadowSize="large" variant="elevated">
          <View style={styles.amountCard}>
            <View style={[styles.amountIconContainer, { backgroundColor: categoryColor + '20' }]}>
              <CategoryIcon category={category} size={48} color={categoryColor} />
            </View>
            <View style={styles.amountTextContainer}>
              <Text style={[styles.amountLabel, { color: colors.textSecondary }]}>Amount</Text>
              <Text style={[styles.amount, { color: colors.danger }]}>
                ${Number(expense.amount).toFixed(2)}
              </Text>
            </View>
          </View>
        </Card>

        {/* Details Card */}
        <Card>
          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Title</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>{expense.title}</Text>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Date</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>
                {new Date(expense.date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
            </View>

            {expense.note && (
              <>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                    Category
                  </Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>{category}</Text>
                </View>

                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Notes</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>{expense.note}</Text>
                </View>
              </>
            )}

            {expense.createdAt && (
              <>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Created</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {new Date(expense.createdAt).toLocaleString()}
                  </Text>
                </View>
              </>
            )}
          </View>
        </Card>
      </ScrollView>

      {/* Action Buttons */}
      <View style={[styles.actionContainer, { backgroundColor: colors.background }]}>
        <Button
          variant="outline"
          size="md"
          onPress={() => setEditing(true)}
          fullWidth
          style={{ marginRight: spacing.md }}
        >
          Edit
        </Button>
        <Button variant="danger" size="md" onPress={handleDelete} fullWidth>
          Delete
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.lg,
    paddingBottom: spacing.huge,
  },
  loadingText: {
    ...typography.bodyMedium,
    fontWeight: '600',
    marginTop: spacing.lg,
  },
  errorTitle: {
    ...typography.h4,
    textAlign: 'center',
  },
  amountCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  amountIconContainer: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.lg,
  },
  amountTextContainer: {
    flex: 1,
  },
  amountLabel: {
    ...typography.bodySmall,
    marginBottom: spacing.xs,
  },
  amount: {
    ...typography.h2,
    fontWeight: '700',
  },
  detailsContainer: {
    gap: spacing.md,
  },
  detailRow: {
    paddingVertical: spacing.md,
  },
  detailLabel: {
    ...typography.labelMedium,
    marginBottom: spacing.xs,
  },
  detailValue: {
    ...typography.bodyMedium,
  },
  divider: {
    height: 1,
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
  noteInputText: {
    ...typography.bodyMedium,
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
  actionContainer: {
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
