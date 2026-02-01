import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi, Admin, User } from '../services/api';

interface AuthContextType {
  admin: Admin | null;
  user: User | null;
  role: 'admin' | 'user' | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<'admin' | 'user'>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<'admin' | 'user' | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (token) {
      authApi
        .getMe()
        .then((response) => {
          const data = response.data;
          setRole(data.role);
          if (data.role === 'admin' && data.admin) {
            setAdmin(data.admin);
            setUser(null);
          } else if (data.role === 'user' && data.user) {
            setUser(data.user);
            setAdmin(null);
          }
        })
        .catch(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('role');
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (username: string, password: string): Promise<'admin' | 'user'> => {
    const response = await authApi.login(username, password);
    const data = response.data;

    localStorage.setItem('token', data.token);
    localStorage.setItem('role', data.role);
    setRole(data.role);

    if (data.role === 'admin' && data.admin) {
      setAdmin(data.admin);
      setUser(null);
    } else if (data.role === 'user' && data.user) {
      setUser(data.user);
      setAdmin(null);
    }

    return data.role;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    setAdmin(null);
    setUser(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider
      value={{
        admin,
        user,
        role,
        isLoading,
        isAuthenticated: !!(admin || user),
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
