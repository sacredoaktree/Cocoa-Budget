import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/theme';

export default function ForgotPasswordScreen() {
  const { resetPassword } = useAuth();
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!email) { Alert.alert('Enter your email'); return; }
    setLoading(true);
    const { error } = await resetPassword(email.trim());
    setLoading(false);
    if (error) {
      Alert.alert('Error', error);
    } else {
      Alert.alert(
        'Email sent',
        'Check your inbox for a password reset link.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    }
  };

  const s = styles(colors);

  return (
    <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={s.container}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={s.title}>Reset Password</Text>
        <Text style={s.subtitle}>Enter your email and we'll send you a reset link.</Text>

        <Text style={s.label}>Email</Text>
        <TextInput
          style={s.input}
          placeholder="you@example.com"
          placeholderTextColor={colors.textTertiary}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <TouchableOpacity style={s.primaryBtn} onPress={handleReset} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.primaryBtnText}>Send Reset Link</Text>}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = (colors: any) =>
  StyleSheet.create({
    flex: { flex: 1, backgroundColor: colors.background },
    container: { flex: 1, padding: 24, paddingTop: 60 },
    backBtn: { marginBottom: 24 },
    backText: { color: colors.accent, fontSize: 15, fontWeight: '500' },
    title: { fontSize: 26, fontWeight: '700', color: colors.textPrimary, marginBottom: 8 },
    subtitle: { fontSize: 14, color: colors.textSecondary, marginBottom: 28 },
    label: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 6 },
    input: {
      backgroundColor: colors.input,
      borderRadius: 12,
      padding: 14,
      fontSize: 16,
      color: colors.textPrimary,
      borderWidth: 1,
      borderColor: colors.divider,
      marginBottom: 20,
    },
    primaryBtn: {
      backgroundColor: colors.primary,
      borderRadius: 14,
      padding: 16,
      alignItems: 'center',
    },
    primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  });
