import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Text } from './Themed';
import Colors, { spacing, borderRadius } from '@/constants/Colors';
import { useTheme } from '@/context/ThemeContext';
import { Moon, Sun } from 'lucide-react-native';

interface ThemeToggleProps {
  style?: any;
}

/**
 * ThemeToggle - Button to switch between light and dark mode
 * Shows moon icon for dark mode, sun icon for light mode
 */
export function ThemeToggle({ style }: ThemeToggleProps) {
  const { isDark, toggleTheme, colorScheme } = useTheme();
  const colors = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

  return (
    <Pressable
      onPress={toggleTheme}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: colors.backgroundSecondary,
          borderColor: colors.border,
          opacity: pressed ? 0.7 : 1,
        },
        style,
      ]}
    >
      <Text style={[styles.icon, { color: colors.primary }]}>
        {isDark ? <Sun color="white" /> : <Moon />}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  icon: {
    fontSize: 20,
  },
});
