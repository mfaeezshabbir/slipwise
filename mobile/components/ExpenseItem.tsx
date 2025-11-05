import type { Expense } from '@/services/expense';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Pressable } from 'react-native';
import { Text, View } from './Themed';
import { Card } from './Card';
import { CategoryIcon } from './Icons';
import { useColorScheme } from './useColorScheme';
import Colors, { spacing, typography } from '@/constants/Colors';

export default function ExpenseItem({ expense }: { expense: Expense }) {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

  const handlePress = () => {
    router.push(`/${expense.id}` as any);
  };

  // Determine category color based on category
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

  const formattedDate = new Date(expense.date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  const dayOfWeek = new Date(expense.date).toLocaleDateString('en-US', {
    weekday: 'short',
  });

  return (
    <Pressable onPress={handlePress} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
      <Card>
        <View style={styles.content}>
          {/* Left section: Icon and category */}
          <View style={styles.leftSection}>
            <View style={[styles.iconContainer, { backgroundColor: categoryColor + '20' }]}>
              <CategoryIcon category={category} size={24} color={categoryColor} />
            </View>
            <View style={styles.categoryInfo}>
              <Text style={[styles.category, { color: colors.text }]}>{expense.title}</Text>
              <Text style={[styles.date, { color: colors.textSecondary }]}>
                {dayOfWeek}, {formattedDate}
              </Text>
            </View>
          </View>

          {/* Right section: Amount */}
          <View style={styles.rightSection}>
            <Text style={[styles.amount, { color: colors.danger }]}>
              ${Number(expense.amount).toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Note section */}
        {expense.note && (
          <Text style={[styles.note, { color: colors.textTertiary }]} numberOfLines={1}>
            {expense.note}
          </Text>
        )}
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  categoryInfo: {
    flex: 1,
  },
  category: {
    ...typography.labelLarge,
    fontWeight: '600',
  },
  date: {
    ...typography.bodySmall,
    marginTop: spacing.xs,
  },
  rightSection: {
    alignItems: 'flex-end',
  },
  amount: {
    ...typography.labelLarge,
    fontWeight: '700',
  },
  note: {
    ...typography.bodySmall,
    marginTop: spacing.md,
    fontStyle: 'italic',
  },
});
