import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'salesman';
  department?: string; // Keep for backward compatibility but don't populate
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
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error('Error parsing saved user:', error);
        sessionStorage.removeItem('radico_user');
      }
    }
  }, []);

  const login = async (user: User) => {
    // 🔧 SIMPLIFIED: No department fetching - departments are derived from shop assignments
    console.log(`✅ Login successful for ${user.role}: ${user.name}`);
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

// 🔧 ENHANCED: Role-based data filtering utility with shop-based department logic
export const filterDataByRole = (data: any[], user: User) => {
  if (!user || !data) return [];

  console.log(`🔍 Filtering data for ${user.role}: ${user.name}`, {
    role: user.role,
    dataLength: data.length
  });

  switch (user.role) {
    case 'salesman':
      // Filter to only show data for this salesperson
      const salesmanData = data.filter(item => {
        // Try multiple matching strategies
        const salesmanMatch = 
          item.salesman === user.name || 
          item.assignedTo === user.email ||
          item.salesmanName === user.name ||
          item.rep === user.name ||
          item.salesman?.toLowerCase() === user.name?.toLowerCase();
        
        return salesmanMatch;
      });
      
      console.log(`🔍 Salesman filtering: ${salesmanData.length} items found for ${user.name}`);
      return salesmanData;
    
    case 'manager':
      // 🔧 NEW: Managers see departments based on their assigned shops
      // For now, return all data (will be refined based on shop assignments)
      console.log(`🔍 Manager access: ${data.length} items (needs shop-based filtering)`);
      return data;
    
    case 'admin':
      // Full access to all data
      console.log(`🔍 Admin access: ${data.length} items (full access)`);
      return data;
    
    default:
      console.warn(`⚠️ Unknown role: ${user.role}, returning empty array`);
      return [];
  }
};

// 🔧 ENHANCED: Permission checking utility
export const hasPermission = (user: User, action: string, resource?: string) => {
  if (!user) return false;

  const permissions = {
    'admin': [
      'view_all', 'edit_all', 'delete_all', 'manage_users', 
      'export_data', 'view_analytics', 'manage_targets',
      'view_historical', 'manage_departments', 'system_settings',
      'view_inventory'
    ],
    'manager': [
      'view_department', 'edit_department', 'view_reports',
      'export_department_data', 'view_team_analytics',
      'manage_team_targets', 'view_department_historical',
      'view_inventory'
    ],
    'salesman': [
      'view_own', 'edit_own', 'view_own_reports',
      'export_own_data', 'view_own_analytics'
      // Note: 'view_inventory' is NOT included for salesmen
    ]
  };

  const userPermissions = permissions[user.role] || [];
  const hasPermission = userPermissions.includes(action);
  
  console.log(`🔐 Permission check: ${user.role} ${user.name} -> ${action}: ${hasPermission ? '✅' : '❌'}`);
  
  return hasPermission;
};

// 🔧 NEW: Helper function to get user's accessible departments based on shop assignments
export const getUserAccessibleDepartments = (user: User, allShopsData: any[]): string[] => {
  if (!user || !allShopsData) return [];
  
  switch (user.role) {
    case 'admin':
      // Admin sees all departments
      return Array.from(new Set(allShopsData.map(shop => shop.department).filter(Boolean)));
    
    case 'manager':
      // 🔧 TODO: Implement manager department access based on shop assignments
      // For now, return all departments (to be refined)
      return Array.from(new Set(allShopsData.map(shop => shop.department).filter(Boolean)));
    
    case 'salesman':
      // Salesman sees departments of shops assigned to them
      const assignedShops = allShopsData.filter(shop => 
        shop.salesman === user.name || 
        shop.salesman === user.email ||
        shop.salesman?.toLowerCase() === user.name?.toLowerCase()
      );
      
      const departments = Array.from(new Set(assignedShops.map(shop => shop.department).filter(Boolean)));
      console.log(`🔍 Salesman ${user.name} has shops in departments:`, departments);
      return departments;
    
    default:
      return [];
  }
};
