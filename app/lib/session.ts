import { cookies } from "next/headers";
import crypto from "node:crypto";

// ============================================================================
// 🔐 Session Configuration
// ============================================================================

// ชื่อ cookie ที่ใช้เก็บ session
const SESSION_COOKIE = "pea_session";
// อายุ session (วัน)
const SESSION_DAYS = 7;

// ============================================================================
// 🔐 Credential Management (ENV-based)
// ============================================================================

type UserCredential = {
  username: string;
  passwordHash: string;
};

/**
 * ดึง credentials จาก environment variable AUTH_USERS
 * Format: JSON array ของ { username, passwordHash }
 * passwordHash เป็น SHA-256 hex digest ของ password
 *
 * ถ้าไม่มี AUTH_USERS ใน env จะ fallback ไปใช้ default (สำหรับ dev เท่านั้น)
 */
function getValidUsers(): UserCredential[] {
  const envUsers = process.env.AUTH_USERS;

  if (envUsers) {
    try {
      const parsed = JSON.parse(envUsers);
      if (Array.isArray(parsed)) {
        return parsed.filter(
          (u): u is UserCredential =>
            typeof u === "object" &&
            u !== null &&
            typeof u.username === "string" &&
            typeof u.passwordHash === "string",
        );
      }
    } catch {
      console.error("[Session] Failed to parse AUTH_USERS environment variable");
    }
  }

  // ⚠️ Fallback for development ONLY — ใน production ต้อง set AUTH_USERS
  if (process.env.NODE_ENV !== "production") {
    return [
      { username: "admin", passwordHash: hashPassword("1234") },
      { username: "chang", passwordHash: hashPassword("1234") },
    ];
  }

  console.error("[Session] AUTH_USERS not configured in production!");
  return [];
}

/**
 * Hash password ด้วย SHA-256
 */
export function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

/**
 * ตรวจสอบ username/password — คืน username ถ้าถูก, null ถ้าผิด
 * ใช้ constant-time comparison เพื่อป้องกัน timing attack
 */
export function validateCredentials(
  username: string,
  password: string,
): string | null {
  const users = getValidUsers();
  const passwordHash = hashPassword(password);

  for (const user of users) {
    // Constant-time comparison for both username and password
    const usernameMatch = constantTimeEqual(user.username, username);
    const passwordMatch = constantTimeEqual(user.passwordHash, passwordHash);

    if (usernameMatch && passwordMatch) {
      return user.username;
    }
  }

  return null;
}

// ============================================================================
// 🔐 HMAC-Signed Session Tokens
// ============================================================================

/**
 * ดึง Session Secret สำหรับ HMAC signing
 * ต้อง set SESSION_SECRET ใน .env (อย่างน้อย 32 chars)
 */
function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;

  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "SESSION_SECRET is required in production. Generate one with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"",
      );
    }

    // Fallback for development only
    return "dev-only-insecure-secret-do-not-use-in-production-1234567890";
  }

  if (secret.length < 32) {
    console.warn("[Session] SESSION_SECRET should be at least 32 characters");
  }

  return secret;
}

/**
 * สร้าง HMAC signature สำหรับ payload
 */
function signPayload(payload: string): string {
  const secret = getSessionSecret();
  return crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
}

/**
 * ตรวจสอบ HMAC signature
 */
function verifySignature(payload: string, signature: string): boolean {
  const expected = signPayload(payload);
  return constantTimeEqual(expected, signature);
}

/**
 * Constant-time string comparison — ป้องกัน timing attack
 */
function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    // Still do a comparison to prevent length-based timing leak
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(a); // same length intentionally
    crypto.timingSafeEqual(bufA, bufB);
    return false;
  }

  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

/**
 * สร้าง session cookie (เรียกจาก Server Action / Route Handler เท่านั้น)
 * Token format: base64(payload).hmac_signature
 */
export async function createSession(username: string) {
  const cookieStore = await cookies();
  const expires = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  const payload = JSON.stringify({
    username,
    exp: expires.getTime(),
    // Add a random nonce to make each token unique
    nonce: crypto.randomBytes(8).toString("hex"),
  });

  const encodedPayload = Buffer.from(payload).toString("base64url");
  const signature = signPayload(encodedPayload);
  const token = `${encodedPayload}.${signature}`;

  const isProduction = process.env.NODE_ENV === "production";

  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: isProduction,
    path: "/",
    expires,
    sameSite: "lax",
  });
}

/**
 * ลบ session cookie (logout)
 */
export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

/**
 * อ่าน session — คืน username ถ้า session ยัง valid, null ถ้าหมดอายุ/ไม่มี/ปลอม
 */
export async function getSession(): Promise<string | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE)?.value;
  if (!raw) return null;

  return parseSessionToken(raw);
}

/**
 * Parse และ verify session token (ใช้ได้ทั้งใน async context และ proxy)
 * คืน username ถ้า valid, null ถ้าไม่
 */
export function parseSessionToken(token: string): string | null {
  try {
    const dotIndex = token.lastIndexOf(".");
    if (dotIndex === -1) return null;

    const encodedPayload = token.slice(0, dotIndex);
    const signature = token.slice(dotIndex + 1);

    // Verify HMAC signature
    if (!verifySignature(encodedPayload, signature)) {
      return null;
    }

    // Decode and parse payload
    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf-8"),
    );

    // Check expiration
    if (typeof payload.exp === "number" && payload.exp > Date.now()) {
      return payload.username ?? null;
    }

    return null;
  } catch {
    return null;
  }
}
