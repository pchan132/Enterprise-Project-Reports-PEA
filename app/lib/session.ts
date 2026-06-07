import { cookies } from "next/headers";

// ============================================================================
// 🔐 ตั้งค่า Username / Password ที่นี่
// ============================================================================
const VALID_USERS = [
  { username: "admin", password: "1234" },
  { username: "chang", password: "1234" },
  // เพิ่ม user ได้ตามต้องการ เช่น:
  // { username: "user2", password: "pass2" },
];

// ชื่อ cookie ที่ใช้เก็บ session
const SESSION_COOKIE = "pea_session";
// อายุ session (วัน)
const SESSION_DAYS = 7;

/**
 * ตรวจสอบ username/password — คืน username ถ้าถูก, null ถ้าผิด
 */
export function validateCredentials(
  username: string,
  password: string,
): string | null {
  const user = VALID_USERS.find(
    (u) => u.username === username && u.password === password,
  );
  return user ? user.username : null;
}

/**
 * สร้าง session cookie (เรียกจาก Server Action / Route Handler เท่านั้น)
 */
export async function createSession(username: string) {
  const cookieStore = await cookies();
  const expires = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  // เข้ารหัสแบบง่าย — เพียงพอสำหรับ internal tool
  const token = Buffer.from(
    JSON.stringify({ username, exp: expires.getTime() }),
  ).toString("base64");

  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
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
 * อ่าน session — คืน username ถ้า session ยัง valid, null ถ้าหมดอายุ/ไม่มี
 */
export async function getSession(): Promise<string | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE)?.value;
  if (!raw) return null;

  try {
    const parsed = JSON.parse(Buffer.from(raw, "base64").toString("utf-8"));
    if (typeof parsed.exp === "number" && parsed.exp > Date.now()) {
      return parsed.username ?? null;
    }
    return null;
  } catch {
    return null;
  }
}
