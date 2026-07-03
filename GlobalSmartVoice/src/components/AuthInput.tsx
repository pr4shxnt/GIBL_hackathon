import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../constants/colors';

interface AuthInputProps extends TextInputProps {
  theme: Theme;
  label: string;
  isPassword?: boolean;
  rightAccessory?: React.ReactNode;
}

export function AuthInput({ theme, label, isPassword, rightAccessory, style, ...rest }: AuthInputProps) {
  const [hidden, setHidden] = useState(true);

  return (
    <View style={styles.wrap}>
      <View style={[styles.box, { borderColor: theme.line }]}>
        <TextInput
          style={[styles.input, { color: theme.ink }, style]}
          placeholderTextColor={theme.muted}
          secureTextEntry={isPassword && hidden}
          {...rest}
        />
        {isPassword ? (
          <TouchableOpacity onPress={() => setHidden(h => !h)} hitSlop={10}>
            <Ionicons name={hidden ? 'eye-outline' : 'eye-off-outline'} size={20} color={theme.muted} />
          </TouchableOpacity>
        ) : rightAccessory}
      </View>
      <Text style={[styles.label, { color: theme.muted, backgroundColor: theme.bg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 20 },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 58,
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 16,
    gap: 10,
  },
  input: { flex: 1, fontSize: 16, fontWeight: '600', height: '100%' },
  label: {
    position: 'absolute',
    top: -9,
    left: 14,
    fontSize: 12,
    paddingHorizontal: 6,
  },
});
