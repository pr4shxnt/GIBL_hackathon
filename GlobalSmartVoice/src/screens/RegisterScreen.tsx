import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../hooks/useAppContext';
import { AuthInput } from '../components/AuthInput';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { registerUser, setAuthView, clearAuthError } from '../store/authSlice';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterScreen() {
  const { theme } = useApp();
  const dispatch = useAppDispatch();
  const registerPending = useAppSelector((s) => s.auth.registerPending);
  const error = useAppSelector((s) => s.auth.error);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const handleRegister = () => {
    setFormError(null);
    dispatch(clearAuthError());

    if (fullName.trim().length < 2) {
      setFormError('Enter your full name.');
      return;
    }
    if (!EMAIL_RE.test(email.trim())) {
      setFormError('Enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setFormError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setFormError('Passwords do not match.');
      return;
    }

    dispatch(registerUser({ name: fullName.trim(), email: email.trim().toLowerCase(), password }));
  };

  const shownError = formError || error;

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => dispatch(setAuthView('login'))} hitSlop={10}>
          <Ionicons name="arrow-back" size={22} color={theme.ink} />
        </TouchableOpacity>
        <Text style={styles.brand}>
          <Text style={{ color: theme.blue }}>GlobalSmart+</Text>
        </Text>
        <View style={{ width: 22 }} />
      </View>

      <Text style={[styles.title, { color: theme.ink }]}>Create Account</Text>
      <Text style={[styles.subtitle, { color: theme.muted }]}>Sign up to open your GlobalSmart Plus account</Text>

      <View style={{ height: 12 }} />

      <AuthInput
        theme={theme}
        label="Full Name"
        value={fullName}
        onChangeText={setFullName}
        autoCapitalize="words"
        editable={!registerPending}
      />

      <AuthInput
        theme={theme}
        label="Email Address"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        editable={!registerPending}
      />

      <AuthInput
        theme={theme}
        label="Password"
        value={password}
        onChangeText={setPassword}
        isPassword
        editable={!registerPending}
      />

      <AuthInput
        theme={theme}
        label="Confirm Password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        isPassword
        editable={!registerPending}
      />

      {shownError ? (
        <Text style={[styles.errorText, { color: theme.red }]}>{shownError}</Text>
      ) : null}

      <View style={{ height: 8 }} />

      <TouchableOpacity
        style={[styles.registerBtn, { backgroundColor: theme.cta }, registerPending && styles.disabled]}
        activeOpacity={0.85}
        onPress={handleRegister}
        disabled={registerPending}
      >
        {registerPending ? (
          <ActivityIndicator color={theme.ctaInk} />
        ) : (
          <Text style={[styles.registerBtnText, { color: theme.ctaInk }]}>Create Account</Text>
        )}
      </TouchableOpacity>

      <View style={{ flex: 1, minHeight: 40 }} />

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: theme.muted }]}>Already have an account?</Text>
        <TouchableOpacity onPress={() => dispatch(setAuthView('login'))} activeOpacity={0.7}>
          <Text style={[styles.footerLink, { color: theme.cta }]}>Login</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, padding: 20, paddingTop: 60, paddingBottom: 30 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 34 },
  brand: { fontSize: 21, fontWeight: '800', letterSpacing: -0.3 },
  title: { fontSize: 24, fontWeight: '700', letterSpacing: -0.3, marginBottom: 6 },
  subtitle: { fontSize: 14, lineHeight: 20 },
  errorText: { fontSize: 13, fontWeight: '600', marginBottom: 14, marginTop: -6 },
  registerBtn: { height: 54, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  disabled: { opacity: 0.7 },
  registerBtnText: { fontSize: 16, fontWeight: '700' },
  footer: { alignItems: 'center', gap: 8 },
  footerText: { fontSize: 13.5 },
  footerLink: { fontSize: 14.5, fontWeight: '700' },
});
