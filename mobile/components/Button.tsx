import React from 'react';
import { Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { Text } from './Themed';
import { useColorScheme } from './useColorScheme';
import Colors, { spacing, borderRadius } from '@/constants/Colors';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  onPress: () => void;
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: any;
}

export function Button({
  onPress,
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
}: ButtonProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

  const getVariantStyles = () => {
    switch (variant) {
      case 'secondary':
        return {
          backgroundColor: colors.secondary,
          textColor: '#fff',
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderColor: colors.primary,
          textColor: colors.primary,
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          textColor: colors.primary,
        };
      case 'danger':
        return {
          backgroundColor: colors.danger,
          textColor: '#fff',
        };
      default:
        return {
          backgroundColor: colors.primary,
          textColor: '#fff',
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.sm,
          fontSize: 12,
        };
      case 'lg':
        return {
          paddingHorizontal: spacing.xl,
          paddingVertical: spacing.lg,
          fontSize: 16,
        };
      default:
        return {
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
          fontSize: 14,
        };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: disabled ? colors.border : variantStyles.backgroundColor,
          opacity: pressed ? 0.8 : 1,
          width: fullWidth ? '100%' : 'auto',
          paddingHorizontal: sizeStyles.paddingHorizontal,
          paddingVertical: sizeStyles.paddingVertical,
          borderWidth: variantStyles.borderWidth || 0,
          borderColor: variantStyles.borderColor || 'transparent',
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variantStyles.textColor} />
      ) : (
        <Text
          style={[
            styles.text,
            {
              color: disabled ? colors.textTertiary : variantStyles.textColor,
              fontSize: sizeStyles.fontSize,
              fontWeight: '600',
            },
          ]}
        >
          {children}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 40,
  },
  text: {
    textAlign: 'center',
  },
});
