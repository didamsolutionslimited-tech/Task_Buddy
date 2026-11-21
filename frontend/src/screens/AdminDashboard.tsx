import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Button } from '../components/Button';
import api from '../api/client';


export default function AdminDashboard({ navigation }: any) {
  const [stats, setStats] = useState<any>(null);
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      const statsRes = await api.get('/social/admin/stats');
      setStats(statsRes.data);

      // In a real app, we'd have a separate endpoint for just pending KYC users
      const usersRes = await api.get('/users/pending-kyc');
      setPendingUsers(usersRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveUser = async (userId: string) => {
    try {
      await api.post('/social/admin/verify-user', { user_id: userId });
      Alert.alert('Success', 'User has been verified!');
      loadAdminData();
    } catch (err) {
      Alert.alert('Error', 'Failed to verify user');
    }
  };

  if (loading) return <View style={styles.center}><Text>Loading Admin Panel...</Text></View>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Admin Control</Text>

      <View style={styles.statsGrid}>
        <StatCard label="Users" value={stats?.total_users} color="#4A90E2" />
        <StatCard label="Tasks" value={stats?.total_tasks} color="#F5A623" />
        <StatCard label="Revenue" value={`₦${stats?.total_revenue}`} color="#F2801E" />
        <StatCard label="Pending KYC" value={stats?.pending_kyc} color="#D0021B" />
      </View>

      <Text style={styles.sectionTitle}>Pending Verifications</Text>
      <FlatList
        data={pendingUsers}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.userRow}>
            <View>
              <Text style={styles.userName}>{item.full_name}</Text>
              <Text style={styles.userPhone}>{item.phone_number}</Text>
            </View>
            <Button
              title="Verify"
              onPress={() => handleApproveUser(item.id)}
              variant="primary"
            />
          </View>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No pending verifications</Text>}
      />
    </View>
  );
}

const StatCard = ({ label, value, color }: any) => (
  <View style={[styles.statCard, { borderLeftColor: color }]}>
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={styles.statValue}>{value || 0}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f7f6', paddingTop: 60, paddingHorizontal: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#333', marginBottom: 20, textAlign: 'center' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 30 },
  statCard: {
    backgroundColor: '#fff',
    width: '48%',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    borderLeftWidth: 5,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statLabel: { fontSize: 14, color: '#666', marginBottom: 5 },
  statValue: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  userRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    elevation: 1,
  },
  userName: { fontSize: 16, fontWeight: '600', color: '#333' },
  userPhone: { fontSize: 13, color: '#888' },
  emptyText: { textAlign: 'center', color: '#999', marginTop: 20 },
});

