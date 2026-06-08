import React from 'react';
import {ActivityIndicator, View} from 'react-native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {AuthProvider, useAuth} from '../services/AuthContext';
import AuthStack from './AuthStack';
import MainDrawer from './MainDrawer';
import {COLORS} from '../constants/theme';

const Stack = createNativeStackNavigator();

const Navigator = () => {
  const {user, isLoading} = useAuth();

  if (isLoading) {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background}}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return user ? <MainDrawer /> : <AuthStack />;
};

export default function RootNavigator() {
  return (
    <AuthProvider>
      <Navigator />
    </AuthProvider>
  );
}
