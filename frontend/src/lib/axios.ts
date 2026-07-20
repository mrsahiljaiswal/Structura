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
  timeout: 60_000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== "undefined") {
    // 1. Extract Clerk logged-in user ID
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = window as any;
    let clerkUserId: string | undefined = win?.Clerk?.user?.id;

    // 2. Local storage cache fallback for user switching
    if (!clerkUserId) {
      clerkUserId = localStorage.getItem("structura_active_user_id") || undefined;
    } else {
      localStorage.setItem("structura_active_user_id", clerkUserId);
    }

    if (clerkUserId) {
      config.headers["X-User-Id"] = clerkUserId;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Centralized error handling/logging hook.
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.warn("[api response info]", error.response?.status, error.message);
    }
    return Promise.reject(error);
  },
);

export default api;
