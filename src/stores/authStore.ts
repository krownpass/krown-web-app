import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, SignupData } from "@/types/user";
import { authService, mapUser } from "@/services/auth.service";

interface AuthState {
  user: User | null;
  token: string | null;
  sessionId: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  setUser: (user: User, token: string) => void;
  login: (phone: string) => Promise<void>;
  verifyOtp: (phone: string, otp: string) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  clearError: () => void;
}

let lastLoginAttempt = 0;

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      sessionId: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      setUser: (user, token) => {
        localStorage.setItem("krown_token", token);
        localStorage.setItem("krown_user", JSON.stringify(user));
        set({ user, token, isAuthenticated: true });
      },

      login: async (phone) => {
        const now = Date.now();
        // Cooldown of 5000ms (5 seconds) to prevent React Strict Mode / double-clicking bugs
        if (now - lastLoginAttempt < 5000) {
          console.warn("Skipping login attempt due to cooldown");
          return;
        }
        lastLoginAttempt = now;

        set({ isLoading: true, error: null });
        try {
          const { session_id } = await authService.sendOtp(phone);
          set({ sessionId: session_id });
        } catch (err: unknown) {
          // Reset cooldown if it fails so users don't have to wait to correct a typo
          lastLoginAttempt = 0; 
          const message = err instanceof Error ? err.message : "Failed to send OTP";
          set({ error: message });
          throw err;
        } finally {
          set({ isLoading: false });
        }
      },

      verifyOtp: async (phone, otp) => {
        set({ isLoading: true, error: null });
        try {
          const sessionId = get().sessionId ?? undefined;
          const { token, user } = await authService.verifyOtp(phone, otp, sessionId);
          localStorage.setItem("krown_token", token);
          localStorage.setItem("krown_user", JSON.stringify(user));
          set({ user, token, isAuthenticated: true, sessionId: null });
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : "Invalid OTP";
          set({ error: message });
          throw err;
        } finally {
          set({ isLoading: false });
        }
      },

      signup: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const { token, user } = await authService.signup(data);
          localStorage.setItem("krown_token", token);
          localStorage.setItem("krown_user", JSON.stringify(user));
          set({ user, token, isAuthenticated: true });
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : "Registration failed";
          set({ error: message });
          throw err;
        } finally {
          set({ isLoading: false });
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          await authService.logout();
        } finally {
          set({ user: null, token: null, isAuthenticated: false, isLoading: false });
        }
      },

      refreshUser: async () => {
        const { token } = get();
        if (!token) return;
        try {
          const user = await authService.getMe();
          set({ user, isAuthenticated: true });
          localStorage.setItem("krown_user", JSON.stringify(user));
        } catch {
          set({ user: null, token: null, isAuthenticated: false });
        }
      },

      deleteAccount: async () => {
        set({ isLoading: true });
        try {
          await authService.deleteAccount();
          set({ user: null, token: null, isAuthenticated: false });
        } catch (error) {
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: "krown-auth",
      version: 2,
      migrate: (persisted: any) => {
        // Remap old user objects that still have server field names
        if (persisted?.user) {
          persisted.user = mapUser(persisted.user);
        }
        return persisted;
      },
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
