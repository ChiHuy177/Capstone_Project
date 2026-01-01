// hooks/useAxiosAuth.ts
import { useAuth } from '@contexts/Auth/AuthContext';
import apiClient, { REFRESH_TOKEN_URL } from '@utils/apiClient';
import type { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';
import { useEffect, useMemo } from 'react';

interface RetriableRequestConfig extends AxiosRequestConfig {
    _retry?: boolean;
}

let isRefreshing = false;
let failedQueue: {
    resolve: (value?: unknown) => void;
    reject: (reason?: any) => void;
}[] = [];

const processQueue = (error: unknown | null) => {
    failedQueue.forEach((prom) => (error ? prom.reject(error) : prom.resolve()));
    failedQueue = [];
};

export const useAxiosAuth = (): AxiosInstance => {
    const { accessToken, setAccessToken, logout } = useAuth();

    const client = useMemo(() => apiClient, []);

    useEffect(() => {
        // REQUEST INTERCEPTOR
        const requestInterceptor = client.interceptors.request.use(
            (config: any) => {
                if (accessToken) {
                    config.headers = config.headers ?? {};
                    config.headers.Authorization = `Bearer ${accessToken}`;
                }
                return config;
            },
            (error: any) => Promise.reject(error)
        );

        // RESPONSE INTERCEPTOR
        const responseInterceptor = client.interceptors.response.use(
            (response: any) => response,
            async (error: AxiosError) => {
                const originalRequest = error.config as RetriableRequestConfig | undefined;

                if (!error.response || !originalRequest) {
                    return Promise.reject(error);
                }

                const status = error.response.status;
                const is401 = status === 401;
                const isRefreshCall = originalRequest.url?.includes(REFRESH_TOKEN_URL);

                if (is401 && !isRefreshCall) {
                    const hasLoggedIn = sessionStorage.getItem('hasLoggedIn');

                    // Case 1: user chưa đăng nhập thật sự -> logout ngay, không refresh
                    if (!hasLoggedIn) {
                        console.warn('[AUTH] 401 but no session flag, force logout');
                        await logout();
                        return Promise.reject(error);
                    }

                    // Case 2: user đã đăng nhập -> thử refresh
                    if (isRefreshing) {
                        return new Promise((resolve, reject) => {
                            failedQueue.push({ resolve, reject });
                        })
                            .then(() => client(originalRequest))
                            .catch((err) => Promise.reject(err));
                    }

                    if (!originalRequest._retry) {
                        originalRequest._retry = true;
                        isRefreshing = true;

                        // (optional) setAuthRefreshing(true) ở đây qua context để show overlay

                        try {
                            console.log('[AUTH] Refreshing token...');
                            const refreshRes = await client.post(
                                REFRESH_TOKEN_URL,
                                {},
                                { withCredentials: true }
                            );

                            const newToken = refreshRes.data as any;

                            if (newToken) {
                                console.log('[AUTH] Token refreshed.');
                                setAccessToken(newToken);

                                // update header default
                                client.defaults.headers.common[
                                    'Authorization'
                                ] = `Bearer ${newToken}`;

                                // update header cho request cũ
                                originalRequest.headers = {
                                    ...(originalRequest.headers ?? {}),
                                    Authorization: `Bearer ${newToken}`,
                                };
                            } else {
                                console.error('[AUTH] Refresh response missing token.');
                            }

                            processQueue(null);
                            return client(originalRequest);
                        } catch (refreshErr) {
                            console.error('[AUTH] Refresh failed. Logging out.');
                            processQueue(refreshErr);
                            await logout();
                            return Promise.reject(refreshErr);
                        } finally {
                            isRefreshing = false;
                        }
                    }
                }

                return Promise.reject(error);
            }
        );

        return () => {
            client.interceptors.request.eject(requestInterceptor);
            client.interceptors.response.eject(responseInterceptor);
        };
    }, [client, accessToken, setAccessToken, logout]);

    return client;
};
