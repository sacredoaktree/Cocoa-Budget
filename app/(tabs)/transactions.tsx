import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../src/theme';
import { Typography } from '../../src/theme/typography';

export default function TransactionsScreen() {
  const { colors } = useTheme();
  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      <View style={styles.center}>
        <Text style={[Typography.headline2, { color: colors.textPrimary }]}>
          Transactions
        </Text>
        <Text style={[Typography.body2, { color: colors.textSecondary }]}>
          Coming soon
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
});
