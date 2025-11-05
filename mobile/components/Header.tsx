import React from 'react';
import { StyleSheet, View as RNView } from 'react-native';
import { Text } from './Themed';
import { useColorScheme } from './useColorScheme';
import Colors, { spacing, borderRadius } from '@/constants/Colors';

interface HeaderProps {
  title: string;
  subtitle?: string;
  rightAction?: React.ReactNode;
  showBackButton?: boolean;
  onBackPress?: () => void;
}

export function Header({ title, subtitle, rightAction, showBackButton, onBackPress }: HeaderProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

  return (
    <RNView
      style={[
        styles.header,
        {
          backgroundColor: colors.background,
          borderBottomColor: colors.border,
        },
      ]}
    >
      <RNView style={styles.leftSection}>
        {showBackButton && (
          <Text style={[styles.backButton, { color: colors.primary }]} onPress={onBackPress}>
            ← Back
          </Text>
        )}
      </RNView>

      <RNView style={styles.centerSection}>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        {subtitle && (
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
        )}
      </RNView>

      <RNView style={styles.rightSection}>{rightAction}</RNView>
    </RNView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
  },
  leftSection: {
    flex: 0.2,
  },
  centerSection: {
    flex: 1,
    alignItems: 'center',
  },
  rightSection: {
    flex: 0.2,
    alignItems: 'flex-end',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
    marginTop: spacing.xs,
  },
  backButton: {
    fontSize: 14,
    fontWeight: '600',
  },
});
