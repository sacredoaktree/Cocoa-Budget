import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../src/theme';
import { Typography } from '../../src/theme/typography';
import { Shadow } from '../../src/theme/spacing';
import { useAccountStore } from '../../src/store/useAccountStore';
import { AccountType } from '../../src/types';

interface AccountTypeOption {
  type: AccountType;
  label: string;
  icon: string;
  color: string;
}

interface AccountGroup {
  group: string;
  groupColor: string;
  items: AccountTypeOption[];
}

const ACCOUNT_TYPE_GROUPS: AccountGroup[] = [
  {
    group: 'Debit',
    groupColor: '#4A90D9',
    items: [
      { type: 'checking', label: 'Debit Cards', icon: 'card-outline', color: '#4A90D9' },
      { type: 'cash', label: 'Cash', icon: 'cash-outline', color: '#D4AF37' },
      { type: 'digital', label: 'PayPal / Digital', icon: 'logo-paypal', color: '#253B80' },
      { type: 'savings', label: 'Savings Account', icon: 'wallet-outline', color: '#2E9E6B' },
    ],
  },
  {
    group: 'Credit',
    groupColor: '#D94F3D',
    items: [
      { type: 'credit', label: 'Credit Cards', icon: 'card-outline', color: '#D94F3D' },
    ],
  },
  {
    group: 'Borrow / Lend',
    groupColor: '#8B5CF6',
    items: [
      { type: 'loan', label: 'Loan', icon: 'trending-down-outline', color: '#8B5CF6' },
    ],
  },
  {
    group: 'Invest',
    groupColor: '#C8956A',
    items: [
      { type: 'stock', label: 'Stock', icon: 'bar-chart-outline', color: '#D4AF37' },
      { type: 'investment', label: 'Fund / ETF', icon: 'trending-up-outline', color: '#C8956A' },
      { type: 'crypto', label: 'Crypto Currencies', icon: 'logo-bitcoin', color: '#F7931A' },
    ],
  },
];

const COLOR_SWATCHES = [
  '#4A90D9',
  '#2E9E6B',
  '#D94F3D',
  '#D4AF37',
  '#8B5CF6',
  '#C8956A',
  '#E84E8A',
  '#2AADCC',
];

