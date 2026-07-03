import React, { useEffect } from 'react';
import { View, StyleSheet, StatusBar, ActivityIndicator } from 'react-native';
import { Provider } from 'react-redux';
import { store } from './src/store';
import { useAppDispatch, useAppSelector } from './src/store/hooks';
import { bootstrapSession } from './src/store/authSlice';
import { AppProvider, useApp } from './src/hooks/useAppContext';
import { BottomDock } from './src/components/BottomDock';
import HomeScreen from './src/screens/HomeScreen';
import AccountsScreen from './src/screens/AccountsScreen';
import CardsScreen from './src/screens/CardsScreen';
import HubScreen from './src/screens/HubScreen';
import VoiceOverlay from './src/screens/VoiceOverlay';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';

function AppShell() {
  const { theme, isDark, tab } = useApp();
  const dispatch = useAppDispatch();
  const status = useAppSelector((s) => s.auth.status);
  const authView = useAppSelector((s) => s.auth.authView);

  useEffect(() => {
    dispatch(bootstrapSession());
  }, [dispatch]);

  if (status === 'checking') {
    return (
      <View style={[styles.root, styles.center, { backgroundColor: theme.bg }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.bg} />
        <ActivityIndicator size="large" color={theme.cta} />
      </View>
    );
  }

  if (status !== 'authenticated') {
    return (
      <View style={[styles.root, { backgroundColor: theme.bg }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.bg} />
        {authView === 'login' ? <LoginScreen /> : <RegisterScreen />}
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.bg} />

      {/* Tab Content */}
      <View style={{ flex: 1 }}>
        {tab === 'home' && <HomeScreen />}
        {tab === 'accounts' && <AccountsScreen />}
        {tab === 'cards' && <CardsScreen />}
        {tab === 'hub' && <HubScreen />}
      </View>

      {/* Bottom Navigation */}
      <BottomDock />

      {/* Voice Overlay (modal) */}
      <VoiceOverlay />
    </View>
  );
}

import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function App() {
  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <AppProvider>
          <AppShell />
        </AppProvider>
      </SafeAreaProvider>
    </Provider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
