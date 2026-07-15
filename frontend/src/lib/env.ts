import { z } from "zod";

/**
 * Validate and expose environment variables with full type-safety.
 * Import `env` instead of reaching for `process.env` directly so invalid
 * or missing configuration fails fast, at build/startup time.
 */
const envSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url().default("http://localhost:8000"),
});

const parsed = envSchema.safeParse({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
});

if (!parsed.success) {
  console.error(
    "❌ Invalid environment variables:",
    parsed.error.flatten().fieldErrors,
  );
  throw new Error("Invalid environment variables");
}

export const env = parsed.data;
