import React, { useState } from 'react';

interface User {
  email: string;
  name: string;
  role: 'ADMIN' | 'SALES_MANAGER' | 'SALESPERSON';
  department?: string;
  isActive: boolean;
}

interface LoginProps {
  onLogin: (user: User) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const authenticateUser = async (email: string, password: string) => {
    try {
      // Replace with your actual Google Sheets API call
      const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${process.env.NEXT_PUBLIC_USER_SHEET_ID}/values/User Management!A:E?key=${process.env.NEXT_PUBLIC_GOOGLE_API_KEY}`);
      const data = await response.json();
      
      const users = data.values.slice(1).map((row: string[]) => ({
        email: row[0],
        name: row[1],
        role: row[2] as User['role'],
        department: row[3],
        isActive: row[4] === 'TRUE'
      }));

      const user = users.find((u: User) => 
        u.email === email && 
        u.isActive
        // Add your password validation logic here
      );

      return user || null;
    } catch (error) {
      console.error('Authentication error:', error);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const user = await authenticateUser(email, password);
    
    if (user) {
      sessionStorage.setItem('radico_user', JSON.stringify(user));
      onLogin(user);
    } else {
      setError('Invalid credentials or inactive user');
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Radico Dashboard
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to your account
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center">{error}</div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
