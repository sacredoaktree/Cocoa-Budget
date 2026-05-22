import { TextStyle } from 'react-native';

export const Typography = {
  displayLarge: { fontSize: 40, fontWeight: '700', lineHeight: 48 } as TextStyle,
  displayMedium: { fontSize: 32, fontWeight: '700', lineHeight: 40 } as TextStyle,
  headline1: { fontSize: 24, fontWeight: '700', lineHeight: 32 } as TextStyle,
  headline2: { fontSize: 20, fontWeight: '600', lineHeight: 28 } as TextStyle,
  headline3: { fontSize: 17, fontWeight: '600', lineHeight: 24 } as TextStyle,
  body1: { fontSize: 16, fontWeight: '400', lineHeight: 24 } as TextStyle,
  body1Semi: { fontSize: 16, fontWeight: '600', lineHeight: 24 } as TextStyle,
  body2: { fontSize: 14, fontWeight: '400', lineHeight: 20 } as TextStyle,
  body2Semi: { fontSize: 14, fontWeight: '600', lineHeight: 20 } as TextStyle,
  caption: { fontSize: 12, fontWeight: '400', lineHeight: 16 } as TextStyle,
  captionSemi: { fontSize: 12, fontWeight: '600', lineHeight: 16 } as TextStyle,
  overline: { fontSize: 11, fontWeight: '600', lineHeight: 16, letterSpacing: 0.8, textTransform: 'uppercase' as const } as TextStyle,
  amount: { fontSize: 22, fontWeight: '700', lineHeight: 28 } as TextStyle,
  amountSmall: { fontSize: 16, fontWeight: '600', lineHeight: 22 } as TextStyle,
  amountLarge: { fontSize: 36, fontWeight: '700', lineHeight: 44 } as TextStyle,
} as const;
