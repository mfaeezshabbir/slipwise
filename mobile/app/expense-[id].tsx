import { View, Text } from '@/components/Themed';
import { getExpenseById, deleteExpense, updateExpense, type Expense } from '@/services/expense';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import Colors, { spacing, typography, borderRadius } from '@/constants/Colors';
import { Header } from '@/components/Header';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { CategoryIcon } from '@/components/Icons';
import { ExpenseForm, type ExpenseFormData } from '@/components/ExpenseForm';
import { useColorScheme } from '@/components/useColorScheme';
import { useTheme } from '@/context/ThemeContext';

export default function ExpenseDetailScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
  const { currencySymbol } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [expense, setExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadExpense();
  }, [id]);

  const loadExpense = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await getExpenseById(id as string);
      setExpense(data);
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

  const handleEditSubmit = async (data: ExpenseFormData) => {
    try {
      setSaving(true);
      if (!id) return;

      await updateExpense(id as string, {
        title: data.title,
        amount: parseFloat(data.amount),
        date: data.date,
        note: data.note || undefined,
        categoryId: data.categoryId,
      });

      setEditing(false);
      await loadExpense();
    } finally {
      setSaving(false);
    }
  };

  const handleEditCancel = () => {
    setEditing(false);
  };

  // Loading state
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

  // Not found state
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

  // Editing mode - show form
  if (editing) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Header title="Edit Expense" showBackButton onBackPress={handleEditCancel} />

        <ExpenseForm
          mode="edit"
          initialData={{
            title: expense.title,
            amount: expense.amount.toString(),
            date: expense.date.split('T')[0],
            note: expense.note || '',
            categoryId: (expense as any).category?.id,
          }}
          onSubmit={handleEditSubmit}
          onCancel={handleEditCancel}
          isLoading={saving}
          submitButtonText="Save Changes"
        />
      </View>
    );
  }

  // Detail view
  const getCategoryColor = (categoryName?: string, note?: string): string => {
    const categoryKeywords: Record<string, string> = {
      food: '#F97316',
      transport: '#3B82F6',
      entertainment: '#EC4899',
      health: '#10B981',
      shopping: '#6366F1',
      utilities: '#F59E0B',
    };

    // First try the category name
    if (categoryName) {
      const lower = categoryName.toLowerCase();
      for (const [key, color] of Object.entries(categoryKeywords)) {
        if (lower.includes(key)) return color;
      }
    }

    // Then try the note
    if (note) {
      const lower = note.toLowerCase();
      for (const [key, color] of Object.entries(categoryKeywords)) {
        if (lower.includes(key)) return color;
      }
    }

    return '#6B7280';
  };

  const categoryColor = getCategoryColor((expense as any).category?.name, expense.note);
  const category = (expense as any).category?.name || expense.note?.split(/[,\s]/)[0] || 'Other';

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
                {currencySymbol}
                {Number(expense.amount).toFixed(2)}
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

            {(expense as any).category || expense.note ? (
              <>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                    Category
                  </Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>{category}</Text>
                </View>
              </>
            ) : null}

            {expense.note ? (
              <>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Notes</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>{expense.note}</Text>
                </View>
              </>
            ) : null}

            {expense.createdAt ? (
              <>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Created</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {new Date(expense.createdAt).toLocaleString()}
                  </Text>
                </View>
              </>
            ) : null}
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
