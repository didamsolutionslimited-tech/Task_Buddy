import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert, SafeAreaView } from 'react-native';
import { Button } from '../components/Button';
import { taskApi, bookingApi, tierApi } from '../api/client';
import { headingFont, headingFontBold, brand } from '../theme';

export default function TaskerDashboard({ navigation, route }: any) {
  const me = route?.params?.me;
  const user = route?.params?.user;
  const [openTasks, setOpenTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tierInfo, setTierInfo] = useState<any>(null);

  useEffect(() => {
    loadOpenTasks();
  }, []);

  useEffect(() => {
    const uid = user?.id || me;
    if (uid) tierApi.get(uid).then((r: any) => setTierInfo(r.data)).catch(() => {});
  }, [user?.id, me]);

  const loadOpenTasks = async () => {
    try {
      const response = await taskApi.getOpenTasks();
      setOpenTasks(response.data);
    } catch (err) {
      Alert.alert('Error', 'Failed to load available tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptTask = async (taskId: string) => {
    try {
      // Using a mock TaskerId for now
      await bookingApi.acceptTask(taskId, 'mock-tasker-id');
      Alert.alert('Success', 'Job accepted! Check your active bookings.');
      loadOpenTasks();
    } catch (err) {
      Alert.alert('Error', 'This task was already taken by another pro.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome Back, Pro!</Text>
          <Text style={styles.title}>Available Gigs</Text>
        </View>
        <View style={styles.earningsBadge}>
          <Text style={styles.earningsLabel}>Earnings</Text>
          <Text style={styles.earningsValue}>₦24,500</Text>
          {tierInfo && (
            <Text style={{ fontSize: 11, marginTop: 2 }}>
              {tierInfo.tier === 'Bronze' ? '🥉' : tierInfo.tier === 'Silver' ? '🥈' : tierInfo.tier === 'Gold' ? '🥇' : '💎'}{' '}
              {tierInfo.tier} · {tierInfo.rating || '—'}★
            </Text>
          )}
        </View>
      </View>

      <View style={{ paddingHorizontal: 24, marginBottom: 16, flexDirection: 'row', gap: 10 }}>
        <TouchableOpacity
          onPress={() => navigation.navigate('Chat', { me })}
          style={{ backgroundColor: brand.orange, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 14 }}
        >
          <Text style={{ color: '#fff', fontFamily: headingFontBold, fontSize: 13 }}>💬 Messages</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigation.navigate('Profile', { user, me })}
          style={{ backgroundColor: brand.blue, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 14 }}
        >
          <Text style={{ color: '#fff', fontFamily: headingFontBold, fontSize: 13 }}>👤 Profile & theme</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}><Text>Scanning for jobs...</Text></View>
      ) : (
        <FlatList
          data={openTasks}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.taskCard} activeOpacity={0.9}>
              <View style={styles.taskHeader}>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryText}>{item.category_name || 'Service'}</Text>
                </View>
                <Text style={styles.taskBudget}>₦{item.budget}</Text>
              </View>

              <Text style={styles.taskTitle}>{item.title}</Text>
              <Text style={styles.taskDesc}>{item.description}</Text>

              <View style={styles.footer}>
                <View style={styles.locationContainer}>
                  <Text style={styles.locationIcon}>ðŸ“</Text>
                  <Text style={styles.locationText}>{item.location_address}</Text>
                </View>
                <Button
                  title="Accept Job"
                  onPress={() => handleAcceptTask(item.id)}
                  style={{ width: 'auto', paddingHorizontal: 20 }}
                />
              </View>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No available jobs in your area right now. Check back soon!</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F7F6',
    paddingTop: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 30,
  },
  greeting: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  title: {
    fontSize: 28,
    fontFamily: headingFont,
    color: '#1A1A1A',
  },
  earningsBadge: {
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    elevation: 2,
  },
  earningsLabel: {
    fontSize: 10,
    color: '#888',
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  earningsValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F2801E',
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  taskCard: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  categoryBadge: {
    backgroundColor: '#FDF1E3',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F2801E',
  },
  taskBudget: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  taskDesc: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 15,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  locationIcon: {
    fontSize: 14,
  },
  locationText: {
    fontSize: 13,
    color: '#888',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    marginTop: 100,
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 16,
    lineHeight: 24,
  },
});

