import React from 'react';
import { StyleSheet, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, View } from '@/components/Themed';
import { Header } from '@/components/Header';
import Colors, { spacing } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

const DUMMY = Array.from({ length: 12 }).map((_, i) => ({
  id: String(i + 1),
  title: `Expense ${i + 1}`,
  amount: (Math.random() * 120).toFixed(2),
  date: `2025-11-${String((i % 30) + 1).padStart(2, '0')}`,
}));

export default function History() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="History" />

      <FlatList
        data={DUMMY}
        keyExtractor={(it) => it.id}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 50 }]}
        renderItem={({ item }) => (
          <View
            style={[
              styles.item,
              { backgroundColor: colors.cardBackground, borderColor: colors.border },
            ]}
          >
            <Text style={styles.itemTitle}>{item.title}</Text>
            <Text style={styles.itemMeta}>
              ${item.amount} • {item.date}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  itemTitle: {
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  itemMeta: {
    color: '#6B7280',
  },
});
