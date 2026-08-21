import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { api } from '../services/api';
import { Lock, Mail, Code2, AlertCircle, Eye, EyeOff } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
    <div className="min-h-screen bg-[#13191D] flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-[#1B2328] border border-[#34414A] rounded-xl p-8 shadow-2xl">
        <div className="flex items-center justify-center space-x-3 mb-6">
          <div className="p-2.5 bg-[#D9C8A3]/10 text-[#D9C8A3] rounded-lg border border-[#D9C8A3]/30">
            <Code2 className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#F7F5F2] tracking-wide">PixelTest</h1>
            <p className="text-xs text-[#8D9498]">Frontend Assessment Workspace</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-[#FF5F5F]/10 border border-[#FF5F5F]/30 rounded-lg flex items-center space-x-3 text-[#FF5F5F] text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#C9C7C3] mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8D9498]" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#232D33] border border-[#34414A] focus:border-[#D9C8A3] text-[#F7F5F2] rounded-lg pl-10 pr-4 py-2.5 outline-none transition text-sm"
                placeholder="name@company.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#C9C7C3] mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8D9498]" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#232D33] border border-[#34414A] focus:border-[#D9C8A3] text-[#F7F5F2] rounded-lg pl-10 pr-10 py-2.5 outline-none transition text-sm"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8D9498] hover:text-[#B8FF4F] transition"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#D9C8A3] hover:bg-[#B8FF4F] text-[#13191D] font-bold py-2.5 rounded-lg transition duration-200 flex items-center justify-center text-sm shadow-lg shadow-[#D9C8A3]/10 disabled:opacity-50"
          >
            {isLoading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};
