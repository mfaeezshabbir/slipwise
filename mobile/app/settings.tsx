import React from 'react';
import { View as RNView, StyleSheet, Pressable } from 'react-native';
import { Text, View } from '@/components/Themed';
import { Header } from '@/components/Header';
import Colors, { spacing } from '@/constants/Colors';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useColorScheme } from '@/components/useColorScheme';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { ChevronRight } from 'lucide-react-native';

export default function Settings() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
  const theme = useTheme();
  const router = useRouter();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="Settings" />

      <RNView style={styles.content}>
        <Text style={styles.heading}>Appearance</Text>
        <RNView style={styles.row}>
          <Text>Theme</Text>
          <ThemeToggle />
        </RNView>

        <Text style={[styles.heading, { marginTop: spacing.xl }]}>Currency</Text>
        <Text style={styles.note}>Select your preferred currency symbol (default: PKR - Rs)</Text>
        <RNView style={{ marginTop: spacing.md }}>
          <Pressable
            onPress={() => {
              router.push('/currency-picker' as any);
            }}
            style={({ pressed }) => [
              styles.currencyRow,
              {
                opacity: pressed ? 0.9 : 1,
                borderColor: colors.border,
                backgroundColor: colors.backgroundSecondary,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={`Choose currency, current ${theme.currencyCode}`}
          >
            <RNView style={styles.currencyLeft}>
              <Text style={[styles.currencyTitle, { color: colors.text }]}>Preferred currency</Text>
              <Text style={[styles.currencySubtitle, { color: colors.textSecondary }]}>
                Tap to change
              </Text>
            </RNView>

            <RNView style={styles.currencyRight}>
              <RNView style={[styles.currencyPill, { borderColor: colors.border }]}>
                <Text style={[styles.currencyPillText, { color: colors.text }]}>
                  {theme.currencySymbol} {theme.currencyCode}
                </Text>
              </RNView>
              <ChevronRight size={20} color={colors.textSecondary} />
            </RNView>
          </Pressable>
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
  currencyRow: {
    padding: spacing.md,
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  currencyLeft: {
    flex: 1,
  },
  currencyTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  currencySubtitle: {
    fontSize: 12,
    marginTop: spacing.xs,
  },
  currencyRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginLeft: spacing.md,
  },
  currencyPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 999,
    borderWidth: 1,
  },
  currencyPillText: {
    fontWeight: '700',
  },
  note: {
    color: '#6B7280',
    marginTop: spacing.sm,
  },
});
