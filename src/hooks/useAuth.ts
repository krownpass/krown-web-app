'use client';

import { useAuthStore } from '@/stores/authStore';

export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const login = useAuthStore((s) => s.login);
  const verifyOtp = useAuthStore((s) => s.verifyOtp);
  const signup = useAuthStore((s) => s.signup);
  const logout = useAuthStore((s) => s.logout);
  const error = useAuthStore((s) => s.error);
  const clearError = useAuthStore((s) => s.clearError);

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    verifyOtp,
    signup,
    logout,
    error,
    clearError,
  };
}
