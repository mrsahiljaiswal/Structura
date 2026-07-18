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
  // Automatically attach Clerk logged-in user ID as custom header
  if (typeof window !== "undefined" && (window as any).Clerk?.user?.id) {
    config.headers["X-User-Id"] = (window as any).Clerk.user.id;
  }
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
