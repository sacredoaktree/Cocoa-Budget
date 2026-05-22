import React from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../theme';
import { Typography } from '../../theme/typography';
import { SUPPORTED_LANGUAGES } from '../../i18n';

interface Props { onClose: () => void }

export function LanguageSettingsSheet({ onClose }: Props) {
  const { colors } = useTheme();
  const { i18n, t } = useTranslation();

  const handleSelect = (code: string) => {
    i18n.changeLanguage(code);
    onClose();
  };

  return (
    <View style={[styles.sheet, { backgroundColor: colors.elevated }]}>
      <View style={styles.header}>
        <Text style={[Typography.headline3, { color: colors.textPrimary }]}>{t('language.title')}</Text>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="close" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>
      <FlatList
        data={SUPPORTED_LANGUAGES}
        keyExtractor={(item) => item.code}
        renderItem={({ item }) => {
          const active = i18n.language === item.code || i18n.language.startsWith(item.code);
          return (
            <TouchableOpacity
              style={[styles.row, { borderBottomColor: colors.divider }]}
              onPress={() => handleSelect(item.code)}
              activeOpacity={0.7}
            >
              <View style={styles.rowInfo}>
                <Text style={[Typography.body1Semi, { color: colors.textPrimary }]}>{item.nativeName}</Text>
                <Text style={[Typography.caption, { color: colors.textSecondary }]}>{item.name}</Text>
              </View>
              {active && <Ionicons name="checkmark-circle" size={20} color={colors.accent} />}
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: { flex: 1, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  rowInfo: { flex: 1 },
});
