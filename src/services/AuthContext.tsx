import React, {createContext, useContext, useEffect, useState} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AuthUser {
  token: string;
  role: string;
  name?: string;
  adminCode?: string;
  doctorCode?: string;
  employeeId?: string;
  superAdminCode?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (userData: AuthUser) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  login: async () => {},
  logout: async () => {},
});

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem('user_data');
        if (stored) setUser(JSON.parse(stored));
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = async (userData: AuthUser) => {
    await AsyncStorage.setItem('auth_token', userData.token);
    await AsyncStorage.setItem('user_data', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = async () => {
    await AsyncStorage.multiRemove(['auth_token', 'user_data']);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{user, isLoading, login, logout}}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
