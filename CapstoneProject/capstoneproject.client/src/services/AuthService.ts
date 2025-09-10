/* eslint-disable no-useless-catch */
import type { LoginRequest } from '../models/AuthModel';
import apiClient from '../utils/apiClient';

export class AuthService {
    static async doLogin(loginData: LoginRequest) {
        try {
            const response = await apiClient.post('api/account/login', loginData, {
                withCredentials: true,
            });
            if (response.status) {
                return response.data;
            }
        } catch (error) {
            console.error('Login failed:', error);
            throw error;
        }
    }

    static async getMe() {
        try {
            const response = await apiClient.get('api/account/me', {
                withCredentials: true,
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    static async refreshToken() {
        try {
            const response = await apiClient.post(
                'api/account/refresh-token',
                {},
                {
                    withCredentials: true,
                }
            );
            return response.data;
        } catch (error) {
            console.error('Token refresh failed:', error);
            throw error;
        }
    }

    static async doLogout() {
        try {
            const response = await apiClient.post(
                'api/account/logout',
                {},
                { withCredentials: true }
            );
            return response.data;
        } catch (error) {
            console.error('Logout failed:', error);
            throw error;
        }
    }
}
