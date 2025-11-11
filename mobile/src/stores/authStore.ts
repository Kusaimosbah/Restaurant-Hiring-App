import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthService } from '../services/AuthService';

export interface User {
  id: string;
  email: string;
  name: string;
  userType: 'WORKER' | 'EMPLOYER';
  profile?: any;
}

interface AuthState {
  isLoggedIn: boolean;
  user: User | null;
  userType: 'WORKER' | 'EMPLOYER' | null;
  token: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<void>;
  initializeAuth: () => Promise<void>;
  clearError: () => void;
  updateUser: (userData: Partial<User>) => void;
}

export const useAuthStore = create<AuthState & AuthActions>((set, get) => ({
  // Initial state
  isLoggedIn: false,
  user: null,
  userType: null,
  token: null,
  refreshToken: null,
  isLoading: false,
  error: null,

  // Actions
  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await AuthService.login(email, password);
      const { user, token, refreshToken } = response;

      // Store tokens securely
      await AsyncStorage.setItem('authToken', token);
      await AsyncStorage.setItem('refreshToken', refreshToken);
      await AsyncStorage.setItem('user', JSON.stringify(user));

      set({
        isLoggedIn: true,
        user,
        userType: user.userType,
        token,
        refreshToken,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || 'Login failed',
      });
      throw error;
    }
  },

  register: async (userData: any) => {
    set({ isLoading: true, error: null });
    try {
      const response = await AuthService.register(userData);
      const { user, token, refreshToken } = response;

      // Store tokens securely
      await AsyncStorage.setItem('authToken', token);
      await AsyncStorage.setItem('refreshToken', refreshToken);
      await AsyncStorage.setItem('user', JSON.stringify(user));

      set({
        isLoggedIn: true,
        user,
        userType: user.userType,
        token,
        refreshToken,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || 'Registration failed',
      });
      throw error;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      // Clear local storage
      await AsyncStorage.multiRemove([
        'authToken',
        'refreshToken',
        'user',
        'offlineData',
      ]);

      // Logout from server
      const { token } = get();
      if (token) {
        await AuthService.logout(token);
      }

      set({
        isLoggedIn: false,
        user: null,
        userType: null,
        token: null,
        refreshToken: null,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      console.error('Logout error:', error);
      // Force logout locally even if server call fails
      set({
        isLoggedIn: false,
        user: null,
        userType: null,
        token: null,
        refreshToken: null,
        isLoading: false,
        error: null,
      });
    }
  },

  refreshAccessToken: async () => {
    const { refreshToken } = get();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await AuthService.refreshToken(refreshToken);
      const { token: newToken, refreshToken: newRefreshToken } = response;

      // Update stored tokens
      await AsyncStorage.setItem('authToken', newToken);
      if (newRefreshToken) {
        await AsyncStorage.setItem('refreshToken', newRefreshToken);
      }

      set({
        token: newToken,
        refreshToken: newRefreshToken || refreshToken,
      });

      return newToken;
    } catch (error) {
      // Refresh failed, logout user
      get().logout();
      throw error;
    }
  },

  initializeAuth: async () => {
    set({ isLoading: true });
    try {
      const [storedToken, storedRefreshToken, storedUser] = await AsyncStorage.multiGet([
        'authToken',
        'refreshToken',
        'user',
      ]);

      const token = storedToken[1];
      const refreshToken = storedRefreshToken[1];
      const userString = storedUser[1];

      if (token && refreshToken && userString) {
        const user = JSON.parse(userString);
        
        // Verify token is still valid
        try {
          await AuthService.verifyToken(token);
          set({
            isLoggedIn: true,
            user,
            userType: user.userType,
            token,
            refreshToken,
            isLoading: false,
          });
        } catch (error) {
          // Token invalid, try to refresh
          try {
            await get().refreshAccessToken();
            set({
              isLoggedIn: true,
              user,
              userType: user.userType,
              isLoading: false,
            });
          } catch (refreshError) {
            // Refresh failed, clear stored data
            await AsyncStorage.multiRemove(['authToken', 'refreshToken', 'user']);
            set({
              isLoggedIn: false,
              user: null,
              userType: null,
              token: null,
              refreshToken: null,
              isLoading: false,
            });
          }
        }
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      set({ isLoading: false });
    }
  },

  clearError: () => {
    set({ error: null });
  },

  updateUser: (userData: Partial<User>) => {
    const currentUser = get().user;
    if (currentUser) {
      const updatedUser = { ...currentUser, ...userData };
      set({ user: updatedUser });
      AsyncStorage.setItem('user', JSON.stringify(updatedUser));
    }
  },
}));