import { Platform } from 'react-native';

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  primary: string;
  primarySoft: string;
  income: string;
  incomeSoft: string;
  expense: string;
  expenseSoft: string;
  fab: string;
  fabText: string;
  overlay: string;
  inputBg: string;
  shadow: string;
}

export interface Theme {
  dark: boolean;
  colors: ThemeColors;
}

export const lightTheme: Theme = {
  dark: false,
  colors: {
    background: '#F3F5F9',
    surface: '#FFFFFF',
    surfaceAlt: '#F7F8FB',
    border: '#E6E8F0',
    text: '#16181F',
    textSecondary: '#5B6272',
    textMuted: '#9AA1B2',
    primary: '#4F46E5',
    primarySoft: '#EEEDFE',
    income: '#059669',
    incomeSoft: '#E7F6F0',
    expense: '#E11D48',
    expenseSoft: '#FDEAEF',
    fab: '#4F46E5',
    fabText: '#FFFFFF',
    overlay: 'rgba(15, 18, 30, 0.45)',
    inputBg: '#F3F5F9',
    shadow: '#0F1220',
  },
};

export const darkTheme: Theme = {
  dark: true,
  colors: {
    background: '#0F1117',
    surface: '#1A1D27',
    surfaceAlt: '#222532',
    border: '#2C3040',
    text: '#F2F4FA',
    textSecondary: '#A7ADC0',
    textMuted: '#6B7288',
    primary: '#818CF8',
    primarySoft: '#2A2C4A',
    income: '#34D399',
    incomeSoft: '#12352C',
    expense: '#FB7185',
    expenseSoft: '#3A1F2B',
    fab: '#818CF8',
    fabText: '#11131C',
    overlay: 'rgba(0, 0, 0, 0.6)',
    inputBg: '#222532',
    shadow: '#000000',
  },
};

export function fontFamily(weight: 'bold' | 'medium' | 'regular') {
  if (Platform.OS === 'ios' || Platform.OS === 'web') {
    return undefined;
  }
  switch (weight) {
    case 'bold':
      return 'sans-serif';
    case 'medium':
      return 'sans-serif-medium';
    default:
      return 'sans-serif';
  }
}
