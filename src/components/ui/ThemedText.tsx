import React from 'react';
import { Text, TextProps } from 'react-native';
import { Typography } from '../../theme/typography';
import { useTheme } from '../../theme';

type Variant = keyof typeof Typography;

interface ThemedTextProps extends TextProps {
  variant?: Variant;
  color?: string;
  align?: 'left' | 'center' | 'right';
}

export function ThemedText({ variant = 'body1', color, align, style, ...props }: ThemedTextProps) {
  const { colors } = useTheme();
  return (
    <Text
      style={[
        Typography[variant],
        { color: color ?? colors.textPrimary },
        align ? { textAlign: align } : undefined,
        style,
      ]}
      {...props}
    />
  );
}
