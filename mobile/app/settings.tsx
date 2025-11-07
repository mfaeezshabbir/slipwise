import React from 'react';
import { View as RNView, StyleSheet } from 'react-native';
import { Text, View } from '@/components/Themed';
import { Header } from '@/components/Header';
import Colors, { spacing } from '@/constants/Colors';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useColorScheme } from '@/components/useColorScheme';

export default function Settings() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="Settings" />

      <RNView style={styles.content}>
        <Text style={styles.heading}>Appearance</Text>
        <RNView style={styles.row}>
          <Text>Theme</Text>
          <ThemeToggle />
        </RNView>

        <Text style={[styles.heading, { marginTop: spacing.xl }]}>Account</Text>
        <Text style={styles.note}>You can manage account settings here (placeholder).</Text>
      </RNView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
  },
  heading: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  note: {
    color: '#6B7280',
    marginTop: spacing.sm,
  },
});
