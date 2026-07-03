import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../hooks/useAppContext';
import { AuthInput } from '../components/AuthInput';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { loginUser, setAuthView, clearAuthError } from '../store/authSlice';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginScreen() {
  const { theme } = useApp();
  const dispatch = useAppDispatch();
  const loginPending = useAppSelector((s) => s.auth.loginPending);
  const error = useAppSelector((s) => s.auth.error);
  const registerSuccess = useAppSelector((s) => s.auth.registerSuccess);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const handleLogin = () => {
    setFormError(null);
    dispatch(clearAuthError());

    if (!EMAIL_RE.test(email.trim())) {
      setFormError('Enter a valid email address.');
      return;
    }
    if (!password) {
      setFormError('Enter your password.');
      return;
    }

    dispatch(loginUser({ email: email.trim().toLowerCase(), password }));
  };

  const shownError = formError || error;

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.brand}>
          <Text style={{ color: theme.blue }}>GlobalSmart</Text>
          <Text style={{ color: theme.blue }}>+</Text>
        </Text>
        <View style={styles.headerIcons}>
          <Ionicons name="call-outline" size={21} color={theme.ink} />
          <Ionicons name="grid-outline" size={21} color={theme.ink} />
        </View>
      </View>

      <Text style={[styles.title, { color: theme.ink }]}>Welcome back</Text>
      <Text style={[styles.subtitle, { color: theme.muted }]}>Log in to GlobalSmart Plus</Text>

      {registerSuccess ? (
        <Text style={[styles.successText, { color: theme.green }]}>
          Account created successfully. Log in to continue.
        </Text>
      ) : null}

      <View style={{ height: 12 }} />

      <AuthInput
        theme={theme}
        label="Email Address"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        editable={!loginPending}
      />

      <AuthInput
        theme={theme}
        label="Password"
        value={password}
        onChangeText={setPassword}
        isPassword
        editable={!loginPending}
      />

      {shownError ? (
        <Text style={[styles.errorText, { color: theme.red }]}>{shownError}</Text>
      ) : null}

      <TouchableOpacity
        style={styles.forgotWrap}
        activeOpacity={0.7}
        onPress={() => Alert.alert('Forgot Password', 'Password reset is coming soon. Please contact support in the meantime.')}
      >
        <Text style={[styles.forgot, { color: theme.cta }]}>Forgot Password</Text>
      </TouchableOpacity>

      <View style={{ height: 12 }} />

      <TouchableOpacity
        style={[styles.loginBtn, { backgroundColor: theme.cta }, loginPending && styles.disabled]}
        activeOpacity={0.85}
        onPress={handleLogin}
        disabled={loginPending}
      >
        {loginPending ? (
          <ActivityIndicator color={theme.ctaInk} />
        ) : (
          <Text style={[styles.loginBtnText, { color: theme.ctaInk }]}>Login</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.bioBtn, { borderColor: theme.cta }]}
        activeOpacity={0.85}
        onPress={() => Alert.alert('Biometric Login', 'Biometric login is coming soon.')}
      >
        <Ionicons name="scan-outline" size={20} color={theme.cta} />
        <Text style={[styles.bioBtnText, { color: theme.cta }]}>Use Biometric</Text>
      </TouchableOpacity>

      <View style={{ flex: 1, minHeight: 60 }} />

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: theme.muted }]}>Don't have a Login?</Text>
        <TouchableOpacity onPress={() => dispatch(setAuthView('register'))} activeOpacity={0.7}>
          <Text style={[styles.footerLink, { color: theme.cta }]}>Sign Up / Open an Account</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, padding: 20, paddingTop: 60, paddingBottom: 30 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 34 },
  brand: { fontSize: 21, fontWeight: '800', flex: 1, letterSpacing: -0.3 },
  headerIcons: { flexDirection: 'row', gap: 18, alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '700', letterSpacing: -0.3, marginBottom: 6 },
  subtitle: { fontSize: 14 },
  successText: { fontSize: 13, fontWeight: '600', marginTop: 10 },
  forgotWrap: { alignSelf: 'flex-end', marginBottom: 20 },
  forgot: { fontSize: 13.5, fontWeight: '600' },
  errorText: { fontSize: 13, fontWeight: '600', marginBottom: 14, marginTop: -6 },
  loginBtn: { height: 54, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  disabled: { opacity: 0.7 },
  loginBtnText: { fontSize: 16, fontWeight: '700' },
  bioBtn: {
    height: 54,
    borderRadius: 14,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  bioBtnText: { fontSize: 15, fontWeight: '700' },
  footer: { alignItems: 'center', gap: 8 },
  footerText: { fontSize: 13.5 },
  footerLink: { fontSize: 14.5, fontWeight: '700' },
});
