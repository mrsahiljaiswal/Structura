import { z } from "zod";

/**
 * Validate and expose environment variables with full type-safety.
 * Import `env` instead of reaching for env vars directly.
 */
const envSchema = z.object({
  VITE_API_URL: z.string().url().default("http://localhost:8000"),
});

const parsed = envSchema.safeParse({
  VITE_API_URL: import.meta.env.VITE_API_URL,
});

if (!parsed.success) {
  console.error(
    "❌ Invalid environment variables:",
    parsed.error.flatten().fieldErrors,
  );
  throw new Error("Invalid environment variables");
}

export const env = {
  NEXT_PUBLIC_API_URL: parsed.data.VITE_API_URL,
  VITE_API_URL: parsed.data.VITE_API_URL,
};
