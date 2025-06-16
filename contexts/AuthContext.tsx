import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  email: string;
  name: string;
  role: 'ADMIN' | 'SALES_MANAGER' | 'SALESPERSON';
  department?: string;
  isActive: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check for existing session on app load
    const savedUser = sessionStorage.getItem('radico_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Error parsing saved user:', error);
        sessionStorage.removeItem('radico_user');
      }
    }
  }, []);

  const login = (user: User) => {
    setUser(user);
    sessionStorage.setItem('radico_user', JSON.stringify(user));
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem('radico_user');
  };

  const value = {
    user,
    login,
    logout,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Role-based data filtering utility
export const filterDataByRole = (data: any[], user: User) => {
  if (!user || !data) return [];

  switch (user.role) {
    case 'SALESPERSON':
      // Filter to only show data for this salesperson
      return data.filter(item => 
        item.salesman === user.name || 
        item.assignedTo === user.email
      );
    
    case 'SALES_MANAGER':
      // Filter to show data for their department
      return data.filter(item => 
        item.department === user.department ||
        item.region === user.department
      );
    
    case 'ADMIN':
      // Full access to all data
      return data;
    
    default:
      return [];
  }
};

// Permission checking utility
export const hasPermission = (user: User, action: string, resource?: string) => {
  if (!user) return false;

  const permissions = {
    'ADMIN': ['view_all', 'edit_all', 'delete_all', 'manage_users'],
    'SALES_MANAGER': ['view_department', 'edit_department', 'view_reports'],
    'SALESPERSON': ['view_own', 'edit_own']
  };

  return permissions[user.role]?.includes(action) || false;
};
