import React from 'react';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useTheme } from '../../theme';

export function PrivacyToggle({ size = 22 }: { size?: number }) {
  const { colors } = useTheme();
  const { settings, togglePrivacyMode } = useSettingsStore();

  return (
    <TouchableOpacity
      onPress={togglePrivacyMode}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Ionicons
        name={settings.privacyMode ? 'eye-off-outline' : 'eye-outline'}
        size={size}
        color={settings.privacyMode ? colors.accent : colors.textSecondary}
      />
    </TouchableOpacity>
  );
}
