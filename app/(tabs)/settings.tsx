import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../src/theme';
import { Typography } from '../../src/theme/typography';
import { Shadow } from '../../src/theme/spacing';
import { useSettingsStore } from '../../src/store/useSettingsStore';
import { useAuth } from '../../src/context/AuthContext';
import { CurrencySettingsSheet } from '../../src/components/features/CurrencySettingsSheet';
import { LanguageSettingsSheet } from '../../src/components/features/LanguageSettingsSheet';

interface SettingsRowProps {
  icon: string;
  iconBg: string;
  label: string;
  value?: string;
  onPress?: () => void;
  isLast?: boolean;
}

function SettingsRow({ icon, iconBg, label, value, onPress, isLast }: SettingsRowProps) {
  const { colors } = useTheme();
  return (
    <>
      <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
        <View style={[styles.rowIcon, { backgroundColor: iconBg }]}>
          <Ionicons name={icon as any} size={18} color="#FFF" />
        </View>
        <Text style={[Typography.body1, { color: colors.textPrimary, flex: 1 }]}>
          {label}
        </Text>
        {value ? (
          <Text
            style={[Typography.body2, { color: colors.textSecondary, marginRight: 4 }]}
          >
            {value}
          </Text>
        ) : null}
        <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
      </TouchableOpacity>
      {!isLast && (
        <View style={[styles.rowDivider, { backgroundColor: colors.divider }]} />
      )}
    </>
  );
}

function SectionCard({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.sectionCard, { backgroundColor: colors.card, ...Shadow.card }]}>
      {children}
    </View>
  );
}

