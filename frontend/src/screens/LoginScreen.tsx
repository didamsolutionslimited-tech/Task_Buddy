import React, { useState } from 'react';
import { View, Text, TextInput, Image, StyleSheet, Pressable, Alert } from 'react-native';
import { Button } from '../components/Button';
import { authApi } from '../api/client';
import { brand, headingFont, headingFontBold } from '../theme';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginScreen({ navigation }: any) {
  const [method, setMethod] = useState<'email' | 'phone'>('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [step, setStep] = useState<'identifier' | 'otp'>('identifier');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOTP = async () => {
    if (method === 'email') {
      if (!EMAIL_REGEX.test(email)) {
        Alert.alert('Error', 'Please enter a valid email address');
        return;
      }
    } else if (phone.length < 10) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }

    setLoading(true);
    try {
      if (method === 'email') {
        await authApi.sendEmailOTP(email.trim());
      } else {
        await authApi.sendOTP(phone);
      }
      setStep('otp');
    } catch (err: any) {
      const message = err?.response?.data?.error || 'Failed to send OTP. Try again.';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      Alert.alert('Error', 'Enter the 6-digit code');
      return;
    }
    setLoading(true);
    try {
      const response =
        method === 'email'
          ? await authApi.verifyEmailOTP(email.trim(), otp)
          : await authApi.verifyOTP(phone, otp);
      const user = response?.data?.user;
      if (user?.role === 'tasker') {
        navigation?.navigate('TaskerDashboard', { user, me: user.email || user.phone_number });
      } else if (user?.role === 'admin') {
        navigation?.navigate('AdminDashboard', { user });
      } else {
        navigation?.navigate('ClientDashboard', { user, me: user.email || user.phone_number });
      }
    } catch (err: any) {
      const message = err?.response?.data?.error || 'Invalid OTP code';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  const isEmailStep = step === 'identifier' && method === 'email';
  const isPhoneStep = step === 'identifier' && method === 'phone';

  return (
    <View style={styles.container}>
      <Image source={require('../../assets/task-buddy-logo.png')} style={styles.logo} resizeMode="contain" />
      <Image source={require('../../assets/task-buddy-wordmark.png')} style={styles.wordmark} resizeMode="contain" />
      <Text style={styles.subtitle}>
        {step === 'identifier'
          ? 'Log in to get started'
          : `Enter the 6-digit code sent to ${method === 'email' ? email : phone}`}
      </Text>

      {step === 'identifier' && (
        <View style={styles.methodToggle}>
          {(['email', 'phone'] as const).map((m) => (
            <Pressable
              key={m}
              onPress={() => setMethod(m)}
              style={[styles.methodTab, method === m && styles.methodTabActive]}
            >
              <Text style={[styles.methodTabText, method === m && styles.methodTabTextActive]}>
                {m === 'email' ? 'Email' : 'Phone'}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      {isEmailStep && (
        <TextInput
          style={styles.input}
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          value={email}
          onChangeText={setEmail}
        />
      )}
      {isPhoneStep && (
        <TextInput
          style={styles.input}
          placeholder="+234 ..."
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />
      )}
      {step === 'otp' && (
        <TextInput
          style={styles.input}
          placeholder="000000"
          keyboardType="number-pad"
          maxLength={6}
          value={otp}
          onChangeText={setOtp}
        />
      )}

      <Button
        title={step === 'identifier' ? 'Send Code' : 'Verify & Login'}
        onPress={step === 'identifier' ? handleSendOTP : handleVerifyOTP}
      />

      {step === 'otp' && (
        <Button
          variant="secondary"
          title="Change Email / Phone"
          onPress={() => setStep('identifier')}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  logo: {
    width: 96,
    height: 96,
    alignSelf: 'center',
    marginBottom: 0,
  },
  wordmark: {
    width: 220,
    height: 62,
    alignSelf: 'center',
    marginTop: 4,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: brand.gray,
    marginBottom: 28,
  },
  methodToggle: {
    flexDirection: 'row',
    marginBottom: 20,
    borderRadius: 14,
    backgroundColor: '#f1f1f1',
    padding: 4,
  },
  methodTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  methodTabActive: {
    backgroundColor: brand.blue,
  },
  methodTabText: {
    fontSize: 16,
    color: brand.gray,
    fontFamily: headingFontBold,
  },
  methodTabTextActive: {
    color: '#fff',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 15,
    borderRadius: 12,
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
  },
});
