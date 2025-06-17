import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'salesman';
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
        const parsedUser = JSON.parse(savedUser);
        // 🔧 ENHANCED: Fetch department info if missing (for existing sessions)
        if (parsedUser.role === 'manager' && !parsedUser.department) {
          fetchUserDepartment(parsedUser);
        } else {
          setUser(parsedUser);
        }
      } catch (error) {
        console.error('Error parsing saved user:', error);
        sessionStorage.removeItem('radico_user');
      }
    }
  }, []);

  // 🔧 NEW: Fetch department info for managers
  const fetchUserDepartment = async (userInfo: User) => {
    try {
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${process.env.NEXT_PUBLIC_MASTER_SHEET_ID}/values/User Management?key=${process.env.NEXT_PUBLIC_GOOGLE_API_KEY}`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.values && data.values.length > 1) {
          // Find user row and get department from column F (index 5)
          const userRow = data.values.find((row: any[]) => 
            row[0]?.trim().toLowerCase() === userInfo.email.toLowerCase()
          );
          
          if (userRow && userRow[5]) {
            const departmentInfo = userRow[5].trim();
            const enhancedUser = {
              ...userInfo,
              department: departmentInfo
            };
            
            setUser(enhancedUser);
            sessionStorage.setItem('radico_user', JSON.stringify(enhancedUser));
            console.log(`✅ Department info added for manager: ${departmentInfo}`);
            return;
          }
        }
      }
      
      // Fallback: set user without department
      setUser(userInfo);
      console.warn('⚠️ Could not fetch department info, proceeding without');
    } catch (error) {
      console.error('Error fetching department info:', error);
      setUser(userInfo);
    }
  };

  const login = async (user: User) => {
    // 🔧 ENHANCED: Fetch department info for managers during login
    if (user.role === 'manager' && !user.department) {
      try {
        const response = await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${process.env.NEXT_PUBLIC_MASTER_SHEET_ID}/values/User Management?key=${process.env.NEXT_PUBLIC_GOOGLE_API_KEY}`
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data.values && data.values.length > 1) {
            // Find user row and get department from column F (index 5)
            const userRow = data.values.find((row: any[]) => 
              row[0]?.trim().toLowerCase() === user.email.toLowerCase()
            );
            
            if (userRow && userRow[5]) {
              const departmentInfo = userRow[5].trim();
              user.department = departmentInfo;
              console.log(`✅ Department info fetched for manager: ${departmentInfo}`);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching department during login:', error);
      }
    }

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

// 🔧 ENHANCED: Role-based data filtering utility with improved logic
export const filterDataByRole = (data: any[], user: User) => {
  if (!user || !data) return [];

  console.log(`🔍 Filtering data for ${user.role}: ${user.name}`, {
    role: user.role,
    department: user.department,
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
          item.rep === user.name;
        
        return salesmanMatch;
      });
      
      console.log(`🔍 Salesman filtering: ${salesmanData.length} items found for ${user.name}`);
      return salesmanData;
    
    case 'manager':
      // 🔧 FIXED: Since departments aren't assigned to users, derive from shops
      // For now, if no department is set, show all data (to be refined)
      if (!user.department) {
        console.warn('⚠️ Manager has no department set, showing all data');
        return data;
      }
      
      const managerData = data.filter(item => {
        const departmentMatch = 
          item.department === user.department ||
          item.region === user.department ||
          item.dept === user.department;
        
        return departmentMatch;
      });
      
      console.log(`🔍 Manager filtering: ${managerData.length} items found for department ${user.department}`);
      return managerData;
    
    case 'admin':
      // Full access to all data
      console.log(`🔍 Admin access: ${data.length} items (full access)`);
      return data;
    
    default:
      console.warn(`⚠️ Unknown role: ${user.role}, returning empty array`);
      return [];
  }
};

// 🔧 ENHANCED: Permission checking utility with comprehensive role permissions
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
  
  // Check for specific resource permissions
  if (resource) {
    switch (user.role) {
      case 'manager':
        // Managers can only access their department's resources
        if (resource !== user.department) return false;
        break;
      case 'salesman':
        // Salesmen can only access their own resources
        if (resource !== user.name && resource !== user.email) return false;
        break;
    }
  }

  const hasPermission = userPermissions.includes(action);
  
  console.log(`🔐 Permission check: ${user.role} ${user.name} -> ${action} on ${resource || 'any'}: ${hasPermission ? '✅' : '❌'}`);
  
  return hasPermission;
};

// 🔧 NEW: Helper function to get user's data scope description
export const getUserDataScope = (user: User): string => {
  if (!user) return 'No access';
  
  switch (user.role) {
    case 'admin':
      return 'All departments and salesmen (Full access)';
    case 'manager':
      return `${user.department || 'Unknown'} department only`;
    case 'salesman':
      return 'Personal shops and data only';
    default:
      return 'Limited access';
  }
};

// 🔧 NEW: Helper function to check if user needs department setup
export const needsDepartmentSetup = (user: User): boolean => {
  return user.role === 'manager' && !user.department;
};

// 🔧 NEW: Helper function to get departments accessible to user based on their shops
export const getUserAccessibleDepartments = (user: User, allShopsData: any[]): string[] => {
  if (!user || !allShopsData) return [];
  
  switch (user.role) {
    case 'admin':
      // Admin sees all departments
      return Array.from(new Set(allShopsData.map(shop => shop.department).filter(Boolean)));
    
    case 'manager':
      // Manager sees their assigned department
      return user.department ? [user.department] : [];
    
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
