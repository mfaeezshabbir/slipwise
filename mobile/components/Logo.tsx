import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

interface LogoProps {
  size?: number;
  style?: any;
}

/**
 * AppLogo - Displays the SlipWise app logo from assets
 * Uses the existing icon.png from assets/images
 */
export function AppLogo({ size = 48, style }: LogoProps) {
  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <Image
        source={require('@/assets/images/icon.png')}
        style={{ width: '100%', height: '100%' }}
        resizeMode="contain"
      />
    </View>
  );
}

/**
 * SplashLogo - Displays the splash screen logo
 * Uses the existing splash-icon.png from assets/images
 */
export function SplashLogo({ size = 120, style }: LogoProps) {
  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <Image
        source={require('@/assets/images/splash-icon.png')}
        style={{ width: '100%', height: '100%' }}
        resizeMode="contain"
      />
    </View>
  );
}

/**
 * AdaptiveIcon - Displays the adaptive icon (Android)
 * Uses the existing adaptive-icon.png from assets/images
 */
export function AdaptiveIcon({ size = 64, style }: LogoProps) {
  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <Image
        source={require('@/assets/images/adaptive-icon.png')}
        style={{ width: '100%', height: '100%' }}
        resizeMode="contain"
      />
    </View>
  );
}

/**
 * Favicon - Displays the web favicon
 */
export function Favicon({ size = 32, style }: LogoProps) {
  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <Image
        source={require('@/assets/images/favicon.png')}
        style={{ width: '100%', height: '100%' }}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
