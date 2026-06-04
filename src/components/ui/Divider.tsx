import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';

export function Divider({ indent = 0 }: { indent?: number }) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        height: StyleSheet.hairlineWidth,
        backgroundColor: colors.divider,
        marginLeft: indent,
      }}
    />
  );
}
