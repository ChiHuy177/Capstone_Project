import React, { createContext, useContext, useEffect, useState } from 'react';
import type { LoginRequest, RegisterRequest } from '../../models/AuthModel';
import { AuthService } from '../../services/AuthService';
import { AuthStore } from '@utils/AuthStore';

interface User {
    id: string;
    email: string;
    name: string;
}

export interface Token {
    accessToken: string;
    refreshToken: string;
}

interface AuthContextType {
    isAuthenticated: boolean;
    user: User | null;
    login: (data: LoginRequest) => Promise<void>;
    logout: () => Promise<void>;
    loading: boolean;
    register: (data: RegisterRequest) => Promise<void>;
    accessToken: string | null;
    setAccessToken: (token: string | undefined) => void;
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
    const [accessToken, setAccessToken] = useState<string | undefined>(undefined);

    useEffect(() => {
        const initAuth = async () => {
            setLoading(true);

            try {
                const refreshed = await AuthService.refreshToken();
                console.log(refreshed);
                if (refreshed) {
                    setAccessToken(refreshed);
                    setIsAuthenticated(true);
                    console.log("vo roi ne")
                    // const me = await AuthService.getMe();
                    // setUser(me ?? null);
                } else {
                    setIsAuthenticated(false);
                    setUser(null);
                    setAccessToken(undefined);
                }
            } catch (err) {
                console.error('[AUTH] initAuth refresh error:', err);

                setIsAuthenticated(false);
                setUser(null);
                setAccessToken(undefined);
            } finally {
                setLoading(false);
            }
        };

        void initAuth();
    }, []);

    useEffect(() => {
        AuthStore.setAccessToken(accessToken);
    }, [accessToken]);

    const login = async (data: LoginRequest) => {
        // setLoading(true);
        try {
            const response: Token = await AuthService.doLogin(data);
            console.log(response.accessToken);
            setIsAuthenticated(true);
            // setUser(response.user);
            sessionStorage.setItem('hasLoggedIn', 'true');
            setAccessToken(response.accessToken);
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
            await AuthService.doLogout();

            setIsAuthenticated(false);
            setUser(null);
            setAccessToken(undefined);

            localStorage.removeItem('token');
            sessionStorage.removeItem('token');

            const deleteCookie = (name: string) => {
                document.cookie = `${name}=; Max-Age=0; path=/`;
                document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
            };
            deleteCookie('ACCESS_TOKEN');
            deleteCookie('REFRESH_TOKEN');
            await sessionStorage.removeItem('isAuth');
            console.log('Logout successful');
        } catch (error) {
            console.error('Logout error:', error);
            // Still clear client state even if API fails
            setIsAuthenticated(false);
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const register = async (data: RegisterRequest) => {
        setLoading(true);
        try {
            await AuthService.register(data);
        } catch (error) {
            console.error('Register error:', error);
        }
    };

    const value: AuthContextType = {
        isAuthenticated: isAuthenticated,
        user,
        login,
        logout,
        register,
        loading,
        accessToken: accessToken ?? null,
        setAccessToken,
    };

    // return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
    return (
        <AuthContext.Provider value={value}>
            {loading ? <div>Đang khôi phục phiên...</div> : children}
        </AuthContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
