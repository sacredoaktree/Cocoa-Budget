import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../src/theme';
import { Typography } from '../../src/theme/typography';
import { Shadow } from '../../src/theme/spacing';
import { useTransactionStore } from '../../src/store/useTransactionStore';
import { useAccountStore } from '../../src/store/useAccountStore';
import { useSettingsStore } from '../../src/store/useSettingsStore';
import { getCategoriesByType } from '../../src/data/categories';
import { TransactionType } from '../../src/types';
import { format } from 'date-fns';

type TxType = 'expense' | 'income' | 'transfer';

const NUMPAD = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫'];

export default function AddTransactionModal() {
  const { colors } = useTheme();
  const { settings } = useSettingsStore();
  const addTransaction = useTransactionStore((s) => s.addTransaction);
  const updateAccount = useAccountStore((s) => s.updateAccount);
  const accounts = useAccountStore((s) =>
    s.accounts.filter((a) => !a.isArchived)
  );

  const sym = settings.currencySymbol;

  const [txType, setTxType] = useState<TxType>('expense');
  const [amountStr, setAmountStr] = useState('0');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [selectedAccountId, setSelectedAccountId] = useState<string>(
    accounts[0]?.id ?? ''
  );
  const [note, setNote] = useState('');
  const today = format(new Date(), 'yyyy-MM-dd');
  const timeStr = format(new Date(), 'HH:mm');

  const categories = getCategoriesByType(
    txType === 'transfer' ? 'expense' : txType
  );
  const typeColor =
    txType === 'income'
      ? colors.income
      : txType === 'transfer'
      ? colors.info
      : colors.expense;

  const handleNumpad = (key: string) => {
    if (key === '⌫') {
      setAmountStr((prev) => (prev.length > 1 ? prev.slice(0, -1) : '0'));
      return;
    }
    if (key === '.' && amountStr.includes('.')) return;
    const parts = amountStr.split('.');
    if (parts[1] && parts[1].length >= 2) return;
    setAmountStr((prev) => {
      if (prev === '0' && key !== '.') return key;
      return prev + key;
    });
  };

  const handleSave = () => {
    const amountCents = Math.round(parseFloat(amountStr || '0') * 100);
    if (amountCents === 0) return;
    const cat =
      categories.find((c) => c.id === selectedCategoryId) ?? categories[0];
    if (!cat) return;

    const tx = {
      id: `tx-${Date.now()}`,
      type: txType as TransactionType,
      amount: amountCents,
      accountId: selectedAccountId,
      categoryId: cat.id,
      payee: cat.name,
      note: note.trim(),
      date: today,
      time: timeStr,
      isDeleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addTransaction(tx);

    // Update account balance
    const balanceDelta = txType === 'income' ? amountCents : -amountCents;
    const acc = accounts.find((a) => a.id === selectedAccountId);
    if (acc) {
      updateAccount(acc.id, { balance: acc.balance + balanceDelta });
    }

    router.back();
  };

  const decimalPart = amountStr.includes('.')
    ? amountStr.split('.')[1]
    : undefined;
  const displayAmount = parseFloat(amountStr || '0').toLocaleString('en-US', {
    minimumFractionDigits: decimalPart !== undefined ? Math.min(decimalPart.length, 2) : 0,
    maximumFractionDigits: 2,
  });

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.elevated }]}
      edges={['top', 'bottom']}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.divider }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[Typography.headline3, { color: colors.textPrimary }]}>
          Add Transaction
        </Text>
        <TouchableOpacity
          onPress={handleSave}
          style={[styles.saveBtn, { backgroundColor: typeColor }]}
        >
          <Text style={[Typography.body2Semi, { color: '#FFF' }]}>Save</Text>
        </TouchableOpacity>
      </View>

      {/* Type toggle */}
      <View style={[styles.typeToggle, { backgroundColor: colors.input }]}>
        {(['expense', 'income', 'transfer'] as TxType[]).map((t) => (
          <TouchableOpacity
            key={t}
            onPress={() => {
              setTxType(t);
              setSelectedCategoryId('');
            }}
            style={[
              styles.typeBtn,
              txType === t && { backgroundColor: typeColor },
            ]}
          >
            <Text
              style={[
                Typography.body2Semi,
                {
                  color: txType === t ? '#FFF' : colors.textSecondary,
                  textTransform: 'capitalize',
                },
              ]}
            >
              {t}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Amount display */}
      <View
        style={[styles.amountDisplay, { borderBottomColor: colors.divider }]}
      >
        <Text
          style={[
            Typography.caption,
            { color: colors.textSecondary, marginBottom: 4 },
          ]}
        >
          {sym}
        </Text>
        <Text style={[styles.amountText, { color: typeColor }]}>
          {displayAmount}
        </Text>
      </View>

      {/* Category picker */}
      <Text
        style={[
          Typography.overline,
          {
            color: colors.textSecondary,
            paddingHorizontal: 16,
            marginTop: 12,
            marginBottom: 8,
          },
        ]}
      >
        Category
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ maxHeight: 80 }}
        contentContainerStyle={{ paddingHorizontal: 12, gap: 8 }}
      >
        {categories.map((cat) => {
          const isSelected = selectedCategoryId === cat.id;
          return (
            <TouchableOpacity
              key={cat.id}
              onPress={() => setSelectedCategoryId(cat.id)}
              style={styles.catItem}
            >
              <View
                style={[
                  styles.catIcon,
                  { backgroundColor: isSelected ? cat.color : cat.bgColor },
                  isSelected && { borderWidth: 2, borderColor: cat.color },
                ]}
              >
                <Ionicons
                  name={cat.icon as any}
                  size={20}
                  color={isSelected ? '#FFF' : cat.color}
                />
              </View>
              <Text
                style={[
                  Typography.caption,
                  {
                    color: isSelected ? cat.color : colors.textSecondary,
                    fontSize: 10,
                    marginTop: 2,
                  },
                ]}
                numberOfLines={1}
              >
                {cat.name.split(' ')[0]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Account picker */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ maxHeight: 52 }}
        contentContainerStyle={{
          paddingHorizontal: 16,
          gap: 8,
          alignItems: 'center',
        }}
      >
        {accounts.map((acc) => (
          <TouchableOpacity
            key={acc.id}
            onPress={() => setSelectedAccountId(acc.id)}
            style={[
              styles.accountChip,
              {
                backgroundColor:
                  selectedAccountId === acc.id ? acc.color : colors.input,
              },
            ]}
          >
            <Text
              style={[
                Typography.captionSemi,
                {
                  color:
                    selectedAccountId === acc.id ? '#FFF' : colors.textSecondary,
                },
              ]}
            >
              {acc.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Note field */}
      <View
        style={[
          styles.noteRow,
          {
            borderTopColor: colors.divider,
            borderBottomColor: colors.divider,
          },
        ]}
      >
        <Ionicons
          name="pencil-outline"
          size={18}
          color={colors.textTertiary}
          style={{ marginRight: 10 }}
        />
        <TextInput
          style={[Typography.body1, { color: colors.textPrimary, flex: 1 }]}
          value={note}
          onChangeText={setNote}
          placeholder="Add a note..."
          placeholderTextColor={colors.textTertiary}
          returnKeyType="done"
        />
      </View>

      {/* Numpad */}
      <View style={styles.numpad}>
        {NUMPAD.map((key) => (
          <TouchableOpacity
            key={key}
            style={[
              styles.numKey,
              {
                backgroundColor:
                  key === '⌫' ? colors.expense + '15' : colors.card,
                ...Shadow.card,
              },
            ]}
            onPress={() => handleNumpad(key)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                Typography.headline2,
                { color: key === '⌫' ? colors.expense : colors.textPrimary },
              ]}
            >
              {key}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  closeBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  saveBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999 },
  typeToggle: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 12,
    padding: 4,
  },
  typeBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
  },
  amountDisplay: {
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  amountText: { fontSize: 48, fontWeight: '700', lineHeight: 58 },
  catItem: { alignItems: 'center', width: 56 },
  catIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999 },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginVertical: 8,
  },
  numpad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 10,
    flex: 1,
    alignContent: 'flex-start',
    paddingTop: 8,
  },
  numKey: {
    width: '30%',
    aspectRatio: 2,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
