import React from 'react';
import { View, ViewProps } from 'react-native';
import { useTheme } from '../../theme';
import { Shadow } from '../../theme/spacing';

interface CardProps extends ViewProps {
  elevated?: boolean;
  noPad?: boolean;
}

export function Card({ elevated = false, noPad = false, style, children, ...props }: CardProps) {
  const { colors, radius } = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: colors.card,
          borderRadius: radius.md,
          padding: noPad ? 0 : 16,
          ...(elevated ? Shadow.raised : Shadow.card),
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}
