import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {BASE_URL} from '../constants/api';

export const instance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {'Content-Type': 'application/json'},
});

// Request interceptor — attach token
instance.interceptors.request.use(
  async config => {
    const token = await AsyncStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error),
);

// Response interceptor — handle 401
instance.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      await AsyncStorage.multiRemove(['auth_token', 'user_data']);
      // Navigation to login is handled by RootNavigator watching auth state
    }
    return Promise.reject(error);
  },
);
