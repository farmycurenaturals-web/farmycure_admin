import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

const ADMIN_USERNAME = 'mdfarmycure';
const ADMIN_PASSWORD = 'mdfarmycure@123';

const Login = () => {
  const navigate = useNavigate();
  const { setSession } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
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
    <div className="min-h-screen bg-[#f9fafb] flex items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-md bg-white border border-gray-100 rounded-xl p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Admin Login</h1>
        <p className="text-sm text-gray-500 mb-5">
          Sign in with your admin username and password.
        </p>
        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5"
            autoComplete="username"
            required
          />
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 pr-11"
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute inset-y-0 right-0 px-3 text-gray-500 hover:text-gray-700"
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
            className="w-full bg-green-600 hover:bg-green-700 text-white rounded-lg py-2.5 font-medium"
            disabled={loading}
          >
            {loading ? 'Please wait...' : 'Login'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Login;
