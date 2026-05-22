export const LightColors = {
  // Brand
  primary: '#3D2B1F',
  accent: '#C8956A',
  gold: '#D4AF37',

  // Semantic
  income: '#2E9E6B',
  expense: '#D94F3D',
  warning: '#E88C2A',
  info: '#4A7FD4',

  // Surfaces
  background: '#F8F5F1',
  card: '#FFFFFF',
  elevated: '#FFFFFF',
  input: '#F0EDE9',
  divider: '#EAE6E1',
  overlay: 'rgba(0,0,0,0.45)',

  // Text
  textPrimary: '#1A1008',
  textSecondary: '#7A6858',
  textTertiary: '#B0A090',
  textInverse: '#FFFFFF',
  textAccent: '#C8956A',

  // Account type colors
  checking: '#4A90D9',
  savings: '#2E9E6B',
  credit: '#D94F3D',
  cash: '#D4AF37',
  digital: '#253B80',
  loan: '#8B5CF6',
  investment: '#C8956A',

  // Category card pastel backgrounds (used in home grid)
  catCreditBg: '#FFF4DC',
  catFoodBg: '#FFF4DC',
  catTransportBg: '#E8F0FF',
  catBillsBg: '#FFE8E0',
  catSelfCareBg: '#EDE8FF',
  catShoppingBg: '#FFE8F0',
  catHealthBg: '#DCFFF4',
  catSubBg: '#E8F0FF',
  catSalaryBg: '#FFF4DC',
  catSavingsBg: '#DCFFF4',

  // Tab bar
  tabActive: '#C8956A',
  tabInactive: '#B0A090',
  tabBg: '#FFFFFF',

  // Status bar
  statusBar: 'dark',
} as const;

export const DarkColors: { [K in keyof typeof LightColors]: string } = {
  primary: '#C8956A',
  accent: '#E8B98A',
  gold: '#E8CC6A',

  income: '#4DC88A',
  expense: '#F07060',
  warning: '#F5A84A',
  info: '#7AAEF0',

  background: '#1A1410',
  card: '#2A2018',
  elevated: '#342A1E',
  input: '#201810',
  divider: '#3A3028',
  overlay: 'rgba(0,0,0,0.65)',

  textPrimary: '#F0EAE0',
  textSecondary: '#A8957A',
  textTertiary: '#6A5A48',
  textInverse: '#1A1008',
  textAccent: '#E8B98A',

  checking: '#6AABF0',
  savings: '#4DC88A',
  credit: '#F07060',
  cash: '#E8CC6A',
  digital: '#6A8AE0',
  loan: '#A87CF6',
  investment: '#E8B98A',

  catCreditBg: '#2A2210',
  catFoodBg: '#2A2210',
  catTransportBg: '#101828',
  catBillsBg: '#2A1810',
  catSelfCareBg: '#1C1828',
  catShoppingBg: '#2A1018',
  catHealthBg: '#102A1C',
  catSubBg: '#101828',
  catSalaryBg: '#2A2210',
  catSavingsBg: '#102A1C',

  tabActive: '#E8B98A',
  tabInactive: '#6A5A48',
  tabBg: '#2A2018',

  statusBar: 'light',
};

export type Colors = { [K in keyof typeof LightColors]: string };
