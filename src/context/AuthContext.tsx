'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import { TIMEOUTS } from '@/constants/timeouts';
import { User } from '@/types/auth';
import { cookieHelper } from '@/utils/cookieHelper';
import { WARRANTY_CONSTANTS } from '@/constants/warranty';

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    isHydrated: boolean;
    login: (user: User) => void;
    logout: () => void;
    clearAuth: () => void;
    getToken: () => string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isHydrated, setIsHydrated] = useState(false);

    useEffect(() => {
        // Kiểm tra xem người dùng đã đăng nhập chưa (từ localStorage)
        const checkAuth = () => {

            // Set hydrated flag first
            setIsHydrated(true);

            // Đảm bảo localStorage có sẵn (client-side)
            if (typeof window === 'undefined') {
                setIsLoading(false);
                return;
            }

            const storedUser = localStorage.getItem(WARRANTY_CONSTANTS.STORAGE_KEY);

            if (storedUser) {
                try {
                    const parsedUser = JSON.parse(storedUser);

                    // Đảm bảo dữ liệu người dùng hợp lệ
                    if (parsedUser && parsedUser.id && parsedUser.username) {
                        setUser(parsedUser);

                        // Đảm bảo cookie được đặt nếu có dữ liệu người dùng trong localStorage
                        if (!cookieHelper.hasAuthCookie()) {
                            cookieHelper.setAuthCookie();
                        }
                    } else {
                        localStorage.removeItem(WARRANTY_CONSTANTS.STORAGE_KEY);
                        setUser(null);
                    }
                } catch {
                    localStorage.removeItem(WARRANTY_CONSTANTS.STORAGE_KEY);
                    cookieHelper.clearAuthCookie();
                    setUser(null);
                }
            } else {
                setUser(null);
            }
            setIsLoading(false);
        };

        // Delay để đảm bảo component đã mount
        const timer = setTimeout(checkAuth, TIMEOUTS.AUTH_CHECK_DELAY);
        return () => clearTimeout(timer);
    }, []);

    const login = useCallback((user: User) => {
        setUser(user);

        // Lưu thông tin người dùng vào localStorage
        localStorage.setItem(WARRANTY_CONSTANTS.STORAGE_KEY, JSON.stringify(user));

        // Đặt cookie để middleware có thể nhận diện
        cookieHelper.setAuthCookie();
    }, []);

    const logout = useCallback(async () => {

        // Xóa dữ liệu người dùng khỏi localStorage
        if (typeof window !== 'undefined') {
            localStorage.removeItem(WARRANTY_CONSTANTS.STORAGE_KEY);
            cookieHelper.clearAuthCookie();
        }

        // Đặt user state về null sau khi đã xóa dữ liệu
        setUser(null);
    }, []);

    // Function để clear authentication manually
    const clearAuth = useCallback(() => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem(WARRANTY_CONSTANTS.STORAGE_KEY);
            cookieHelper.clearAuthCookie();
        }
        setUser(null);
    }, []);

    const getToken = useCallback(() => {
        if (user?.accessToken) {
            return user.accessToken;
        }
        // Fallback: try to get token from localStorage
        if (typeof window !== 'undefined') {
            const storedUser = localStorage.getItem(WARRANTY_CONSTANTS.STORAGE_KEY);
            if (storedUser) {
                try {
                    const parsedUser = JSON.parse(storedUser);
                    return parsedUser?.accessToken || null;
                } catch {
                    return null;
                }
            }
        }
        return null;
    }, [user]);

    // Memoized context value to prevent unnecessary re-renders
    const value = useMemo(() => ({
        user,
        isAuthenticated: !!user,
        isLoading,
        isHydrated,
        login,
        logout,
        clearAuth,
        getToken
    }), [user, isLoading, isHydrated, login, logout, clearAuth, getToken]);


    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
