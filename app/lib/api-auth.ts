// ============================================================================
// 🛡️ API Route Authentication Guard
// Defense-in-depth: ตรวจ auth อีกชั้นนอกเหนือจาก middleware
// ============================================================================

import { parseSessionToken } from "@/app/lib/session";
import { cookies } from "next/headers";

/**
 * ตรวจสอบ session สำหรับ API routes (defense-in-depth)
 * คืน username ถ้า authenticated, หรือ Response 401 ถ้าไม่
 */
export async function requireApiAuth(): Promise<
  | { authenticated: true; username: string }
  | { authenticated: false; response: Response }
> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("pea_session");

  if (!sessionCookie?.value) {
    return {
      authenticated: false,
      response: Response.json(
        {
          success: false,
          message: "กรุณาเข้าสู่ระบบก่อนใช้งาน",
          errorCode: "UNAUTHORIZED",
        },
        { status: 401 },
      ),
    };
  }

  const username = parseSessionToken(sessionCookie.value);

  if (!username) {
    return {
      authenticated: false,
      response: Response.json(
        {
          success: false,
          message: "Session หมดอายุ กรุณาเข้าสู่ระบบใหม่",
          errorCode: "SESSION_EXPIRED",
        },
        { status: 401 },
      ),
    };
  }

  return { authenticated: true, username };
}
