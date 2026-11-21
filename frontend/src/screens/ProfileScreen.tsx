import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Switch, Alert } from 'react-native';
import { useTheme } from '../theme-context';
import { authApi, kycApi, tierApi } from '../api/client';
import { brand, headingFont, headingFontBold } from '../theme';

const TIER_META: Record<string, { icon: string; color: string }> = {
  Bronze: { icon: '🥉', color: '#B08D57' },
  Silver: { icon: '🥈', color: '#9FA6B2' },
  Gold: { icon: '🥇', color: '#E2B93B' },
  Platinum: { icon: '💎', color: '#29B6D8' },
};

export default function ProfileScreen({ navigation, route }: any) {
  const user = route?.params?.user || {};
  const email = route?.params?.me || user.email || '';
  const { palette, dark, setDark } = useTheme();
  const userId = user.id || email;

  const [tier, setTier] = useState<any>(null);

  useEffect(() => {
    if (!userId) return;
    tierApi.get(userId).then((r: any) => setTier(r.data)).catch(() => {});
  }, [userId]);

  const gotoKYC = () => navigation.navigate('KYC');
  const meta = TIER_META[tier?.tier] || TIER_META.Bronze;

  return (
    <ScrollView style={[styles.container, { backgroundColor: palette.bg }]} contentContainerStyle={{ padding: 20 }}>
      <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
        <Image source={require('../../assets/task-buddy-logo.png')} style={styles.logo} resizeMode="contain" />
        <Text style={[styles.name, { color: palette.ink }]}>{user.full_name || email || 'Task Buddy user'}</Text>
        <Text style={[styles.sub, { color: palette.sub }]}>
          {email || 'No email set'} · Role: {user.role || 'client'}
        </Text>
      </View>

      {/* Rating tier */}
      <Text style={[styles.sectionTitle, { color: palette.sub }]}>Reward tier</Text>
      <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border, alignItems: 'flex-start' }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <Text style={{ fontSize: 34 }}>{meta.icon}</Text>
          <View>
            <Text style={{ fontSize: 22, fontFamily: headingFont, color: meta.color }}>{tier?.tier || 'Bronze'}</Text>
            <Text style={{ fontSize: 13, color: palette.sub }}>
              {tier ? `${tier.rating || 'No reviews yet'}★ · ${tier.reviews || 0} review${tier.reviews === 1 ? '' : 's'}` : 'Loading…'}
            </Text>
          </View>
        </View>
        {tier?.progress && (
          <Text style={{ fontSize: 12, color: palette.sub, lineHeight: 18 }}>
            {tier.progress.rating_ok
              ? `⏳ Keep this rating ${tier.progress.days_needed - tier.progress.days_kept > 0 ? `${tier.progress.days_needed - tier.progress.days_kept} more day(s)` : '— checking next review…'} to reach ${tier.progress.next}`
              : `${tier.progress.rating_needed > 0 ? `+${tier.progress.rating_needed}★ to ` : '✔ Rating ready to '}${tier.progress.next} — hold it ${tier.progress.days_needed} day(s)${tier.progress.reviews_needed ? ` (+${tier.progress.reviews_needed} reviews)` : ''}`}
          </Text>
        )}
      </View>

      {/* KYC */}
      <Text style={[styles.sectionTitle, { color: palette.sub }]}>Verification</Text>
      <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
        <View style={styles.rowBetween}>
          <View>
            <Text style={[styles.rowTitle, { color: palette.ink }]}>KYC verification</Text>
            <Text style={[styles.rowSub, { color: palette.sub }]}>
              {user.is_verified ? 'Your identity is verified ✔' : 'Verify with NIN or BVN to unlock jobs'}
            </Text>
          </View>
          <TouchableOpacity onPress={gotoKYC} style={styles.ctaBtn}>
            <Text style={styles.ctaText}>{user.is_verified ? 'View' : 'Verify Now'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Appearance */}
      <Text style={[styles.sectionTitle, { color: palette.sub }]}>Appearance</Text>
      <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
        <View style={styles.rowBetween}>
          <View>
            <Text style={[styles.rowTitle, { color: palette.ink }]}>Dark mode</Text>
            <Text style={[styles.rowSub, { color: palette.sub }]}>Switch between light and dark theme</Text>
          </View>
          <Switch
            value={dark}
            onValueChange={setDark}
            trackColor={{ false: '#C7CDD4', true: brand.blue }}
            thumbColor="#FFFFFF"
          />
        </View>
      </View>

      {/* Account */}
      <Text style={[styles.sectionTitle, { color: palette.sub }]}>Account</Text>
      <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
        <TouchableOpacity
          style={styles.rowBetween}
          onPress={() => {
            if (email) navigation.navigate('Chat', { me: email });
            else Alert.alert('Chat', 'Log in first to open chat.');
          }}
        >
          <View>
            <Text style={[styles.rowTitle, { color: palette.ink }]}>Messages</Text>
            <Text style={[styles.rowSub, { color: palette.sub }]}>Chat and negotiate with your buddy/tasker</Text>
          </View>
          <Text style={{ color: palette.sub }}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.rowBetween, { marginTop: 16 }]}
          onPress={() => {
            Alert.alert('Log out', 'Log out of Task Buddy?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Log out', style: 'destructive', onPress: () => navigation.popToTop() },
            ]);
          }}
        >
          <View>
            <Text style={[styles.rowTitle, { color: '#E5484D' }]}>Log out</Text>
            <Text style={[styles.rowSub, { color: palette.sub }]}>Return to the login screen</Text>
          </View>
          <Text style={{ color: palette.sub }}>›</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  card: { borderRadius: 20, borderWidth: 1, padding: 20, marginBottom: 20, alignItems: 'center' },
  logo: { width: 72, height: 72, marginBottom: 8 },
  name: { fontSize: 22, fontFamily: headingFont },
  sub: { fontSize: 14, marginTop: 4, textAlign: 'center' },
  sectionTitle: { fontSize: 13, fontFamily: headingFontBold, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10, marginTop: 4 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' },
  rowTitle: { fontSize: 16, fontFamily: headingFontBold },
  rowSub: { fontSize: 13, marginTop: 3, maxWidth: 200 },
  ctaBtn: { backgroundColor: brand.orange, borderRadius: 999, paddingVertical: 10, paddingHorizontal: 18 },
  ctaText: { color: '#fff', fontFamily: headingFontBold, fontSize: 13 },
});
