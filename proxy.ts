import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE = "pea_session";

/**
 * Proxy — ตรวจสอบ session cookie ก่อนทุก request
 * ถ้ายังไม่ login จะ redirect ไปหน้า /login
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ข้าม /login เพื่อไม่ให้ redirect วนลูป
  if (pathname === "/login") {
    return NextResponse.next();
  }

  // อ่าน session cookie
  const sessionCookie = request.cookies.get(SESSION_COOKIE)?.value;

  if (!sessionCookie) {
    // ยังไม่ login → ไปหน้า login
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // ตรวจสอบ session ยังไม่หมดอายุ
  try {
    const parsed = JSON.parse(
      Buffer.from(sessionCookie, "base64").toString("utf-8"),
    );
    if (typeof parsed.exp === "number" && parsed.exp > Date.now()) {
      return NextResponse.next();
    }
  } catch {
    // cookie ผิดรูปแบบ
  }

  // session หมดอายุหรือผิดรูปแบบ → ลบ cookie แล้ว redirect
  const response = NextResponse.redirect(new URL("/login", request.url));
  response.cookies.delete(SESSION_COOKIE);
  return response;
}

// ให้ proxy ทำงานทุก route ยกเว้น static files, api, images
export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
