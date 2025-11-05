import React from 'react';
import { StyleSheet, View as RNView } from 'react-native';
import { useColorScheme } from './useColorScheme';
import Colors, { spacing, borderRadius, shadows } from '@/constants/Colors';

interface CardProps {
  children: React.ReactNode;
  style?: any;
  onPress?: () => void;
  shadowSize?: 'small' | 'medium' | 'large';
  variant?: 'default' | 'elevated' | 'outlined';
}

export function Card({
  children,
  style,
  onPress,
  shadowSize = 'small',
  variant = 'default',
}: CardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
  const shadowStyle = shadows[colorScheme === 'dark' ? 'dark' : 'light'][shadowSize];

  const variantStyles = () => {
    switch (variant) {
      case 'elevated':
        return {
          backgroundColor: colors.backgroundSecondary,
          ...shadowStyle,
        };
      case 'outlined':
        return {
          backgroundColor: colors.background,
          borderWidth: 1,
          borderColor: colors.border,
        };
      default:
        return {
          backgroundColor: colors.cardBackground,
        };
    }
  };

  return <RNView style={[styles.card, variantStyles(), style]}>{children}</RNView>;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
});
