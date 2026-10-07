import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { API_URL as API } from '@/config';

/**
 * Admin login page.
 *
 * Security notes:
 * - Token is stored in an httpOnly cookie set by the backend (not accessible to JS).
 * - "Already logged in" check: We do a lightweight /api/auth/me probe instead of
 *   reading localStorage, because the token is in a cookie invisible to JS.
 * - axios is configured with { withCredentials: true } so the cookie is sent
 *   automatically on every subsequent admin API call.
 */
const AdminLogin = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    // Check if already authenticated by probing a protected endpoint.
    // The httpOnly cookie is sent automatically — no localStorage read needed.
    const checkAuth = async () => {
      try {
        await axios.get(`${API}/auth/me`, { withCredentials: true });
        // If 200 → already logged in → redirect to dashboard
        navigate('/admin/dashboard', { replace: true });
      } catch {
        // 401 → not logged in → show login form
      } finally {
        setCheckingAuth(false);
      }
    };
    checkAuth();
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      toast.error('Mohon lengkapi semua field');
      return;
    }

    setLoading(true);
    try {
      // withCredentials: true — instructs the browser to store the httpOnly
      // cookie returned by the backend (Set-Cookie header).
      await axios.post(`${API}/auth/login`, formData, { withCredentials: true });
      toast.success('Login berhasil!');
      navigate('/admin/dashboard');
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error('Email atau password salah');
      } else if (error.response?.status === 429) {
        toast.error('Terlalu banyak percobaan login. Tunggu sebentar.');
      } else {
        toast.error('Terjadi kesalahan. Silakan coba lagi.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Show nothing while checking existing auth to avoid flash
  if (checkingAuth) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 dark:from-primary/5 dark:to-secondary/5 py-20" data-testid="admin-login-page">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-md px-4"
      >
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-border shadow-xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2" data-testid="login-title">
              Admin Login
            </h1>
            <p className="text-sm text-muted-foreground">
              Masuk ke dashboard admin CSRG
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6" data-testid="login-form">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                Email
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                data-testid="login-email-input"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                Password
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                data-testid="login-password-input"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
              data-testid="login-submit-button"
            >
              {loading ? 'Memproses...' : 'Login'}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminLogin;
