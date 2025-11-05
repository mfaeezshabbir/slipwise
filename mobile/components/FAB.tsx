import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from './Themed';
import { useColorScheme } from './useColorScheme';
import Colors, { spacing, borderRadius, shadows } from '@/constants/Colors';

interface FABProps {
  onPress: () => void;
  label?: React.ReactNode;
  icon?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  style?: any;
}

/**
 * FAB - Floating Action Button
 * A prominent button for primary actions, typically positioned at bottom of screen
 */
export function FAB({
  onPress,
  label = '+ Add',
  icon,
  variant = 'primary',
  size = 'large',
  style,
}: FABProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
  const shadowStyle = shadows[colorScheme === 'dark' ? 'dark' : 'light']['large'];

  const getVariantColor = () => {
    switch (variant) {
      case 'secondary':
        return colors.secondary;
      case 'danger':
        return colors.danger;
      default:
        return colors.primary;
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          width: 48,
          height: 48,
          borderRadius: borderRadius.full,
        };
      case 'medium':
        return {
          width: 56,
          height: 56,
          borderRadius: borderRadius.full,
        };
      default:
        return {
          paddingHorizontal: spacing.xl,
          paddingVertical: spacing.lg,
          borderRadius: borderRadius.lg,
          minHeight: 56,
        };
    }
  };

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.fab,
        getSizeStyles(),
        {
          backgroundColor: getVariantColor(),
          opacity: pressed ? 0.85 : 1,
        },
        shadowStyle,
        style,
      ]}
    >
      <View style={styles.content}>
        {icon}
        {typeof label === 'string' ? <Text style={styles.label}>{label}</Text> : label}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  label: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});
