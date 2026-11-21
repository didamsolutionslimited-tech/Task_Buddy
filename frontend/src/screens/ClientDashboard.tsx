import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput, Image, Alert, ScrollView } from 'react-native';
import { Button } from '../components/Button';
import { taskApi } from '../api/client';
import { Search } from 'lucide-react-native';
import { brand, headingFont } from '../theme';

export default function ClientDashboard({ navigation, route }: any) {
  const me = route?.params?.me;
  const user = route?.params?.user;
  const [categories, setCategories] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await taskApi.getCategories();
      setCategories(response.data);
    } catch (err) {
      Alert.alert('Error', 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = categories.filter((cat: any) =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.greeting}>Hello 👋</Text>
          <View style={styles.headerIcons}>
            <TouchableOpacity onPress={() => navigation.navigate('Chat', { me })} style={styles.iconBtn}>
              <Text style={{ fontSize: 18 }}>💬</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Profile', { user, me })} style={styles.iconBtn}>
              <Text style={{ fontSize: 18 }}>👤</Text>
            </TouchableOpacity>
            <Image source={require('../../assets/task-buddy-logo.png')} style={styles.headerLogo} resizeMode="contain" />
          </View>
        </View>
        <Text style={styles.title}>What do you need help with today?</Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search for a service..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
        <TouchableOpacity style={styles.searchButton}>
          <Text style={styles.searchButtonText}>Search</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}><Text>Loading services...</Text></View>
      ) : (
        <FlatList
          data={filteredCategories}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.categoryCard}
              onPress={() => navigation.navigate('PostTask', { category: item })}
              activeOpacity={0.8}
            >
              <View style={styles.iconContainer}>
                <Text style={styles.categoryIcon}>{item.icon_url || '🛠️'}</Text>
              </View>
              <Text style={styles.categoryName}>{item.name}</Text>
              <Text style={styles.categoryDesc}>{item.description}</Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
    paddingTop: 60,
  },
  header: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  headerLogo: {
    width: 44,
    height: 44,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#EEE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  greeting: {
    fontSize: 18,
    color: brand.gray,
    fontWeight: '500',
  },
  title: {
    fontSize: 28,
    fontFamily: headingFont,
    color: brand.ink,
    lineHeight: 34,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 32,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#EEE',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  searchButton: {
    backgroundColor: brand.orange,
    paddingHorizontal: 20,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  searchButtonText: {
    color: '#FFF',
    fontWeight: '700',
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  categoryCard: {
    flex: 1,
    backgroundColor: '#FFF',
    margin: 8,
    padding: 20,
    borderRadius: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F0F0F0',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: brand.blueTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  categoryIcon: {
    fontSize: 30,
  },
  categoryName: {
    fontSize: 16,
    fontFamily: headingFont,
    color: brand.ink,
    marginBottom: 6,
  },
  categoryDesc: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    lineHeight: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