export default function AddAccountModal() {
  const { colors } = useTheme();
  const addAccount = useAccountStore((s) => s.addAccount);

  const [step, setStep] = useState<'type' | 'form'>('type');
  const [selectedType, setSelectedType] = useState<AccountTypeOption | null>(null);
  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const [currency, setCurrency] = useState('PHP');
  const [balance, setBalance] = useState('0');
  const [selectedColor, setSelectedColor] = useState(COLOR_SWATCHES[0]);
  const [countInAsset, setCountInAsset] = useState(true);

  const handleSelectType = (opt: AccountTypeOption) => {
    setSelectedType(opt);
    setSelectedColor(opt.color);
    setStep('form');
  };

  const handleSave = () => {
    if (!selectedType || !name.trim()) return;
    const balanceCents = Math.round(parseFloat(balance || '0') * 100);
    addAccount({
      id: `acc-${Date.now()}`,
      name: name.trim(),
      type: selectedType.type,
      color: selectedColor,
      icon: selectedType.icon,
      currency,
      balance: balanceCents,
      note: note.trim(),
      countInAsset,
      hideBalance: false,
      chartColor: selectedColor,
      isArchived: false,
      displayOrder: 99,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    router.back();
  };

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.elevated }]}
      edges={['top', 'bottom']}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.divider }]}>
        <TouchableOpacity
          onPress={step === 'form' ? () => setStep('type') : () => router.back()}
          style={styles.closeBtn}
        >
          <Ionicons
            name={step === 'form' ? 'arrow-back' : 'close'}
            size={24}
            color={colors.textPrimary}
          />
        </TouchableOpacity>
        <Text style={[Typography.headline3, { color: colors.textPrimary }]}>
          {step === 'form' ? selectedType?.label : 'Add Account'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {step === 'type' ? (
        <ScrollView showsVerticalScrollIndicator={false}>
          {ACCOUNT_TYPE_GROUPS.map((group) => (
            <View key={group.group}>
              <Text
                style={[
                  Typography.overline,
                  styles.groupLabel,
                  { color: group.groupColor },
                ]}
              >
                {group.group}
              </Text>
              {group.items.map((item, idx) => (
                <View key={item.type}>
                  <TouchableOpacity
                    style={styles.typeRow}
                    onPress={() => handleSelectType(item)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.typeIcon,
                        { backgroundColor: item.color + '22' },
                      ]}
                    >
                      <Ionicons
                        name={item.icon as any}
                        size={22}
                        color={item.color}
                      />
                    </View>
                    <Text
                      style={[
                        Typography.body1,
                        { color: colors.textPrimary, flex: 1 },
                      ]}
                    >
                      {item.label}
                    </Text>
                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color={colors.textTertiary}
                    />
                  </TouchableOpacity>
                  {idx < group.items.length - 1 && (
                    <View
                      style={[
                        styles.divider,
                        { backgroundColor: colors.divider, marginLeft: 60 },
                      ]}
                    />
                  )}
                </View>
              ))}
              <View
                style={[styles.groupDivider, { backgroundColor: colors.divider }]}
              />
            </View>
          ))}
          <View style={{ height: 40 }} />
        </ScrollView>
      ) : (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 40 }}
          >
            {/* Preview card */}
            <View
              style={[styles.previewCard, { backgroundColor: selectedColor }]}
            >
              <Ionicons
                name={(selectedType?.icon ?? 'wallet-outline') as any}
                size={32}
                color="#FFF"
              />
              <Text
                style={[Typography.headline3, { color: '#FFF', marginTop: 8 }]}
              >
                {name || 'Account Name'}
              </Text>
            </View>

            {/* Form fields */}
            <View
              style={[
                styles.formCard,
                { backgroundColor: colors.card, ...Shadow.card },
              ]}
            >
              <FormRow label="Name" colors={colors}>
                <TextInput
                  style={[
                    Typography.body1,
                    { color: colors.textPrimary, flex: 1, textAlign: 'right' },
                  ]}
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g. GoTyme Bank"
                  placeholderTextColor={colors.textTertiary}
                />
              </FormRow>
              <View
                style={[
                  styles.formDivider,
                  { backgroundColor: colors.divider },
                ]}
              />
              <FormRow label="Note" colors={colors}>
                <TextInput
                  style={[
                    Typography.body1,
                    { color: colors.textPrimary, flex: 1, textAlign: 'right' },
                  ]}
                  value={note}
                  onChangeText={setNote}
                  placeholder="Last 4 digits, memo..."
                  placeholderTextColor={colors.textTertiary}
                />
              </FormRow>
              <View
                style={[
                  styles.formDivider,
                  { backgroundColor: colors.divider },
                ]}
              />
              <FormRow label="Currency" colors={colors}>
                <TouchableOpacity
                  style={[
                    styles.currencyChip,
                    { backgroundColor: colors.input },
                  ]}
                  onPress={() =>
                    setCurrency(currency === 'PHP' ? 'USD' : 'PHP')
                  }
                >
                  <Text
                    style={[Typography.body2Semi, { color: colors.textPrimary }]}
                  >
                    {currency}
                  </Text>
                </TouchableOpacity>
              </FormRow>
              <View
                style={[
                  styles.formDivider,
                  { backgroundColor: colors.divider },
                ]}
              />
              <FormRow label="Opening Balance" colors={colors}>
                <TextInput
                  style={[
                    Typography.body1Semi,
                    { color: colors.textPrimary, flex: 1, textAlign: 'right' },
                  ]}
                  value={balance}
                  onChangeText={setBalance}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor={colors.textTertiary}
                />
              </FormRow>
            </View>

            {/* Color picker */}
            <View
              style={[
                styles.formCard,
                { backgroundColor: colors.card, ...Shadow.card },
              ]}
            >
              <Text
                style={[
                  Typography.body2Semi,
                  { color: colors.textSecondary, marginBottom: 12 },
                ]}
              >
                Chart Color
              </Text>
              <View style={styles.colorRow}>
                {COLOR_SWATCHES.map((c) => (
                  <TouchableOpacity
                    key={c}
                    onPress={() => setSelectedColor(c)}
                    style={[
                      styles.colorSwatch,
                      { backgroundColor: c },
                      selectedColor === c && styles.colorSelected,
                    ]}
                  >
                    {selectedColor === c && (
                      <Ionicons name="checkmark" size={14} color="#FFF" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Toggles */}
            <View
              style={[
                styles.formCard,
                { backgroundColor: colors.card, ...Shadow.card },
              ]}
            >
              <FormRow label="Count in Asset" colors={colors}>
                <Switch
                  value={countInAsset}
                  onValueChange={setCountInAsset}
                  trackColor={{ true: '#C8956A' }}
                />
              </FormRow>
            </View>

            {/* Save button */}
            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: colors.accent }]}
              onPress={handleSave}
              activeOpacity={0.85}
            >
              <Text style={[Typography.body1Semi, { color: '#FFF' }]}>
                Add Account
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

function FormRow({
  label,
  children,
  colors,
}: {
  label: string;
  children: React.ReactNode;
  colors: any;
}) {
  return (
    <View style={styles.formRow}>
      <Text style={[Typography.body1, { color: colors.textSecondary }]}>
        {label}
      </Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  closeBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupLabel: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  typeIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  divider: { height: StyleSheet.hairlineWidth },
  groupDivider: { height: 8 },
  previewCard: {
    margin: 16,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  formCard: {
    marginHorizontal: 16,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  formRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  formDivider: { height: StyleSheet.hairlineWidth, marginVertical: 4 },
  currencyChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  colorSwatch: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorSelected: { borderWidth: 3, borderColor: 'rgba(255,255,255,0.6)' },
  saveBtn: {
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: 'center',
  },
});
