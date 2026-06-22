import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { parseSessionToken } from "@/app/lib/session";

// ============================================================================
// 🛡️ Next.js 16 Proxy — Route Protection & Security Headers
// ============================================================================

/** Routes ที่ไม่ต้อง login */
const PUBLIC_PATHS = ["/login"];

/** Security headers ที่จะเพิ่มให้ทุก response */
const SECURITY_HEADERS: Record<string, string> = {
  // ป้องกัน XSS — อนุญาตเฉพาะ resources จาก same origin
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://maps.google.com https://maps.googleapis.com https://*.tile.openstreetmap.org",
    "font-src 'self' data: https://fonts.gstatic.com",
    "connect-src 'self' https://api.line.me",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; "),

  // ป้องกัน MIME sniffing
  "X-Content-Type-Options": "nosniff",

  // ป้องกัน Clickjacking
  "X-Frame-Options": "DENY",

  // ป้องกัน Reflected XSS (legacy browsers)
  "X-XSS-Protection": "1; mode=block",

  // ลดการ leak ข้อมูล referrer
  "Referrer-Policy": "strict-origin-when-cross-origin",

  // จำกัด browser features ที่ไม่จำเป็น
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(self), payment=()",

  // บังคับ HTTPS (เฉพาะ production)
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
};

/**
 * ตรวจสอบ session cookie — verify HMAC signature
 */
function getSessionFromRequest(request: NextRequest): string | null {
  const sessionCookie = request.cookies.get("pea_session");
  if (!sessionCookie?.value) return null;

  return parseSessionToken(sessionCookie.value);
}

/**
 * เพิ่ม Security Headers ให้ response
 */
function addSecurityHeaders(response: NextResponse): NextResponse {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }

  return response;
}

/**
 * Proxy — ตรวจสอบ session + เพิ่ม Security Headers ก่อนทุก request
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ─── Skip public paths ───
  const isPublicPath = PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );

  // ─── Check session (HMAC-verified) ───
  const username = getSessionFromRequest(request);

  // ถ้าเป็น API route และไม่มี session → 401
  if (pathname.startsWith("/api")) {
    if (!username) {
      const response = NextResponse.json(
        {
          success: false,
          message: "กรุณาเข้าสู่ระบบก่อนใช้งาน",
          errorCode: "UNAUTHORIZED",
        },
        { status: 401 },
      );
      return addSecurityHeaders(response);
    }

    // Authenticated API request — add security headers and pass through
    const response = NextResponse.next();
    return addSecurityHeaders(response);
  }

  // ─── Protected page routes ───
  if (!isPublicPath && !username) {
    // ไม่มี session → redirect ไป login
    const loginUrl = new URL("/login", request.url);
    const response = NextResponse.redirect(loginUrl);
    return addSecurityHeaders(response);
  }

  // ─── ถ้า login แล้วแต่เข้า /login → redirect ไปหน้าหลัก ───
  if (isPublicPath && username) {
    const homeUrl = new URL("/", request.url);
    const response = NextResponse.redirect(homeUrl);
    return addSecurityHeaders(response);
  }

  // ─── Normal request — add security headers ───
  const response = NextResponse.next();
  return addSecurityHeaders(response);
}

// ให้ proxy ทำงานทุก route ยกเว้น static files
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
