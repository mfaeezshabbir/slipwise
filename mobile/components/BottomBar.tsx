import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Pressable, Keyboard, Platform } from 'react-native';
import Colors, { spacing, borderRadius, shadows } from '@/constants/Colors';
import { useColorScheme } from './useColorScheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter, useSegments } from 'expo-router';
import { FAB } from './FAB';
import { BanknoteArrowDown, Bolt, ChartPie, House, Camera } from 'lucide-react-native';

/**
 * BottomBar - a rounded bottom navigation with a centered FAB
 * Matches the attached design: small rounded white bar with a central orange circular FAB
 */
export default function BottomBar() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
  const router = useRouter();
  const segments = useSegments();
  const insets = useSafeAreaInsets();

  // FAB theme specific color and shadow
  const fabBg = colorScheme === 'dark' ? colors.primary : colors.warning;
  const fabShadow = shadows[colorScheme === 'dark' ? 'dark' : 'light'].medium;

  // Hide rules: change these segment keys to match routes where bottom bar should be hidden
  const HIDE_ON_SEGMENTS = ['add', 'ocr', 'onboarding', 'login'];

  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Build a simple set of current segments for quick matching
  const activeSegments = segments.map((s) => String(s));
  const shouldHideRoute = activeSegments.some((seg) => HIDE_ON_SEGMENTS.includes(seg));

  if (keyboardVisible || shouldHideRoute) return null;

  return (
    <View pointerEvents="box-none" style={[styles.container, { bottom: insets.bottom }]}>
      <View
        style={[
          styles.bar,
          {
            backgroundColor: colors.cardBackground,
            borderColor: colors.border,
            ...shadows[colorScheme === 'dark' ? 'dark' : 'light'].small,
          },
        ]}
      >
        <Pressable
          onPress={() => router.push('/')}
          style={({ pressed }) => [styles.iconButton, { opacity: pressed ? 0.75 : 1 }]}
        >
          <House size={22} color={colors.tabIconDefault} />
        </Pressable>

        <Pressable
          onPress={() => router.push('/expenses')}
          style={({ pressed }) => [styles.iconButton, { opacity: pressed ? 0.75 : 1 }]}
        >
          <BanknoteArrowDown size={22} color={colors.tabIconDefault} />
        </Pressable>

        <Pressable
          onPress={() => router.push('/add')}
          style={({ pressed }) => [
            styles.fab,
            {
              backgroundColor: fabBg,
              opacity: pressed ? 0.75 : 1,
              ...fabShadow,
            },
          ]}
        >
          <FontAwesome name="plus" size={22} color="#fff" />
        </Pressable>

        <Pressable
          onPress={() => router.push('/reports')}
          style={({ pressed }) => [styles.iconButton, { opacity: pressed ? 0.75 : 1 }]}
        >
          <ChartPie size={22} color={colors.tabIconDefault} />
        </Pressable>

        <Pressable
          onPress={() => router.push('/settings')}
          style={({ pressed }) => [styles.iconButton, { opacity: pressed ? 0.75 : 1 }]}
        >
          <Bolt size={22} color={colors.tabIconDefault} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 16,
    alignItems: 'center',
    zIndex: 20,
    elevation: 20,
  },
  bar: {
    width: '92%',
    height: 64,
    borderRadius: borderRadius.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
