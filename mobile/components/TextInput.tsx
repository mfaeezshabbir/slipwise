import React from 'react';
import { StyleSheet, TextInput as RNTextInput, View as RNView } from 'react-native';
import { Text } from './Themed';
import { useColorScheme } from './useColorScheme';
import Colors, { spacing, borderRadius } from '@/constants/Colors';

interface TextInputProps extends React.ComponentProps<typeof RNTextInput> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function TextInput({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  style,
  ...props
}: TextInputProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

  return (
    <RNView style={styles.container}>
      {label && <Text style={[styles.label, { color: colors.text }]}>{label}</Text>}

      <RNView
        style={[
          styles.inputWrapper,
          {
            backgroundColor: colors.inputBackground,
            borderColor: error ? colors.danger : colors.inputBorder,
          },
        ]}
      >
        {leftIcon && <RNView style={styles.icon}>{leftIcon}</RNView>}

        <RNTextInput
          {...props}
          style={[
            styles.input,
            {
              color: colors.text,
              flex: 1,
              paddingLeft: leftIcon ? 0 : spacing.md,
              paddingRight: rightIcon ? 0 : spacing.md,
            },
            style,
          ]}
          placeholderTextColor={colors.textTertiary}
        />

        {rightIcon && <RNView style={styles.icon}>{rightIcon}</RNView>}
      </RNView>

      {error && <Text style={[styles.error, { color: colors.danger }]}>{error}</Text>}

      {hint && !error && <Text style={[styles.hint, { color: colors.textSecondary }]}>{hint}</Text>}
    </RNView>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    minHeight: 48,
    paddingHorizontal: spacing.md,
  },
  input: {
    fontSize: 14,
    fontWeight: '400',
    minHeight: 48,
  },
  icon: {
    marginHorizontal: spacing.sm,
  },
  error: {
    fontSize: 12,
    marginTop: spacing.xs,
    fontWeight: '500',
  },
  hint: {
    fontSize: 12,
    marginTop: spacing.xs,
    fontWeight: '400',
  },
});
