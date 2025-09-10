import React, { createContext, useContext, useEffect, useState } from 'react';
import type { LoginRequest } from '../../models/AuthModel';
import { AuthService } from '../../services/AuthService';

interface User {
    id: string;
    email: string;
    name: string;
}

interface AuthContextType {
    isAuthenticated: boolean;
    user: User | null;
    login: (data: LoginRequest) => Promise<void>;
    logout: () => Promise<void>;
    loading: boolean;
}

interface AuthProviderProps {
    children: React.ReactNode;
}

// Export AuthContext for direct usage if needed
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: AuthProviderProps) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            setLoading(true);
            try {
                const me = await AuthService.getMe();
                if (me) {
                    setUser(me);
                    setIsAuthenticated(true);
                } else {
                    setUser(null);
                    setIsAuthenticated(false);
                }
            } catch {
                setUser(null);
                setIsAuthenticated(false);
            } finally {
                setLoading(false);
            }
        };
        void initAuth();
    }, []);

    const login = async (data: LoginRequest) => {
        // setLoading(true);
        try {
            const response = await AuthService.doLogin(data);
            console.log(response);

            setIsAuthenticated(true);
            setUser(response.user);
        } catch (error) {
            setIsAuthenticated(false);
            setUser(null);
            throw error;
        } finally {
            // setLoading(false);
        }
    };

    const logout = async () => {
        setLoading(true);
        try {
            // Call logout API to clear server-side session
            await AuthService.doLogout();

            // Clear client state
            setIsAuthenticated(false);
            setUser(null);

            // Clear any stored tokens/data
            localStorage.removeItem('token');
            sessionStorage.removeItem('token');
            // Best-effort: clear non-HttpOnly cookies if existed
            const deleteCookie = (name: string) => {
                document.cookie = `${name}=; Max-Age=0; path=/`;
                document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
            };
            deleteCookie('ACCESS_TOKEN');
            deleteCookie('REFRESH_TOKEN');
        } catch (error) {
            console.error('Logout error:', error);
            // Still clear client state even if API fails
            setIsAuthenticated(false);
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const value: AuthContextType = {
        isAuthenticated,
        user,
        login,
        logout,
        loading,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
