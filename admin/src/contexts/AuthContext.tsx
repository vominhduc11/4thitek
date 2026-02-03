
import React, { createContext, useContext, useState, useEffect } from 'react';
import { env } from '@/config/env';
import { logger } from '@/utils/logger';

interface User {
  userId: number;
  username: string;
  roles: string[];
}

interface LoginResult {
  success: boolean;
  errorMessage?: string;
  requiresEmailConfirmation?: boolean;
  email?: string;
  accessToken?: string;
  refreshToken?: string;
  username?: string;
  roles?: string[];
  accountId?: number;
  expiresIn?: number;
}

interface AuthContextType {
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<LoginResult>;
  logout: () => Promise<void>;
  user: User | null;
  isLoading: boolean;
  token: string | null;
  isInitializing: boolean;
  completeEmailConfirmation: (accessToken: string, refreshToken: string, userData: User, expiresIn: number) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [skipValidation, setSkipValidation] = useState(false);

  // Use absolute URLs to API domain
  const AUTH_API_URL = `${env.apiUrl}/api/auth/login`;
  const REFRESH_API_URL = `${env.apiUrl}/api/auth/refresh`;


  // Token refresh has been removed to prevent rate limiting issues
  // Tokens will naturally expire and user will be redirected to login when needed

  useEffect(() => {
    
    if (skipValidation) {
      setIsInitializing(false);
      setSkipValidation(false);
      return;
    }
    
    const validateToken = async () => {
      const savedAuth = localStorage.getItem('distributex_auth');
      if (savedAuth) {
        try {
          const authData = JSON.parse(savedAuth);
          if (authData.token && authData.user) {
            // Trust the stored token and restore auth state
            // Token will be validated naturally when making API calls
            setIsAuthenticated(true);
            setUser(authData.user);
            setToken(authData.token);
            setRefreshToken(authData.refreshToken || null);
          }
        } catch (error) {
          // Clear invalid auth data
          localStorage.removeItem('distributex_auth');
        }
      }
      setIsInitializing(false);
    };

    validateToken();
  }, [skipValidation]);


