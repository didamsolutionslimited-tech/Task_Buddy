import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from '../screens/LoginScreen';
import KYCScreen from '../screens/KYCScreen';
import RoleSelectionScreen from '../screens/RoleSelectionScreen';
import ClientDashboard from '../screens/ClientDashboard';
import TaskerDashboard from '../screens/TaskerDashboard';
import AdminDashboard from '../screens/AdminDashboard';
import ProfileScreen from '../screens/ProfileScreen';
import ChatScreen from '../screens/ChatScreen';

export const Stack = createStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="KYC" component={KYCScreen} />
      <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />
      <Stack.Screen name="ClientDashboard" component={ClientDashboard} />
      <Stack.Screen name="TaskerDashboard" component={TaskerDashboard} />
      <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
    </Stack.Navigator>
  );
}
