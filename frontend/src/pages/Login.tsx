import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { api } from '../services/api';
import { Lock, Mail, Code2, AlertCircle } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('admin@pixeltest.com');
  const [password, setPassword] = useState('AdminPassword123!');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await api.post<{ access_token: string }>('/auth/login', {
        email,
        password,
      });

      const token = response.data.access_token;
      const meResponse = await api.get('/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });

      login(token, meResponse.data);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to login. Please check credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090d16] flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-[#111827] border border-[#273549] rounded-xl p-8 shadow-2xl">
        <div className="flex items-center justify-center space-x-3 mb-6">
          <div className="p-2.5 bg-blue-600/20 text-blue-500 rounded-lg border border-blue-500/30">
            <Code2 className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-wide">PixelTest</h1>
            <p className="text-xs text-gray-400">Frontend Assessment Workspace</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center space-x-3 text-red-400 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#161e2e] border border-[#273549] focus:border-blue-500 text-white rounded-lg pl-10 pr-4 py-2.5 outline-none transition text-sm"
                placeholder="admin@pixeltest.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#161e2e] border border-[#273549] focus:border-blue-500 text-white rounded-lg pl-10 pr-4 py-2.5 outline-none transition text-sm"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 rounded-lg transition duration-200 flex items-center justify-center text-sm shadow-lg shadow-blue-600/20 disabled:opacity-50"
          >
            {isLoading ? 'Authenticating...' : 'Sign In as Admin'}
          </button>
        </form>

        <div className="mt-6 text-center border-t border-[#273549] pt-4 text-xs text-gray-500">
          Default Admin: admin@pixeltest.com / AdminPassword123!
        </div>
      </div>
    </div>
  );
};
