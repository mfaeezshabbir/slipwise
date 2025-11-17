import React, { useState, useCallback } from 'react';
import { StyleSheet, FlatList, ActivityIndicator, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Text, View } from '@/components/Themed';
import { Header } from '@/components/Header';
import Colors, { spacing } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { getAllExpenses, type Expense } from '@/services/expense';
import { useTheme } from '@/context/ThemeContext';
import { Button } from '@/components/Button';

export default function History() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { currencySymbol } = useTheme();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadExpenses = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const data = await getAllExpenses();
      setExpenses(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load expenses';
      console.error('History load error:', err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadExpenses();
    }, [loadExpenses])
  );

  const handleExpensePress = (expenseId: string) => {
    router.push(`/expense/${expenseId}`);
  };

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Loading expenses...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="History" />

      {error && (
        <View style={[styles.errorContainer, { backgroundColor: colors.backgroundSecondary }]}>
          <Text style={[styles.errorText, { color: colors.danger }]}>⚠️ {error}</Text>
          <Button
            size="sm"
            variant="outline"
            onPress={loadExpenses}
            style={{ marginTop: spacing.md }}
          >
            Retry
          </Button>
        </View>
      )}

      {!error && expenses.length === 0 && (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No expenses yet</Text>
          <Text style={[styles.emptySubtext, { color: colors.textTertiary }]}>
            Create your first expense to get started
          </Text>
        </View>
      )}

      <FlatList
        data={expenses}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 50 }]}
        scrollEnabled={expenses.length > 0}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => handleExpensePress(item.id)}
            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
          >
            <View
              style={[
                styles.item,
                { backgroundColor: colors.cardBackground, borderColor: colors.border },
              ]}
            >
              <View style={styles.itemHeader}>
                <Text style={[styles.itemTitle, { color: colors.text }]}>{item.title}</Text>
                <Text style={[styles.itemAmount, { color: colors.danger }]}>
                  {currencySymbol}
                  {Number(item.amount).toFixed(2)}
                </Text>
              </View>
              <Text style={[styles.itemMeta, { color: colors.textSecondary }]}>
                {new Date(item.date).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </Text>
              {item.note && (
                <Text style={[styles.itemNote, { color: colors.textTertiary }]} numberOfLines={1}>
                  {item.note}
                </Text>
              )}
            </View>
          </Pressable>
        )}
      />
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
  loadingText: {
    marginTop: spacing.lg,
    fontSize: 16,
    fontWeight: '500',
  },
  errorContainer: {
    margin: spacing.lg,
    padding: spacing.lg,
    borderRadius: 12,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  emptySubtext: {
    fontSize: 14,
  },
  list: {
    padding: spacing.lg,
  },
  item: {
    padding: spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  itemTitle: {
    fontWeight: '700',
    flex: 1,
  },
  itemAmount: {
    fontWeight: '700',
    marginLeft: spacing.md,
  },
  itemMeta: {
    fontSize: 13,
    marginBottom: spacing.xs,
  },
  itemNote: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: spacing.xs,
  },
});
