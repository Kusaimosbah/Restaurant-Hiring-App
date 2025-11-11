import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { API_BASE_URL } from '../config/constants';

export interface LoginResponse {
  user: {
    id: string;
    email: string;
    name: string;
    userType: 'WORKER' | 'EMPLOYER';
    profile?: any;
  };
  token: string;
  refreshToken: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  userType: 'WORKER' | 'EMPLOYER';
  restaurantName?: string;
  phone?: string;
}

class AuthServiceClass {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        // Token will be added by the calling component
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          // This will be handled by the auth store
        }
        return Promise.reject(error);
      }
    );
  }

  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      const response = await this.api.post('/auth/signin', {
        email,
        password,
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  }

  async register(userData: RegisterData): Promise<LoginResponse> {
    try {
      const response = await this.api.post('/auth/signup', userData);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  }

  async logout(token: string): Promise<void> {
    try {
      await this.api.post('/auth/logout', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      // Ignore logout errors
      console.warn('Logout request failed:', error);
    }
  }

  async refreshToken(refreshToken: string): Promise<{ token: string; refreshToken?: string }> {
    try {
      const response = await this.api.post('/auth/refresh', {
        refreshToken,
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Token refresh failed');
    }
  }

  async verifyToken(token: string): Promise<boolean> {
    try {
      await this.api.get('/auth/verify', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  async forgotPassword(email: string): Promise<void> {
    try {
      await this.api.post('/auth/forgot-password', { email });
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Password reset request failed');
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      await this.api.post('/auth/reset-password', {
        token,
        password: newPassword,
      });
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Password reset failed');
    }
  }

  async verifyEmail(token: string): Promise<void> {
    try {
      await this.api.post('/auth/verify-email', { token });
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Email verification failed');
    }
  }

  // Helper method to create authenticated requests
  createAuthenticatedRequest(token: string): AxiosInstance {
    return axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
  }
}

export const AuthService = new AuthServiceClass();