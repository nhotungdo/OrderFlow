import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types';
import { authApi } from '../api/authApi';

interface AuthContextType {
  user: User;
  login: (email: string, role?: 'Customer' | 'Admin') => Promise<void>;
  logout: () => void;
  switchUser: (role: 'Customer' | 'Admin') => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User>(() => authApi.getCurrentUser());

  useEffect(() => {
    setUser(authApi.getCurrentUser());
  }, []);

  const login = async (email: string, role?: 'Customer' | 'Admin') => {
    const logged = await authApi.login(email, role);
    setUser(logged);
  };

  const logout = () => {
    authApi.logout();
    setUser(authApi.switchUser('Customer'));
  };

  const switchUser = (role: 'Customer' | 'Admin') => {
    const switched = authApi.switchUser(role);
    setUser(switched);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        switchUser,
        isAdmin: user.role === 'Admin',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
