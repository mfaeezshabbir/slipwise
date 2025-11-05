import React from 'react';
import {
  Receipt,
  ShoppingCart,
  Coffee,
  Truck,
  Film,
  Music,
  Heart,
  ShoppingBag,
  Zap,
  CreditCard,
  BarChart2,
  CheckCircle,
  XCircle,
  Loader,
} from 'lucide-react-native';

interface LogoProps {
  size?: number;
  color?: string;
}

// Main SlipWise Logo (using lucide Receipt)
export function SlipWiseLogo({ size = 48, color = '#6366F1' }: LogoProps) {
  return <Receipt size={size} color={color} />;
}

// Category Icons (map categories to lucide icons)
export function CategoryIcon({
  category,
  size = 32,
  color = '#6366F1',
}: LogoProps & { category: string }) {
  const key = (category || '').toLowerCase();

  switch (key) {
    case 'food':
    case 'groceries':
      return <ShoppingCart size={size} color={color} />;

    case 'coffee':
    case 'cafe':
      return <Coffee size={size} color={color} />;

    case 'transport':
    case 'car':
    case 'gas':
      return <Truck size={size} color={color} />;

    case 'entertainment':
    case 'movie':
      return <Film size={size} color={color} />;

    case 'music':
      return <Music size={size} color={color} />;

    case 'health':
    case 'medical':
    case 'fitness':
      return <Heart size={size} color={color} />;

    case 'shopping':
    case 'clothes':
    case 'retail':
      return <ShoppingBag size={size} color={color} />;

    case 'utilities':
    case 'bills':
    case 'electricity':
      return <Zap size={size} color={color} />;

    case 'finance':
    case 'credit':
    case 'card':
      return <CreditCard size={size} color={color} />;

    default:
      return <BarChart2 size={size} color={color} />;
  }
}

// Expense chart icon
export function ChartIcon({ size = 32, color = '#6366F1' }: LogoProps) {
  return <BarChart2 size={size} color={color} />;
}

// Success checkmark
export function SuccessIcon({ size = 32, color = '#10B981' }: LogoProps) {
  return <CheckCircle size={size} color={color} />;
}

// Error/Warning icon
export function ErrorIcon({ size = 32, color = '#EF4444' }: LogoProps) {
  return <XCircle size={size} color={color} />;
}

// Loading spinner
export function LoadingIcon({ size = 32, color = '#6366F1' }: LogoProps) {
  // lucide-react-native's Loader is suitable; rotate/animation can be added where used
  return <Loader size={size} color={color} />;
}
