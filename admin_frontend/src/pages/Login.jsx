import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

const ADMIN_USERNAME = 'mdfarmycure';
const ADMIN_PASSWORD = 'mdfarmycure@123';

const LeafMark = ({ className = '' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 15c4.5 0 9.5-3 12-9 3 7-1 14-8 14-2.8 0-4-2.2-4-5z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 16c1.8-1 3.8-2.8 5.5-5.5" />
  </svg>
);

const Login = () => {
  const navigate = useNavigate();
  const { setSession } = useAuth();
  const [username, setUsername] = useState(ADMIN_USERNAME);
  const [password, setPassword] = useState(ADMIN_PASSWORD);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const normalizedUsername = username.trim().toLowerCase();
      if (normalizedUsername !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
        setError('Invalid credentials');
        setLoading(false);
        return;
      }

      const data = await api.login({
        username: normalizedUsername,
        password: password.trim(),
      });
      if (!['admin', 'owner'].includes(data.role)) {
        setError('Only admin accounts can access this dashboard.');
        setLoading(false);
        return;
      }
      setSession(data);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f1f8f2] relative overflow-hidden px-4 py-10 flex items-center justify-center">
      <div className="absolute -top-24 -left-16 w-72 h-72 bg-green-200/60 rounded-full blur-3xl" />
      <div className="absolute -bottom-24 -right-16 w-80 h-80 bg-emerald-200/50 rounded-full blur-3xl" />

      <div className="w-full max-w-5xl rounded-2xl overflow-hidden shadow-2xl border border-green-100 bg-white/95 backdrop-blur">
        <div className="grid md:grid-cols-2">
          <div className="hidden md:flex flex-col justify-between p-10 bg-gradient-to-br from-[#1f6f43] via-[#2f855a] to-[#89c79d] text-white">
            <div>
              <img
                src="/farmycure-logo.png"
                alt="FarmyCure logo"
                className="h-20 w-auto mb-4 rounded-md shadow-md bg-black/10 p-1"
              />
              <div className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-3 py-1">
                <LeafMark className="w-4 h-4 text-[#d9fbe6]" />
                <span className="text-xs font-semibold tracking-wide">Nature Powered Admin</span>
              </div>
              <p className="text-xs tracking-[0.2em] uppercase text-white/80">FarmyCure Naturals</p>
              <h2 className="mt-4 text-3xl font-bold leading-tight">
                Grow Better.
                <br />
                Manage Smarter.
              </h2>
              <p className="mt-4 text-sm text-white/90">
                Welcome back to your admin dashboard. Track products, orders, and customer activity with ease.
              </p>
            </div>
            <div className="text-xs text-white/80">Secure admin access only.</div>
          </div>

          <form onSubmit={handleSubmit} className="p-7 md:p-10">
            <img
              src="/farmycure-logo.png"
              alt="FarmyCure logo"
              className="h-14 w-auto mb-4 rounded-md border border-green-100 bg-white p-1"
            />
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-3 py-1">
              <LeafMark className="w-4 h-4 text-[#1f6f43]" />
              <span className="text-xs font-semibold tracking-wide text-[#1f6f43]">FarmyCure Admin</span>
            </div>
            <h1 className="text-2xl font-bold text-[#1f4d36] mb-2">Admin Login</h1>
            <p className="text-sm text-gray-600 mb-6">
              Sign in with your admin username and password.
            </p>
            {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full border border-green-100 bg-[#fbfffc] rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-green-200"
                autoComplete="username"
                required
              />
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-green-100 bg-[#fbfffc] rounded-lg px-4 py-2.5 pr-11 outline-none focus:ring-2 focus:ring-green-200"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 px-3 text-gray-500 hover:text-[#1f6f43]"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18" />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M10.58 10.58A2 2 0 0013.42 13.42M9.88 5.09A9.77 9.77 0 0112 4c5 0 9.27 3.11 11 8a11.83 11.83 0 01-4.18 5.94M6.1 6.1A11.8 11.8 0 001 12c1.73 4.89 6 8 11 8a9.77 9.77 0 005.91-1.9"
                      />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"
                      />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              <button
                type="submit"
                className="w-full bg-[#1f6f43] hover:bg-[#185536] text-white rounded-lg py-2.5 font-medium transition-colors"
                disabled={loading}
              >
                {loading ? 'Please wait...' : 'Login'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
