import axios from 'axios';
import type { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

export const apiClient: AxiosInstance = axios.create({
  baseURL: '',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let _refreshing = false;
let _refreshQueue: Array<(token: string | null) => void> = [];

function processQueue(token: string | null) {
  _refreshQueue.forEach(cb => cb(token));
  _refreshQueue = [];
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !original._retry && !original.url?.includes('/api/auth/')) {
      if (_refreshing) {
        return new Promise((resolve, reject) => {
          _refreshQueue.push((token) => {
            if (token) {
              original.headers.Authorization = `Bearer ${token}`;
              resolve(apiClient(original));
            } else {
              reject(error);
            }
          });
        });
      }

      original._retry = true;
      _refreshing = true;

      try {
        const res = await apiClient.post('/api/auth/refresh');
        const newToken: string = res.data.token;
        localStorage.setItem('authToken', newToken);
        if (res.data.user) {
          localStorage.setItem('user', JSON.stringify(res.data.user));
        }
        processQueue(newToken);
        original.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(original);
      } catch {
        processQueue(null);
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        window.location.href = '/';
        return Promise.reject(error);
      } finally {
        _refreshing = false;
      }
    }

    if (error.response?.status === 403) {
      console.error('Forbidden — insufficient permissions');
    }

    return Promise.reject(error);
  }
);

export default apiClient;