  const login = async (username: string, password: string): Promise<LoginResult> => {
    setIsLoading(true);
    
    try {
      const response = await fetch(AUTH_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
          userType: "ADMIN"
        }),
      });

      // Read response body only once
      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        // Handle non-JSON responses (like CORS errors)
        return { 
          success: false, 
          errorMessage: response.status === 403 
            ? 'Lỗi kết nối CORS. Vui lòng liên hệ quản trị viên.'
            : `Lỗi server (${response.status}): ${response.statusText}`
        };
      }

      if (!response.ok) {
        // Handle HTTP error responses
        const apiMessage = data.message || data.error;
        const errorMessage = translateErrorMessage(apiMessage) || getErrorMessageByStatus(response.status);
        return { success: false, errorMessage };
      }
      
      if (data.success && data.data?.accessToken) {
        const {
          accessToken,
          refreshToken: newRefreshToken,
          username,
          roles,
          accountId,
          expiresIn,
          refreshExpiresIn,
          requireLoginEmailConfirmation
        } = data.data;

        // Kiểm tra xem có cần xác nhận email không
        if (requireLoginEmailConfirmation === true) {
          // Gửi API xác nhận email với body đúng format
          try {
            const confirmResponse = await fetch(`${env.apiUrl}/api/auth/send-login-confirmation`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                username: username,
                email: data.data.email || '' // Email từ response ban đầu
              })
            });

            const confirmData = await confirmResponse.json();

            if (confirmResponse.ok && confirmData.success) {
              // Trả về tất cả dữ liệu cần thiết để LoginPage có thể hoàn tất đăng nhập sau khi confirm
              return {
                success: true,
                requiresEmailConfirmation: true,
                email: confirmData.data?.email || username,
                accessToken: accessToken,
                refreshToken: newRefreshToken,
                username: username,
                roles: roles,
                accountId: accountId,
                expiresIn: expiresIn
              };
            } else {
              return {
                success: false,
                errorMessage: 'Không thể gửi mã xác nhận email. Vui lòng thử lại.'
              };
            }
          } catch (error) {
            logger.error('Error sending email confirmation:', error);
            return {
              success: false,
              errorMessage: 'Lỗi khi gửi mã xác nhận email. Vui lòng thử lại.'
            };
          }
        }

        // Nếu không cần xác nhận email, cho phép đăng nhập bình thường
        const userData: User = {
          userId: accountId || 1,
          username,
          roles
        };

        setIsAuthenticated(true);
        setUser(userData);
        setToken(accessToken);
        setRefreshToken(newRefreshToken);

        // Save to localStorage
        localStorage.setItem('distributex_auth', JSON.stringify({
          isAuthenticated: true,
          token: accessToken,
          refreshToken: newRefreshToken,
          user: userData,
          expiresIn
        }));

        // Skip validation trên useEffect tiếp theo
        setSkipValidation(true);

        return { success: true };
      }
      
      // API returned success: false
      return { 
        success: false, 
        errorMessage: data.message || 'Đăng nhập thất bại' 
      };
      
    } catch (error) {
      logger.error('Login error:', error);
      
      // Network or other errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        return { 
          success: false, 
          errorMessage: 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.' 
        };
      }
      
      return { 
        success: false, 
        errorMessage: 'Có lỗi xảy ra trong quá trình đăng nhập. Vui lòng thử lại.' 
      };
    } finally {
      setIsLoading(false);
    }
  };

  const translateErrorMessage = (message?: string): string | null => {
    if (!message) return null;
    
    const errorMap: Record<string, string> = {
      'Invalid username or password': 'Tên đăng nhập hoặc mật khẩu không đúng',
      'Username or password is incorrect': 'Tên đăng nhập hoặc mật khẩu không đúng',
      'Account not found': 'Tài khoản không tồn tại',
      'Account is disabled': 'Tài khoản đã bị vô hiệu hóa',
      'Account is locked': 'Tài khoản đã bị khóa',
      'Too many login attempts': 'Quá nhiều lần thử đăng nhập',
      'Invalid request': 'Yêu cầu không hợp lệ',
    };
    
    return errorMap[message] || message;
  };

  const getErrorMessageByStatus = (status: number): string => {
    switch (status) {
      case 400:
        return 'Thông tin đăng nhập không hợp lệ';
      case 401:
        return 'Tên đăng nhập hoặc mật khẩu không đúng';
      case 403:
        return 'Tài khoản không có quyền truy cập';
      case 404:
        return 'Không tìm thấy dịch vụ đăng nhập';
      case 429:
        return 'Quá nhiều lần thử đăng nhập. Vui lòng thử lại sau';
      case 500:
        return 'Lỗi server nội bộ. Vui lòng thử lại sau';
      case 503:
        return 'Dịch vụ tạm thời không khả dụng';
      default:
        return `Lỗi không xác định (${status})`;
    }
  };

  const logout = async () => {
    // Call logout API if token exists
    if (token) {
      try {
        await fetch(`${env.apiUrl}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      } catch (error) {
        logger.warn('Logout API call failed:', error);
      }
    }

    // Clear local state regardless of API call result
    setIsAuthenticated(false);
    setUser(null);
    setToken(null);
    setRefreshToken(null);
    localStorage.removeItem('distributex_auth');
  };

  const completeEmailConfirmation = (accessToken: string, refreshToken: string, userData: User, expiresIn: number) => {
    setIsAuthenticated(true);
    setUser(userData);
    setToken(accessToken);
    setRefreshToken(refreshToken);

    // Save to localStorage
    localStorage.setItem('distributex_auth', JSON.stringify({
      isAuthenticated: true,
      token: accessToken,
      refreshToken: refreshToken,
      user: userData,
      expiresIn
    }));

    // Skip validation trên useEffect tiếp theo
    setSkipValidation(true);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, user, isLoading, token, isInitializing, completeEmailConfirmation }}>
      {children}
    </AuthContext.Provider>
  );
};
