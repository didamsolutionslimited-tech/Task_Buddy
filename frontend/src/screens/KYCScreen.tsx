import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Button } from '../components/Button';
import { kycApi } from '../api/client';

export default function KYCScreen({ navigation }: any) {
  const [idType, setIdType] = useState<'NIN' | 'BVN'>('NIN');
  const [idNumber, setIdNumber] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (idNumber.length < 10) {
      Alert.alert('Error', 'Please enter a valid ID number');
      return;
    }

    setLoading(true);
    try {
      const response = await kycApi.submitKYC(idType, idNumber);
      if (response.data.status === 'verified') {
        Alert.alert('Success', 'Identity verified successfully!');
        // navigation.navigate('Home');
      } else {
        Alert.alert('Pending', 'Your identity is being reviewed.');
      }
    } catch (err) {
      Alert.alert('Verification Failed', 'We could not verify your ID. Please check the number and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Secure Your Account</Text>
      <Text style={styles.subtitle}>
        To ensure safety for everyone, please verify your identity using NIN or BVN.
      </Text>

      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[styles.toggleBtn, idType === 'NIN' && styles.toggleBtnActive]}
          onPress={() => setIdType('NIN')}
        >
          <Text style={[styles.toggleText, idType === 'NIN' && styles.toggleTextActive]}>NIN</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, idType === 'BVN' && styles.toggleBtnActive]}
          onPress={() => setIdType('BVN')}
        >
          <Text style={[styles.toggleText, idType === 'BVN' && styles.toggleTextActive]}>BVN</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.input}
        placeholder={`Enter your ${idType} number`}
        keyboardType="number-pad"
        value={idNumber}
        onChangeText={setIdNumber}
      />

      <Button
        title={loading ? 'Verifying...' : 'Verify Identity'}
        onPress={handleVerify}
      />

      <Text style={styles.footerText}>
        Your data is encrypted and handled securely according to NDPR guidelines.
      </Text>
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 30,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    padding: 5,
    marginBottom: 20,
  },
  toggleBtn: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  toggleBtnActive: {
    backgroundColor: '#F2801E',
  },
  toggleText: {
    fontWeight: '600',
    color: '#666',
  },
  toggleTextActive: {
    color: '#fff',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 15,
    borderRadius: 10,
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
    color: '#999',
    marginTop: 20,
  },
});

