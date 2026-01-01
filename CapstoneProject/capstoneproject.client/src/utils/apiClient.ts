import axios, { AxiosError, type AxiosInstance } from 'axios';
import { AuthStore } from './AuthStore';
import { AuthService } from '@services/AuthService';

const BASE_URL = 'http://localhost:5026/';
export const REFRESH_TOKEN_URL = 'api/Account/refresh-token';

const apiClient: AxiosInstance = axios.create({
    baseURL: BASE_URL,
    timeout: 10000,
    withCredentials: true,
});

apiClient.interceptors.response.use((config: any) => {
    const token = AuthStore.getAccessToken();
    if (token) {
        config.headers = config.headers ?? {};
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

let isRefreshing = false;
let failedQueue: {
    resolve: (value?: unknown) => void;
    reject: (reason?: any) => void;
}[] = [];

const processQueue = (error: any, token?: string) => {
    failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
    failedQueue = [];
};

apiClient.interceptors.response.use(
    (res) => res,
    async (error: AxiosError) => {
        const originalRequest: any = error.config;
        if (!error.response || !originalRequest) return Promise.reject(error);

        const is401 = error.response.status === 401;
        const isRefreshCall = (originalRequest?.url as string | undefined)?.includes(
            REFRESH_TOKEN_URL
        );

        if (is401 && !isRefreshCall && !originalRequest._retry) {
            originalRequest._retry = true;

            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({
                        resolve: async () => {
                            const token = AuthStore.getAccessToken();
                            if (token) originalRequest.headers.Authorization = `Bearer ${token}`;
                            try {
                                const resp = await apiClient(originalRequest);
                                resolve(resp);
                            } catch (err) {
                                reject(err);
                            }
                        },
                        reject,
                    });
                });
            }

            isRefreshing = true;
            try {
                const newToken = await AuthService.refreshToken();
                if (!newToken) throw new Error('No token returned from refresh-token');

                AuthStore.setAccessToken(newToken);
                apiClient.defaults.headers.common.Authorization = `Bearer ${newToken}`;
                originalRequest.headers.Authorization = `Bearer ${newToken}`;

                processQueue(null, newToken);

                return apiClient(originalRequest);
            } catch (refreshErr) {
                console.error('[AUTH] Refresh thất bại, người dùng cần đăng nhập lại:', refreshErr);
                processQueue(refreshErr);
                AuthStore.clear();
                return Promise.reject(refreshErr);
            } finally {
                isRefreshing = false;
            }
        }

        // 👉 Chỉ log lỗi khác 401 (hoặc 401 đã xử lý mà vẫn fail)
        if (!is401) {
            console.error('[AXIOS] Lỗi request khác 401:', error);
        }

        return Promise.reject(error);
    }
);

export default apiClient;
