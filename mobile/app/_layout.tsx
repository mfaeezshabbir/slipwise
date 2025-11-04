import { Slot, ErrorBoundary } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
// note: using plain View for logo to avoid extra native dependency
import Colors from '@/constants/Colors';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export { ErrorBoundary };

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

  return <AppLayout />;
}

function AppLayout() {
  return (
    <SafeAreaView style={s.container}>
      <StatusBar style="auto" />
      <AppHeader />
      <View style={s.content}>
        <Slot />
      </View>
    </SafeAreaView>
  );
}

function AppHeader() {
  return (
    <View style={s.header}>
      <View style={s.logo}>
        <View style={s.logoInner}>
          <Text style={s.logoText}>S</Text>
        </View>
      </View>
      <Text style={s.title}>SlipWise</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  logo: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  logoInner: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.brandTeal,
  },
  logoText: { color: '#fff', fontWeight: '800', fontSize: 20 },
  title: { marginLeft: 12, fontSize: 20, fontWeight: '700', color: Colors.light.brandPrimary },
  content: { flex: 1 },
});
