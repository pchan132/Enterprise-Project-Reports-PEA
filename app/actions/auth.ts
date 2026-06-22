"use server";

import { redirect } from "next/navigation";
import {
  validateCredentials,
  createSession,
  deleteSession,
} from "@/app/lib/session";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/app/lib/rate-limiter";
import { headers } from "next/headers";

export type LoginState = {
  error?: string;
} | undefined;

// Input validation constants
const MAX_USERNAME_LENGTH = 100;
const MAX_PASSWORD_LENGTH = 100;

/**
 * Server Action: Login
 * - Input validation (length + empty check)
 * - Rate limiting (5 attempts / 15 min per IP)
 * - Constant-time credential validation
 */
export async function login(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;

  if (!username || !password) {
    return { error: "กรุณากรอก Username และ Password" };
  }

  // Input length validation — ป้องกัน oversized payloads
  if (username.length > MAX_USERNAME_LENGTH || password.length > MAX_PASSWORD_LENGTH) {
    return { error: "Username หรือ Password ยาวเกินไป" };
  }

  // Rate limiting — ป้องกัน brute force
  const headerList = await headers();
  const clientIp =
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headerList.get("x-real-ip") ||
    "unknown";

  const rateCheck = checkRateLimit("login", clientIp);
  if (!rateCheck.allowed) {
    return {
      error: `คุณพยายามเข้าสู่ระบบมากเกินไป กรุณารอ ${rateCheck.retryAfterSeconds} วินาทีแล้วลองใหม่`,
    };
  }

  const validUser = validateCredentials(username, password);

  if (!validUser) {
    return { error: "Username หรือ Password ไม่ถูกต้อง" };
  }

  await createSession(validUser);
  redirect("/");
}

/**
 * Server Action: Logout
 */
export async function logout() {
  await deleteSession();
  redirect("/login");
}
