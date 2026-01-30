import axios, { type AxiosInstance, type AxiosError, type InternalAxiosRequestConfig } from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem("accessToken");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors and token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Handle 401 - Try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const storedRefreshToken = localStorage.getItem("refreshToken");
        if (storedRefreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken: storedRefreshToken,
          });

          // Backend wraps tokens in { data: { tokens: { accessToken, refreshToken } } }
          const { tokens } = response.data.data;
          localStorage.setItem("accessToken", tokens.accessToken);
          localStorage.setItem("refreshToken", tokens.refreshToken);

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`;
          }
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed - clear tokens and redirect to login
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// API response types
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: any[];
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

// Generic API methods
export const apiService = {
  get: <T>(url: string, params?: object) =>
    api.get<ApiResponse<T>>(url, { params }).then((res) => res.data),

  post: <T>(url: string, data?: object) =>
    api.post<ApiResponse<T>>(url, data).then((res) => res.data),

  put: <T>(url: string, data?: object) =>
    api.put<ApiResponse<T>>(url, data).then((res) => res.data),

  patch: <T>(url: string, data?: object) =>
    api.patch<ApiResponse<T>>(url, data).then((res) => res.data),

  delete: <T>(url: string) =>
    api.delete<ApiResponse<T>>(url).then((res) => res.data),

  getPaginated: <T>(url: string, params?: object) =>
    api.get<PaginatedResponse<T>>(url, { params }).then((res) => res.data),
};

export default api;
