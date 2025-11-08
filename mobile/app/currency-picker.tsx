import React, { useMemo, useState } from 'react';
import { StyleSheet, FlatList, Pressable, Alert, View as RNView } from 'react-native';
import { Text, View } from '@/components/Themed';
import Colors, { spacing } from '@/constants/Colors';
import { Header } from '@/components/Header';
import { useColorScheme } from '@/components/useColorScheme';
import { useTheme } from '@/context/ThemeContext';
import { TextInput } from '@/components/TextInput';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search } from 'lucide-react-native';

export default function CurrencyPickerScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
  const { availableCurrencies, setCurrency, currencyCode } = useTheme();
  const [query, setQuery] = useState('');
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const list = useMemo(() => {
    const q = (query || '').trim().toLowerCase();
    if (!q) return availableCurrencies;
    return availableCurrencies.filter((c) => {
      return (c.code || '').toLowerCase().includes(q) || (c.name || '').toLowerCase().includes(q);
    });
  }, [availableCurrencies, query]);

  const handleSelect = (item: { code: string; name: string; symbol?: string }) => {
    Alert.alert(
      'Confirm currency',
      `Set currency to ${item.code} ${item.symbol ? `(${item.symbol})` : ''}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            await setCurrency(item.code);
            router.back();
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="Select Currency" showBackButton onBackPress={() => router.back()} />

      <RNView style={styles.content}>
        <TextInput
          placeholder="Search country, currency or code..."
          value={query}
          onChangeText={setQuery}
          rightIcon={<Search size={20} color={colors.textSecondary} />}
        />

        <FlatList
          data={list}
          keyExtractor={(item, index) => `${item.code || 'X'}-${index}`}
          contentContainerStyle={{ paddingBottom: insets.bottom + 50 }}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => handleSelect(item)}
              style={({ pressed }) => [
                styles.row,
                { opacity: pressed ? 0.7 : 1, borderColor: colors.border },
              ]}
            >
              <Text style={styles.code}>
                {item.code} {item.symbol ? `• ${item.symbol}` : ''}
              </Text>
              <Text style={[styles.name, { color: colors.textSecondary }]} numberOfLines={1}>
                {item.name}
              </Text>
            </Pressable>
          )}
        />
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
    flex: 1,
  },
  row: {
    padding: spacing.sm,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: spacing.sm,
  },
  code: {
    fontWeight: '700',
  },
  name: {
    marginTop: spacing.xs,
  },
});
