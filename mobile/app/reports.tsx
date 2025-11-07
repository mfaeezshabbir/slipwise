import React from 'react';
import { StyleSheet } from 'react-native';
import { Text, View } from '@/components/Themed';
import { Header } from '@/components/Header';
import Colors, { spacing } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

export default function Analytics() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="Analytics" />

      <View style={styles.content}>
        <Text style={styles.heading}>Overview</Text>
        <Text>This is a placeholder analytics screen. Replace with charts and metrics.</Text>

        <Text style={[styles.heading, { marginTop: spacing.xl }]}>Top categories</Text>
        <Text>• Food • Transport • Utilities</Text>
      </View>
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
});
