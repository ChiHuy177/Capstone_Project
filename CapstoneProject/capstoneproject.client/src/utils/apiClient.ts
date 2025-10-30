// services/apiClient.ts
import axios, { type AxiosInstance } from 'axios';

const BASE_URL = 'http://localhost:5026/';

const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  withCredentials: true,
});

export const REFRESH_TOKEN_URL = 'api/Account/refresh-token';

export default apiClient;
