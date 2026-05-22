import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '../theme/typography';
import { Shadow } from '../theme/spacing';

interface NetWorthCardProps {
  netWorth: number;          // cents
  totalAssets: number;       // cents
  totalLiabilities: number;  // cents
  symbol?: string;
  onToggleVisibility?: () => void;
}

export function NetWorthCard({
  netWorth,
  totalAssets,
  totalLiabilities,
  symbol = '₱',
  onToggleVisibility,
}: NetWorthCardProps) {
  const fmt = (c: number) =>
    (c / 100).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  return (
    <View style={[styles.card, Shadow.raised]}>
      {/* Decorative waves */}
      <View style={styles.wave1} />
      <View style={styles.wave2} />

      <View style={styles.topRow}>
        <TouchableOpacity onPress={onToggleVisibility} style={styles.iconBtn}>
          <Ionicons name="eye-outline" size={20} color="rgba(255,255,255,0.8)" />
        </TouchableOpacity>
        <Text style={[Typography.body2Semi, { color: 'rgba(255,255,255,0.9)' }]}>
          Net Worth
        </Text>
        <TouchableOpacity style={styles.iconBtn}>
          <Ionicons name="trending-up-outline" size={20} color="rgba(255,255,255,0.8)" />
        </TouchableOpacity>
      </View>

      <Text style={[Typography.amountLarge, styles.netAmount]}>
        {symbol}{fmt(netWorth)}
      </Text>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={[Typography.caption, { color: 'rgba(255,255,255,0.7)' }]}>Assets</Text>
          <Text style={[Typography.body1Semi, { color: '#FFFFFF' }]}>
            {symbol}{fmt(totalAssets)}
          </Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.statItem}>
          <Text style={[Typography.caption, { color: 'rgba(255,255,255,0.7)' }]}>
            Liabilities
          </Text>
          <Text style={[Typography.body1Semi, { color: '#FFB8B0' }]}>
            {symbol}{fmt(totalLiabilities)}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 20,
    backgroundColor: '#7C5CBF',
    overflow: 'hidden',
    marginBottom: 20,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  netAmount: {
    color: '#FFFFFF',
    textAlign: 'center',
    marginVertical: 12,
    fontSize: 34,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  divider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignSelf: 'stretch',
  },
  wave1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.05)',
    bottom: -80,
    left: -40,
  },
  wave2: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.06)',
    top: -50,
    right: -30,
  },
});
