import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { brand, headingFontBold } from '../theme';

export const Button = ({ onPress, title, variant = 'primary', style }: any) => {
  const isPrimary = variant === 'primary';
  return (
    <TouchableOpacity
      style={[styles.button, !isPrimary && styles.buttonSecondary, style]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {isPrimary ? (
        <LinearGradient
          colors={[brand.orange, brand.amber]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <Text style={[styles.text, styles.textPrimary]}>{title}</Text>
        </LinearGradient>
      ) : (
        <Text style={[styles.text, styles.textSecondary]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    padding: 0,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  gradient: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  buttonSecondary: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    padding: 0,
    shadowOpacity: 0.05,
  },
  text: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
    fontFamily: headingFontBold,
  },
  textPrimary: {
    color: '#FFFFFF',
  },
  textSecondary: {
    padding: 16,
    color: brand.ink,
    textAlign: 'center',
  },
});
