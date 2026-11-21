import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Image } from 'react-native';
import { brand, headingFont, headingFontBold } from '../theme';

const { width } = Dimensions.get('window');

export default function RoleSelectionScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image source={require('../../assets/task-buddy-logo.png')} style={styles.logo} resizeMode="contain" />
        <Text style={styles.title}>Welcome to Task Buddy</Text>
        <Text style={styles.subtitle}>The most trusted way to get things done in Africa.</Text>
      </View>

      <View style={styles.cardContainer}>
        <TouchableOpacity
          style={styles.roleCard}
          onPress={() => navigation.navigate('ClientDashboard')}
          activeOpacity={0.9}
        >
          <View style={[styles.iconCircle, { backgroundColor: '#E8F5E9' }]}>
            <Text style={styles.roleIcon}>🏠</Text>
          </View>
          <Text style={styles.roleTitle}>I want to hire</Text>
          <Text style={styles.roleDesc}>Find verified pros for cleaning, plumbing, and more.</Text>
          <View style={styles.ctaContainer}>
             <Text style={styles.ctaText}>Get Started →</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.roleCard}
          onPress={() => navigation.navigate('TaskerDashboard')}
          activeOpacity={0.9}
        >
          <View style={[styles.iconCircle, { backgroundColor: '#FFF3E0' }]}>
            <Text style={styles.roleIcon}>🛠️</Text>
          </View>
          <Text style={styles.roleTitle}>I want to work</Text>
          <Text style={styles.roleDesc}>Turn your skills into earnings by helping your community.</Text>
          <View style={styles.ctaContainer}>
             <Text style={styles.ctaText}>Join the Pro Team →</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 90,
    height: 90,
    marginBottom: 10,
  },
  title: {
    fontSize: 32,
    fontFamily: headingFont,
    color: brand.ink,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  cardContainer: {
    gap: 20,
  },
  roleCard: {
    backgroundColor: '#FFFFFF',
    padding: 30,
    borderRadius: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EEE',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  roleIcon: {
    fontSize: 36,
  },
  roleTitle: {
    fontSize: 22,
    fontFamily: headingFontBold,
    color: brand.ink,
    marginBottom: 12,
  },
  roleDesc: {
    fontSize: 15,
    color: '#777',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  ctaContainer: {
    backgroundColor: brand.orange,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 50,
  },
  ctaText: {
    color: '#FFF',
    fontFamily: headingFontBold,
    fontSize: 14,
  },
});
