# 🔒 Web Security Hardening — ระบบจัดการคำร้องไฟฟ้า

แผนการปรับปรุงความปลอดภัยเว็บแอปพลิเคชันอย่างครบถ้วน สำหรับระบบรับคำร้องไฟฟ้า (Next.js 16)

## User Review Required

> [!CAUTION]
> **ข้อมูลรั่วไหลใน `.env`**: ไฟล์ `.env` มี database password (`report-electical`) และ LINE Channel Access Token ที่เป็นค่าจริง ถ้าเคย commit ไปแล้ว ต้อง **rotate credentials ทั้งหมด** ทันที

> [!WARNING]
> **Session Token ไม่มีการเซ็น (Unsigned)**: ปัจจุบัน session token เป็นแค่ Base64 encode ของ JSON — ผู้โจมตีสามารถ forge session ได้โดยง่ายมาก (สร้าง token ปลอมเพื่อ login เป็นใคร ก็ได้)

> [!WARNING]
> **รหัสผ่าน hardcode ใน source code**: Username/password ฝังอยู่ใน [session.ts](file:///e:/MyWeb/reportEletical/report-electical/app/lib/session.ts#L6-L11) เป็น plain text และรหัสผ่าน `1234` อ่อนแอมาก

> [!IMPORTANT]
> **API Routes ไม่มี Authentication Check**: ทุก API route (`/api`, `/api/[id]`, `/api/dashboard`, `/api/logbook`, `/api/[id]/send-line`) สามารถเข้าถึงได้จากภายนอกโดยไม่ต้อง login

## Open Questions

> [!IMPORTANT]
> 1. **ต้องการเก็บ user/password ใน database แทนหรือไม่?** — ปัจจุบัน hardcode ใน source code ถ้าต้องการรองรับ user หลายคนในอนาคตแนะนำย้ายไป DB + bcrypt hash แต่ในแผนนี้จะใช้ environment variable + hashed password ก่อนเพื่อไม่เปลี่ยนโครงสร้างมาก
> 2. **Rate limit ต้องการใช้ Redis/external store หรือ in-memory พอ?** — แผนนี้ใช้ in-memory rate limiter เหมาะกับ single-instance deployment ถ้ามีหลาย instance ต้องพิจารณา Redis
> 3. **ไฟล์ `.env` เคย commit ไป Git repository หรือไม่?** — ถ้าเคย ต้อง rotate ทั้ง database password, LINE access token ทันที

---

## สรุปช่องโหว่ที่พบ (Vulnerability Assessment)

| # | ช่องโหว่ | ความรุนแรง | ไฟล์ที่เกี่ยวข้อง |
|---|----------|-----------|------------------|
| 1 | Session token ไม่มีการเซ็น (forgeable) | 🔴 Critical | `app/lib/session.ts` |
| 2 | Passwords hardcoded as plain text | 🔴 Critical | `app/lib/session.ts` |
| 3 | API routes ไม่มี auth check | 🔴 Critical | `app/api/**/route.ts` |
| 4 | ไม่มี Middleware ป้องกัน route | 🟠 High | ไม่มีไฟล์ `middleware.ts` |
| 5 | ไม่มี Security Headers (CSP, HSTS, etc.) | 🟠 High | `next.config.ts` |
| 6 | ไม่มี Rate Limiting | 🟠 High | `app/api/**/route.ts` |
| 7 | ไม่มี Input Sanitization (XSS) | 🟡 Medium | `app/lib/electrical-requests-api.ts` |
| 8 | ไม่มี CSRF protection token | 🟡 Medium | `app/actions/auth.ts` |
| 9 | Cookie ไม่ set `secure` flag | 🟡 Medium | `app/lib/session.ts` |
| 10 | `.env.example` ไม่ครบถ้วน | 🟢 Low | `.env.example` |

---

## Proposed Changes

### 1. Session & Authentication Security

#### [MODIFY] [session.ts](file:///e:/MyWeb/reportEletical/report-electical/app/lib/session.ts)

เปลี่ยนจาก Base64 encode → **HMAC-SHA256 signed token** พร้อม secret key จาก environment variable:

- เพิ่ม `SESSION_SECRET` environment variable สำหรับ HMAC signing
- เปลี่ยน `createSession()` ให้สร้าง `payload + signature` — token format: `base64(payload).hmac_signature`
- เปลี่ยน `getSession()` ให้ verify HMAC signature ก่อน decode
- เพิ่ม `secure: true` ให้ cookie ใน production
- ย้าย credentials ไปเก็บใน environment variables (`AUTH_USERS`) แทน hardcode — hash password ด้วย crypto.timingSafeEqual
- เพิ่ม constant-time comparison สำหรับ password validation

#### [MODIFY] [auth.ts](file:///e:/MyWeb/reportEletical/report-electical/app/actions/auth.ts)

- เพิ่ม rate limiting สำหรับ login attempts (ป้องกัน brute force)
- เพิ่ม input length validation (username/password ไม่เกิน 100 chars)

---

### 2. Middleware — Route & API Protection

#### [NEW] [middleware.ts](file:///e:/MyWeb/reportEletical/report-electical/middleware.ts)

สร้าง Next.js Middleware เพื่อ:

- **Protected Routes**: ตรวจ session cookie ก่อนเข้าถึงทุกหน้าที่ไม่ใช่ `/login` — redirect ไป `/login` ถ้าไม่มี session
- **Protected API Routes**: ตรวจ session cookie สำหรับทุก `/api/*` route — คืน `401 Unauthorized` ถ้าไม่ valid
- **Security Headers Injection**: เพิ่ม security headers ทุก response
- ใช้ `matcher` config เพื่อ exclude static files (`_next/static`, `favicon.ico`, etc.)

---

### 3. Security Headers

#### [MODIFY] [next.config.ts](file:///e:/MyWeb/reportEletical/report-electical/next.config.ts)

เพิ่ม `headers()` configuration สำหรับ:

| Header | ค่า | ป้องกัน |
|--------|-----|---------|
| `Content-Security-Policy` | `default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://maps.google.com; connect-src 'self' https://api.line.me; ...` | XSS, Data Injection |
| `X-Content-Type-Options` | `nosniff` | MIME Sniffing |
| `X-Frame-Options` | `DENY` | Clickjacking |
| `X-XSS-Protection` | `1; mode=block` | Reflected XSS (legacy) |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Information Leakage |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(self)` | Feature Abuse |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` | Downgrade Attacks |

---

### 4. API Rate Limiting

#### [NEW] [rate-limiter.ts](file:///e:/MyWeb/reportEletical/report-electical/app/lib/rate-limiter.ts)

In-memory sliding window rate limiter:

- **Login endpoint**: 5 attempts / 15 minutes per IP
- **API write endpoints** (POST/PUT/DELETE): 30 requests / minute per IP
- **API read endpoints** (GET): 100 requests / minute per IP
- คืน `429 Too Many Requests` พร้อม `Retry-After` header เมื่อเกิน limit
- Auto-cleanup expired entries เพื่อป้องกัน memory leak

---

### 5. Input Sanitization (XSS Protection)

#### [NEW] [sanitize.ts](file:///e:/MyWeb/reportEletical/report-electical/app/lib/sanitize.ts)

Utility functions สำหรับ:

- `sanitizeString(input)` — Strip HTML tags, trim, limit length
- `sanitizeUrl(input)` — Validate URL scheme (allow only `http://`, `https://`), ป้องกัน `javascript:` protocol XSS
- `sanitizeRequestBody(body)` — Apply sanitization ให้ทุก string field ใน request body

#### [MODIFY] [electrical-requests-api.ts](file:///e:/MyWeb/reportEletical/report-electical/app/lib/electrical-requests-api.ts)

- เพิ่ม sanitization ใน `parseCreateElectricalRequest()` และ `parseUpdateElectricalRequest()`
- เพิ่ม max length validation สำหรับทุก string field (ป้องกัน payload ขนาดใหญ่)
- เพิ่ม phone format validation (เฉพาะตัวเลขและ `-`)

---

### 6. API Route Authentication Guards

#### [MODIFY] [route.ts](file:///e:/MyWeb/reportEletical/report-electical/app/api/route.ts) (main)
#### [MODIFY] [route.ts](file:///e:/MyWeb/reportEletical/report-electical/app/api/%5Bid%5D/route.ts) (by ID)
#### [MODIFY] [route.ts](file:///e:/MyWeb/reportEletical/report-electical/app/api/%5Bid%5D/send-line/route.ts) (send LINE)
#### [MODIFY] [route.ts](file:///e:/MyWeb/reportEletical/report-electical/app/api/dashboard/route.ts)
#### [MODIFY] [route.ts](file:///e:/MyWeb/reportEletical/report-electical/app/api/logbook/route.ts)

ทุก API route จะเพิ่ม:
- เรียก `requireApiAuth()` helper ที่ตรวจ session cookie — คืน `401` ถ้าไม่ valid
- เพิ่ม request body size validation (max 1MB)
- Rate limiting ผ่าน middleware

> [!NOTE]
> Authentication จะถูกตรวจทั้งใน middleware layer (ชั้นแรก) และใน API route (ชั้นสอง — defense in depth) เพื่อความปลอดภัยสูงสุด

---

### 7. Environment Variable Management

#### [MODIFY] [.env.example](file:///e:/MyWeb/reportEletical/report-electical/.env.example)

เพิ่ม entries ที่จำเป็นทั้งหมด:

```env
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
SESSION_SECRET="<random-64-char-hex>"
AUTH_USERS='[{"username":"admin","passwordHash":"<bcrypt-or-sha256-hash>"}]'
LINE_CHANNEL_ID=""
LINE_CHANNEL_ACCESS_TOKEN=""
LINE_GROUP_ID=""
```

---

## สรุปไฟล์ที่เปลี่ยนแปลง

| ไฟล์ | ประเภท | สิ่งที่ทำ |
|------|--------|----------|
| `middleware.ts` | 🆕 New | Route protection + Security headers |
| `app/lib/rate-limiter.ts` | 🆕 New | In-memory rate limiter |
| `app/lib/sanitize.ts` | 🆕 New | XSS/Input sanitization utilities |
| `app/lib/session.ts` | ✏️ Modify | HMAC-signed tokens + env-based credentials |
| `app/actions/auth.ts` | ✏️ Modify | Login rate limiting + input validation |
| `app/lib/electrical-requests-api.ts` | ✏️ Modify | Add sanitization to parsers |
| `app/api/route.ts` | ✏️ Modify | Add auth guard |
| `app/api/[id]/route.ts` | ✏️ Modify | Add auth guard |
| `app/api/[id]/send-line/route.ts` | ✏️ Modify | Add auth guard |
| `app/api/dashboard/route.ts` | ✏️ Modify | Add auth guard |
| `app/api/logbook/route.ts` | ✏️ Modify | Add auth guard |
| `next.config.ts` | ✏️ Modify | Security headers |
| `.env.example` | ✏️ Modify | Complete env template |

---

## Verification Plan

### Automated Tests
- `npm run build` — ตรวจว่า build ผ่านไม่มี TypeScript errors
- `npm run lint` — ตรวจ ESLint
- ทดสอบ login ด้วย credentials ถูก/ผิด
- ทดสอบเข้า API โดยไม่ login → ต้องได้ 401

### Manual Verification
- ตรวจ security headers ผ่าน browser DevTools (Network tab → Response Headers)
- ทดสอบ rate limiting โดย request เร็วๆ ซ้ำ → ต้องได้ 429
- ทดสอบ forge session token → ต้องถูก reject
- ทดสอบ XSS payload ใน form fields → ต้องถูก sanitize
- ตรวจ cookie flags ใน browser DevTools (httpOnly, secure, sameSite)
