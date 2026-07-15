import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";

/**
 * Shared Axios instance for all API calls.
 *
 * Set NEXT_PUBLIC_API_URL in your .env.local to point this at your backend.
 * Keeping API access behind a single instance makes it easy to add auth
 * headers, logging, or retry logic in one place.
 */
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000",
  timeout: 15_000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  // Example: attach an auth token from wherever you store it (cookies,
  // a store, etc). Left as a no-op placeholder.
  // const token = getAuthToken();
  // if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Centralized error handling/logging hook.
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.error("[api error]", error.response?.status, error.message);
    }
    return Promise.reject(error);
  },
);

export default api;