export default function SettingsScreen() {
  const { colors } = useTheme();
  const { settings, updateSettings } = useSettingsStore();
  const { user, signOut } = useAuth();
  const [showCurrency, setShowCurrency] = useState(false);
  const [showLanguage, setShowLanguage] = useState(false);

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Profile header card */}
        <View
          style={[styles.profileCard, { backgroundColor: colors.card, ...Shadow.raised }]}
        >
          <View style={styles.profileTop}>
            <View style={styles.avatarWrap}>
              <View style={[styles.avatar, { backgroundColor: colors.accent }]}>
                <Ionicons name="person" size={36} color="#FFF" />
              </View>
              <View style={[styles.crownBadge, { backgroundColor: colors.gold }]}>
                <Ionicons name="star" size={10} color="#FFF" />
              </View>
            </View>
            <View style={styles.profileInfo}>
              <View style={styles.nameRow}>
                <Text style={[Typography.headline2, { color: colors.textPrimary }]}>
                  {settings.displayName}
                </Text>
                <TouchableOpacity style={{ marginLeft: 8 }}>
                  <Ionicons name="create-outline" size={18} color={colors.accent} />
                </TouchableOpacity>
              </View>
              <Text style={[Typography.caption, { color: colors.textSecondary }]}>
                Premium Member
              </Text>
            </View>
          </View>

          <View style={[styles.statsRow, { borderTopColor: colors.divider }]}>
            {([
              { value: settings.streakDays, label: 'Current Streak' },
              { value: settings.totalDaysUsed, label: 'Total Days' },
              { value: settings.totalTransactionCount, label: 'Transactions' },
            ] as { value: number; label: string }[]).map((stat, i) => (
              <React.Fragment key={stat.label}>
                {i > 0 && (
                  <View style={[styles.statDivider, { backgroundColor: colors.divider }]} />
                )}
                <View style={styles.statItem}>
                  <Text style={[Typography.headline2, { color: colors.textPrimary }]}>
                    {stat.value}
                  </Text>
                  <Text style={[Typography.caption, { color: colors.textSecondary }]}>
                    {stat.label}
                  </Text>
                </View>
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* Management section */}
        <Text
          style={[
            Typography.overline,
            { color: colors.textSecondary, marginLeft: 16, marginBottom: 8 },
          ]}
        >
          Management
        </Text>
        <SectionCard>
          <SettingsRow icon="book-outline" iconBg="#E88C2A" label="Ledger Manager" />
          <SettingsRow icon="wallet-outline" iconBg="#4A90D9" label="Account Manager" />
          <SettingsRow icon="grid-outline" iconBg="#8B5CF6" label="Category Manager" />
          <SettingsRow
            icon="people-outline"
            iconBg="#2E9E6B"
            label="Share Manager"
            isLast
          />
        </SectionCard>

        {/* Finance section */}
        <Text
          style={[
            Typography.overline,
            { color: colors.textSecondary, marginLeft: 16, marginBottom: 8 },
          ]}
        >
          Finance
        </Text>
        <SectionCard>
          <SettingsRow icon="pie-chart-outline" iconBg="#D94F3D" label="Budget" />
          <SettingsRow
            icon="trophy-outline"
            iconBg="#4A7FD4"
            label="Savings Goals"
            onPress={() => router.push('/features/goals')}
          />
          <SettingsRow
            icon="trending-up-outline"
            iconBg="#7C5CBF"
            label="Net Worth Timeline"
            onPress={() => router.push('/features/net-worth-timeline')}
          />
          <SettingsRow
            icon="people-outline"
            iconBg="#2E9E6B"
            label="Bill Splitting"
            onPress={() => router.push('/features/bill-split')}
          />
          <SettingsRow
            icon="calculator-outline"
            iconBg="#D94F3D"
            label="Debt Payoff Planner"
            onPress={() => router.push('/features/debt-planner')}
          />
          <SettingsRow
            icon="refresh-circle-outline"
            iconBg="#2AADCC"
            label="Subscription Audit"
            onPress={() => router.push('/features/subscription-audit')}
          />
          <SettingsRow
            icon="bar-chart-outline"
            iconBg="#E84E8A"
            label="Analytics & Reports"
            onPress={() => router.push('/features/analytics')}
            isLast
          />
        </SectionCard>

        {/* Preferences section */}
        <Text
          style={[
            Typography.overline,
            { color: colors.textSecondary, marginLeft: 16, marginBottom: 8 },
          ]}
        >
          Preferences
        </Text>
        <SectionCard>
          <SettingsRow
            icon="cash-outline"
            iconBg="#D4AF37"
            label="Base Currency"
            value={settings.currency}
            onPress={() => setShowCurrency(true)}
          />
          <TouchableOpacity
            style={styles.row}
            onPress={() =>
              updateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' })
            }
            activeOpacity={0.7}
          >
            <View style={[styles.rowIcon, { backgroundColor: '#3D2B1F' }]}>
              <Ionicons name="moon-outline" size={18} color="#FFF" />
            </View>
            <Text style={[Typography.body1, { color: colors.textPrimary, flex: 1 }]}>
              Dark Mode
            </Text>
            <Switch
              value={settings.theme === 'dark'}
              onValueChange={(val) =>
                updateSettings({ theme: val ? 'dark' : 'light' })
              }
              trackColor={{ false: colors.divider, true: colors.accent }}
              thumbColor="#FFF"
            />
          </TouchableOpacity>
          <View style={[styles.rowDivider, { backgroundColor: colors.divider }]} />
          <SettingsRow
            icon="language-outline"
            iconBg="#4A90D9"
            label="Language"
            value="English"
            onPress={() => setShowLanguage(true)}
            isLast
          />
        </SectionCard>

        {/* Data section */}
        <Text
          style={[
            Typography.overline,
            { color: colors.textSecondary, marginLeft: 16, marginBottom: 8 },
          ]}
        >
          Data
        </Text>
        <SectionCard>
          <SettingsRow
            icon="download-outline"
            iconBg="#2E9E6B"
            label="Export / Import"
          />
          <SettingsRow
            icon="cloud-upload-outline"
            iconBg="#4A7FD4"
            label="Backups"
            value="Inactive"
          />
          <SettingsRow
            icon="swap-horizontal-outline"
            iconBg="#8B5CF6"
            label="Transfer Data"
            isLast
          />
        </SectionCard>

        {/* Security section */}
        <Text
          style={[
            Typography.overline,
            { color: colors.textSecondary, marginLeft: 16, marginBottom: 8 },
          ]}
        >
          Security
        </Text>
        <SectionCard>
          <SettingsRow
            icon="lock-closed-outline"
            iconBg="#3D2B1F"
            label="App Lock"
            value={settings.lockEnabled ? 'On' : 'Off'}
          />
          <SettingsRow
            icon="finger-print-outline"
            iconBg="#C8956A"
            label="Biometric Auth"
            isLast
          />
        </SectionCard>

        {/* About section */}
        <Text
          style={[
            Typography.overline,
            { color: colors.textSecondary, marginLeft: 16, marginBottom: 8 },
          ]}
        >
          About
        </Text>
        <SectionCard>
          <SettingsRow icon="star-outline" iconBg="#D4AF37" label="Rate the App" />
          <SettingsRow icon="help-circle-outline" iconBg="#4A90D9" label="FAQ" />
          <SettingsRow
            icon="chatbubble-outline"
            iconBg="#2E9E6B"
            label="Contact Us"
            value="v1.0.0"
            isLast
          />
        </SectionCard>

        {/* Account section */}
        <Text
          style={[
            Typography.overline,
            { color: colors.textSecondary, marginLeft: 16, marginBottom: 8 },
          ]}
        >
          Account
        </Text>
        <SectionCard>
          <View style={styles.row}>
            <View style={[styles.rowIcon, { backgroundColor: '#4A90D9' }]}>
              <Ionicons name="mail-outline" size={18} color="#FFF" />
            </View>
            <Text style={[Typography.body2, { color: colors.textSecondary, flex: 1 }]}>
              {user?.email ?? 'Not signed in'}
            </Text>
          </View>
          <View style={[styles.rowDivider, { backgroundColor: colors.divider }]} />
          <TouchableOpacity style={styles.row} onPress={handleSignOut} activeOpacity={0.7}>
            <View style={[styles.rowIcon, { backgroundColor: '#D94F3D' }]}>
              <Ionicons name="log-out-outline" size={18} color="#FFF" />
            </View>
            <Text style={[Typography.body1, { color: '#D94F3D', flex: 1, fontWeight: '600' }]}>
              Sign Out
            </Text>
          </TouchableOpacity>
        </SectionCard>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Currency Sheet */}
      <Modal visible={showCurrency} animationType="slide" presentationStyle="pageSheet">
        <CurrencySettingsSheet onClose={() => setShowCurrency(false)} />
      </Modal>

      {/* Language Sheet */}
      <Modal visible={showLanguage} animationType="slide" presentationStyle="pageSheet">
        <LanguageSettingsSheet onClose={() => setShowLanguage(false)} />
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: 16, paddingTop: 8 },
  profileCard: { borderRadius: 20, padding: 20, marginBottom: 24 },
  profileTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  avatarWrap: { position: 'relative', marginRight: 16 },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  crownBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center' },
  statsRow: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 16,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, marginVertical: 4 },
  sectionCard: { borderRadius: 16, marginBottom: 20, overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 14,
  },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rowDivider: { height: StyleSheet.hairlineWidth, marginLeft: 60 },
});
