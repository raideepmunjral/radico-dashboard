import React, { useState } from 'react';

interface User {
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'salesman';
  department?: string;
  isActive: boolean;
}

interface LoginProps {
  onLogin: (user: User) => void;
}

// Interface for processing raw user data from Google Sheets
interface RawUserData {
  email: string;
  role: string;
  name: string;
  passwordHash: string;
  isActive: boolean;
}

// Simple hash function using built-in browser APIs (no external dependencies)
const hashPassword = async (password: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return `$radico$${hashHex}`;
};

export default function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const authenticateUser = async (email: string, password: string) => {
    try {
      console.log('🔍 Attempting authentication for:', email);
      
      // Fetch user data from Google Sheets
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${process.env.NEXT_PUBLIC_MASTER_SHEET_ID}/values/User Management?key=${process.env.NEXT_PUBLIC_GOOGLE_API_KEY}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }
      
      const data = await response.json();
      console.log('📊 Raw user data received:', data.values?.length || 0, 'rows');
      
      if (!data.values || data.values.length < 2) {
        throw new Error('No user data found');
      }

      // Process user data (skip header row) with explicit typing
      const rawUsers: RawUserData[] = data.values.slice(1).map((row: string[]) => ({
        email: row[0]?.trim().toLowerCase() || '',
        role: row[1]?.trim().toLowerCase() || '',
        name: row[2]?.trim() || '',
        passwordHash: row[3]?.trim() || '',
        isActive: row[4]?.trim().toUpperCase() === 'TRUE'
      }));

      // Filter users with explicit typing to avoid TypeScript error
      const validUsers = rawUsers.filter((user: RawUserData) => 
        user.email && user.passwordHash
      );

      console.log('👥 Processed users:', validUsers.length);
      console.log('🔎 Looking for email:', email.toLowerCase());

      // Find user by email
      const user = validUsers.find((u: RawUserData) => u.email === email.toLowerCase());
      
      if (!user) {
        console.log('❌ User not found');
        return null;
      }

      console.log('👤 User found:', {
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.isActive,
        hasPassword: !!user.passwordHash
      });

      // Check if user is active
      if (!user.isActive) {
        console.log('❌ User is not active');
        throw new Error('Account is not active');
      }

      // Validate role
      const validRoles = ['admin', 'manager', 'salesman'];
      if (!validRoles.includes(user.role)) {
        console.log('❌ Invalid role:', user.role);
        throw new Error('Invalid user role');
      }

      // Generate hash for provided password using built-in Web Crypto API
      const providedHash = await hashPassword(password);
      console.log('🔐 Password verification:', {
        providedHash: providedHash.substring(0, 20) + '...',
        storedHash: user.passwordHash.substring(0, 20) + '...',
        match: providedHash === user.passwordHash
      });

      // Verify password hash
      if (providedHash !== user.passwordHash) {
        console.log('❌ Password mismatch');
        return null;
      }

      console.log('✅ Authentication successful');

      // Return properly typed user object
      return {
        email: user.email,
        name: user.name,
        role: user.role as 'admin' | 'manager' | 'salesman',
        isActive: user.isActive
      };

    } catch (error) {
      console.error('🚨 Authentication error:', error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const user = await authenticateUser(email, password);
      
      if (user) {
        console.log('🎉 Login successful for:', user.name);
        // Store user in session storage
        sessionStorage.setItem('radico_user', JSON.stringify(user));
        onLogin(user);
      } else {
        setError('Invalid email or password');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      setError(error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          
          {/* Enhanced Dual Logo Layout - Bigger & Better */}
          <div className="flex items-center justify-center space-x-8 mb-6">
            {/* Logo 1 - Radico Khaitan (Perfect Square) */}
            <div className="flex flex-col items-center">
              <div className="h-24 w-24 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl shadow-lg flex items-center justify-center p-1 border border-amber-200">
                <img 
                  src="/radico-dashboard/radico-logo.png" 
                  alt="Radico Khaitan" 
                  className="h-22 w-22 object-contain rounded-lg"
                  onError={(e) => {
                    // Fallback if image doesn't exist
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    (target.nextElementSibling as HTMLElement)!.style.display = 'block';
                  }}
                />
                {/* Fallback design */}
                <div className="hidden text-center">
                  <div className="text-3xl font-bold text-amber-700 mb-1">👑</div>
                  <div className="text-xs font-bold text-amber-700">RADICO</div>
                </div>
              </div>
            </div>
            
            {/* Elegant Separator */}
            <div className="flex flex-col items-center">
              <div className="h-8 w-px bg-gradient-to-b from-transparent via-gray-300 to-transparent"></div>
              <div className="text-gray-300 text-sm font-light py-3">×</div>
              <div className="h-8 w-px bg-gradient-to-b from-transparent via-gray-300 to-transparent"></div>
            </div>
            
            {/* Logo 2 - Munjral Brothers (Clean, no text) */}
            <div className="flex flex-col items-center">
              <div className="h-24 w-24 bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl shadow-lg flex items-center justify-center p-1 border border-teal-200">
                <img 
                  src="/radico-dashboard/munjral-logo.png" 
                  alt="Munjral Brothers" 
                  className="h-22 w-22 object-cover rounded-lg"
                  onError={(e) => {
                    // Fallback if image doesn't exist
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    (target.nextElementSibling as HTMLElement)!.style.display = 'block';
                  }}
                />
                {/* Fallback design */}
                <div className="hidden text-center">
                  <div className="text-4xl font-bold text-teal-600">M</div>
                </div>
              </div>
            </div>
          </div>


          <h2 className="text-3xl font-bold text-gray-900">
            Radico Analytics Dashboard
          </h2>
          <p className="mt-2 text-gray-600">
            Enhanced Analytics & Reporting System
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </div>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-500">
            Radico Khaitan × Munjral Brothers Partnership
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Tertiary Sales Management System
          </p>
        </div>
      </div>
    </div>
  );
}
