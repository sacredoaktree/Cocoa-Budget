import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/theme';

export default function SignInScreen() {
  const { signIn } = useAuth();
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert('Missing fields', 'Please enter your email and password.');
      return;
    }
    setLoading(true);
    const { error } = await signIn(email.trim(), password);
    setLoading(false);
    if (error) {
      Alert.alert('Sign in failed', error);
    } else {
      router.replace('/(tabs)');
    }
  };

  const s = styles(colors);

  return (
    <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
        {/* Logo / Brand */}
        <View style={s.brand}>
          <Text style={s.logo}>🍫</Text>
          <Text style={s.appName}>Cocoa Budget</Text>
          <Text style={s.tagline}>Your finances, beautifully simple.</Text>
        </View>

        {/* Form */}
        <View style={s.form}>
          <Text style={s.label}>Email</Text>
          <TextInput
            style={s.input}
            placeholder="you@example.com"
            placeholderTextColor={colors.textTertiary}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />

          <Text style={s.label}>Password</Text>
          <TextInput
            style={s.input}
            placeholder="••••••••"
            placeholderTextColor={colors.textTertiary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
          />

          <TouchableOpacity
            style={s.forgotBtn}
            onPress={() => router.push('/auth/forgot-password')}
          >
            <Text style={s.forgotText}>Forgot password?</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.primaryBtn} onPress={handleSignIn} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={s.primaryBtnText}>Sign In</Text>
            )}
          </TouchableOpacity>

          <View style={s.divider}>
            <View style={s.dividerLine} />
            <Text style={s.dividerText}>or</Text>
            <View style={s.dividerLine} />
          </View>

          <TouchableOpacity
            style={s.secondaryBtn}
            onPress={() => router.push('/auth/sign-up')}
          >
            <Text style={s.secondaryBtnText}>Create an account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = (colors: any) =>
  StyleSheet.create({
    flex: { flex: 1, backgroundColor: colors.background },
    container: { flexGrow: 1, justifyContent: 'center', padding: 24 },
    brand: { alignItems: 'center', marginBottom: 40 },
    logo: { fontSize: 64, marginBottom: 8 },
    appName: { fontSize: 28, fontWeight: '700', color: colors.textPrimary, letterSpacing: -0.5 },
    tagline: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
    form: { gap: 8 },
    label: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 2 },
    input: {
      backgroundColor: colors.input,
      borderRadius: 12,
      padding: 14,
      fontSize: 16,
      color: colors.textPrimary,
      borderWidth: 1,
      borderColor: colors.divider,
      marginBottom: 12,
    },
    forgotBtn: { alignSelf: 'flex-end', marginBottom: 20 },
    forgotText: { fontSize: 13, color: colors.accent, fontWeight: '500' },
    primaryBtn: {
      backgroundColor: colors.primary,
      borderRadius: 14,
      padding: 16,
      alignItems: 'center',
    },
    primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 20, gap: 12 },
    dividerLine: { flex: 1, height: 1, backgroundColor: colors.divider },
    dividerText: { color: colors.textTertiary, fontSize: 13 },
    secondaryBtn: {
      borderRadius: 14,
      padding: 16,
      alignItems: 'center',
      borderWidth: 1.5,
      borderColor: colors.divider,
    },
    secondaryBtnText: { color: colors.textPrimary, fontSize: 16, fontWeight: '600' },
  });
