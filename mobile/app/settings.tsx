import React, { useState } from 'react';
import {
  View as RNView,
  StyleSheet,
  Pressable,
  TextInput as RNTextInput,
  ScrollView,
} from 'react-native';
import { Text, View } from '@/components/Themed';
import { Header } from '@/components/Header';
import Colors, { spacing } from '@/constants/Colors';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useColorScheme } from '@/components/useColorScheme';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { ChevronRight, Check } from 'lucide-react-native';

export default function Settings() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
  const theme = useTheme();
  const router = useRouter();
  const [dailyBudgetInput, setDailyBudgetInput] = useState(theme.dailyBudget.toString());
  const [budgetSaved, setBudgetSaved] = useState(false);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="Settings" />

      <ScrollView style={styles.content}>
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

        <Text style={[styles.heading, { marginTop: spacing.xl }]}>Budget</Text>
        <Text style={styles.note}>Set your daily spending budget for analytics and alerts</Text>
        <RNView style={{ marginTop: spacing.md }}>
          <RNView
            style={[
              styles.budgetInputContainer,
              {
                backgroundColor: colors.backgroundSecondary,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.currencySymbol, { color: colors.text }]}>
              {theme.currencySymbol}
            </Text>
            <RNTextInput
              style={[
                styles.budgetInput,
                {
                  color: colors.text,
                },
              ]}
              placeholder="Enter daily budget"
              placeholderTextColor={colors.textSecondary}
              value={dailyBudgetInput}
              onChangeText={setDailyBudgetInput}
              keyboardType="decimal-pad"
              editable
            />
            <Pressable
              onPress={async () => {
                const budgetValue = parseFloat(dailyBudgetInput) || 250;
                await theme.setDailyBudget(budgetValue);
                setBudgetSaved(true);
                setTimeout(() => setBudgetSaved(false), 2000);
              }}
              style={({ pressed }) => [
                styles.budgetSaveButton,
                {
                  backgroundColor: budgetSaved ? colors.success : colors.primary,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              {budgetSaved ? (
                <Check size={20} color="#fff" />
              ) : (
                <Text style={styles.budgetSaveText}>Save</Text>
              )}
            </Pressable>
          </RNView>
          <Text style={[styles.budgetHelper, { color: colors.textSecondary }]}>
            Current daily budget: {theme.currencySymbol}
            {theme.dailyBudget.toFixed(2)}
          </Text>
        </RNView>

        <Text style={[styles.heading, { marginTop: spacing.xl }]}>Account</Text>
        <Text style={styles.note}>You can manage account settings here (placeholder).</Text>
      </ScrollView>
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
  budgetInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: '700',
    marginRight: spacing.sm,
  },
  budgetInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    paddingVertical: spacing.xs,
  },
  budgetSaveButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    marginLeft: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  budgetSaveText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  budgetHelper: {
    fontSize: 12,
    marginTop: spacing.sm,
  },
});
