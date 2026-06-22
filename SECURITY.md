# 🔒 คู่มือความปลอดภัยเว็บแอปพลิเคชัน (Web Security Guide)

## ระบบจัดการคำร้องไฟฟ้า — PEA

เอกสารนี้สรุปมาตรการความปลอดภัยที่ใช้ในโปรเจกต์ รวมถึงสิ่งที่ควรดูแลเพิ่มเติม

---

## 📋 สารบัญ

1. [สรุปมาตรการความปลอดภัย](#1-สรุปมาตรการความปลอดภัย)
2. [Session & Authentication](#2-session--authentication)
3. [Route & API Protection (Proxy)](#3-route--api-protection-proxy)
4. [Security Headers](#4-security-headers)
5. [Rate Limiting](#5-rate-limiting)
6. [Input Sanitization (XSS Protection)](#6-input-sanitization-xss-protection)
7. [Environment Variables](#7-environment-variables)
8. [สิ่งที่ควรดูแลเพิ่มเติม](#8-สิ่งที่ควรดูแลเพิ่มเติม)
9. [Checklist ก่อน Deploy Production](#9-checklist-ก่อน-deploy-production)

---

## 1. สรุปมาตรการความปลอดภัย

| มาตรการ | ไฟล์หลัก | สถานะ |
|---------|----------|-------|
| HMAC-signed session tokens | `app/lib/session.ts` | ✅ ใช้งานแล้ว |
| Password hashing (SHA-256) | `app/lib/session.ts` | ✅ ใช้งานแล้ว |
| Constant-time comparison | `app/lib/session.ts` | ✅ ใช้งานแล้ว |
| Proxy route protection | `proxy.ts` | ✅ ใช้งานแล้ว |
| API authentication guard | `app/lib/api-auth.ts` | ✅ ใช้งานแล้ว |
| Security headers (CSP, HSTS, etc.) | `proxy.ts`, `next.config.ts` | ✅ ใช้งานแล้ว |
| Rate limiting (login + API) | `app/lib/rate-limiter.ts` | ✅ ใช้งานแล้ว |
| Input sanitization (XSS) | `app/lib/sanitize.ts` | ✅ ใช้งานแล้ว |
| Phone number validation | `app/lib/sanitize.ts` | ✅ ใช้งานแล้ว |
| URL protocol validation | `app/lib/sanitize.ts` | ✅ ใช้งานแล้ว |
| Secure cookie flags | `app/lib/session.ts` | ✅ ใช้งานแล้ว |
| X-Powered-By disabled | `next.config.ts` | ✅ ใช้งานแล้ว |

---

## 2. Session & Authentication

### 📁 ไฟล์ที่เกี่ยวข้อง
- `app/lib/session.ts` — Session management core
- `app/actions/auth.ts` — Login/Logout server actions

### สิ่งที่ทำ

#### ✅ HMAC-Signed Session Tokens
- ก่อนหน้า: Session token เป็นแค่ Base64 encode → **ปลอมได้ง่ายมาก**
- ตอนนี้: ใช้ `HMAC-SHA256` sign ทุก token — format: `base64url(payload).hmac_signature`
- มี random nonce ในทุก token เพื่อป้องกัน replay

#### ✅ Environment-based Credentials
- ก่อนหน้า: Username/Password hardcode ใน source code (`admin`/`1234`)
- ตอนนี้: อ่านจาก `AUTH_USERS` environment variable (JSON array)
- Password เก็บเป็น SHA-256 hash

#### ✅ Constant-time Comparison
- ใช้ `crypto.timingSafeEqual()` สำหรับเปรียบเทียบ username และ password
- ป้องกัน timing attack ที่ attacker อาจเดา password ทีละตัว

#### ✅ Secure Cookie Flags
- `httpOnly: true` — JavaScript ไม่สามารถอ่าน cookie ได้
- `secure: true` (production) — ส่งผ่าน HTTPS เท่านั้น
- `sameSite: "lax"` — ป้องกัน CSRF เบื้องต้น

### วิธีตั้งค่า Credentials

```bash
# 1. สร้าง SESSION_SECRET (ใช้ครั้งเดียว)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 2. สร้าง password hash
node -e "console.log(require('crypto').createHash('sha256').update('YOUR_PASSWORD_HERE').digest('hex'))"

# 3. ใส่ใน .env
SESSION_SECRET="<ผลลัพธ์จากข้อ 1>"
AUTH_USERS='[{"username":"admin","passwordHash":"<ผลลัพธ์จากข้อ 2>"}]'
```

> ⚠️ **สำหรับ Development**: ถ้าไม่ set `AUTH_USERS` และ `SESSION_SECRET` จะใช้ค่า fallback (admin/1234) — **ห้ามใช้ใน production!**

---

## 3. Route & API Protection (Proxy)

### 📁 ไฟล์ที่เกี่ยวข้อง
- `proxy.ts` — Next.js 16 Proxy (แทน middleware)
- `app/lib/api-auth.ts` — API route auth guard (defense-in-depth)

### สิ่งที่ทำ

#### ✅ Proxy Layer (ชั้นที่ 1)
ทำงานก่อนทุก request:
- **Page routes**: redirect ไป `/login` ถ้าไม่มี valid session
- **API routes**: คืน `401 Unauthorized` ถ้าไม่มี valid session
- **Login page**: ถ้า login แล้ว redirect ไปหน้าหลัก

#### ✅ API Auth Guard (ชั้นที่ 2 — Defense-in-Depth)
ทุก API route เรียก `requireApiAuth()` อีกครั้ง:
- ป้องกันกรณี proxy ถูก bypass
- ตรวจ session cookie อิสระจาก proxy

### API Routes ที่ได้รับการป้องกัน
| Route | Method | Auth | Rate Limit |
|-------|--------|------|------------|
| `/api` | GET | ✅ | — |
| `/api` | POST | ✅ | ✅ Write |
| `/api/[id]` | GET | ✅ | — |
| `/api/[id]` | PUT | ✅ | ✅ Write |
| `/api/[id]` | DELETE | ✅ | ✅ Write |
| `/api/[id]/send-line` | POST | ✅ | ✅ Write |
| `/api/dashboard` | GET | ✅ | — |
| `/api/logbook` | GET | ✅ | — |

---

## 4. Security Headers

### 📁 ไฟล์ที่เกี่ยวข้อง
- `proxy.ts` — Primary (ทุก request)
- `next.config.ts` — Backup layer

### Headers ที่ถูกเพิ่ม

| Header | ค่า | ป้องกัน |
|--------|-----|---------|
| `Content-Security-Policy` | `default-src 'self'; ...` | XSS, Data Injection |
| `X-Content-Type-Options` | `nosniff` | MIME Sniffing Attack |
| `X-Frame-Options` | `DENY` | Clickjacking |
| `X-XSS-Protection` | `1; mode=block` | Reflected XSS (legacy) |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Information Leakage |
| `Permissions-Policy` | `camera=(), microphone=(), ...` | Feature Abuse |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` | HTTPS Downgrade |

### CSP (Content Security Policy) — รายละเอียด
```
default-src 'self'                    → ค่า default: อนุญาตเฉพาะ same origin
script-src 'self' 'unsafe-inline'     → Scripts: same origin + inline (สำหรับ Next.js)
style-src 'self' 'unsafe-inline'      → Styles: same origin + inline (สำหรับ Tailwind)
img-src 'self' data: blob: https://maps.google.com ...  → Images: same origin + Google Maps
connect-src 'self' https://api.line.me → AJAX: same origin + LINE API
frame-ancestors 'none'                → ห้ามฝัง iframe
form-action 'self'                    → Forms ส่งได้เฉพาะ same origin
```

> 💡 ถ้าต้องเพิ่ม domain ใหม่ (เช่น CDN, analytics) ให้แก้ใน `proxy.ts` → `SECURITY_HEADERS`

---

## 5. Rate Limiting

### 📁 ไฟล์ที่เกี่ยวข้อง
- `app/lib/rate-limiter.ts` — Rate limiter core
- `app/actions/auth.ts` — Login rate limiting
- `app/api/*/route.ts` — API rate limiting

### Profiles

| Profile | Limit | Window | ใช้กับ |
|---------|-------|--------|--------|
| `login` | 5 requests | 15 นาที | หน้า Login |
| `apiWrite` | 30 requests | 1 นาที | POST/PUT/DELETE API |
| `apiRead` | 100 requests | 1 นาที | GET API (พร้อมใช้) |

### การทำงาน
- Sliding window algorithm — นับ request ในช่วงเวลาที่กำหนด
- เมื่อเกิน limit → คืน `429 Too Many Requests` + `Retry-After` header
- Auto-cleanup ทุก 5 นาทีเพื่อป้องกัน memory leak
- Track ด้วย IP address (`x-forwarded-for` → `x-real-ip` → `unknown`)

> ⚠️ **In-Memory Store**: เหมาะกับ single-instance deployment ถ้าต้องการ multi-instance ให้พิจารณาเปลี่ยนเป็น Redis-backed store

---

## 6. Input Sanitization (XSS Protection)

### 📁 ไฟล์ที่เกี่ยวข้อง
- `app/lib/sanitize.ts` — Sanitization utilities
- `app/lib/electrical-requests-api.ts` — Applied in parsers

### สิ่งที่ทำ

#### ✅ HTML Tag Stripping
ทุก string input จะถูก strip HTML tags ก่อนเข้า database:
```
Input:  <script>alert('XSS')</script>สวัสดี
Output: สวัสดี
```

#### ✅ Max Length Enforcement
ทุก field มี max length ที่กำหนด:
```
firstName: 100 chars     phone: 20 chars
description: 2000 chars  link: 2000 chars
requestNo: 30 chars      address: 500 chars
```

#### ✅ URL Protocol Validation
field `link` อนุญาตเฉพาะ `http://` และ `https://`:
```
✅ https://example.com/doc.pdf
❌ javascript:alert('XSS')
❌ data:text/html,...
❌ vbscript:MsgBox("XSS")
```

#### ✅ Phone Number Validation
อนุญาตเฉพาะ: ตัวเลข, เครื่องหมาย `-`, `+`, `(`, `)`, ช่องว่าง
```
✅ 081-234-5678
✅ +66812345678
❌ 081<script>alert(1)</script>
```

#### ✅ Control Character Removal
ลบ null bytes และ control characters ที่อาจใช้ bypass filters

---

## 7. Environment Variables

### 📁 ไฟล์ที่เกี่ยวข้อง
- `.env` — ค่าจริง (อย่า commit!)
- `.env.example` — Template (commit ได้)

### ตัวแปรทั้งหมด

| ตัวแปร | คำอธิบาย | จำเป็น | Production |
|--------|---------|--------|------------|
| `DATABASE_URL` | Connection string (pooler) | ✅ | ✅ |
| `DIRECT_URL` | Connection string (direct) | ✅ | ✅ |
| `SESSION_SECRET` | HMAC signing key (≥32 chars) | — | ✅ **ต้อง set** |
| `AUTH_USERS` | User credentials JSON array | — | ✅ **ต้อง set** |
| `LINE_CHANNEL_ID` | LINE Bot Channel ID | — | ตามต้องการ |
| `LINE_CHANNEL_ACCESS_TOKEN` | LINE Bot Access Token | — | ตามต้องการ |
| `LINE_GROUP_ID` | LINE Group to send to | — | ตามต้องการ |

> ⚠️ `.env` ถูก `.gitignore` อยู่แล้ว — ห้ามแก้ `.gitignore` ให้ commit `.env`

---

## 8. สิ่งที่ควรดูแลเพิ่มเติม

### 🔴 ควรทำทันที (ถ้ายังไม่ได้ทำ)

1. **Rotate Credentials** — ถ้า `.env` เคย commit ไป Git:
   - เปลี่ยน database password ที่ Supabase
   - Revoke + สร้าง LINE Channel Access Token ใหม่
   - ตรวจ Git history: `git log --all --diff-filter=A -- .env`

2. **ตั้ง `SESSION_SECRET`** ใน production `.env`:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

3. **ตั้ง `AUTH_USERS`** ใน production `.env` — **เปลี่ยนรหัสผ่านจาก `1234`!**

### 🟠 ควรพิจารณาเพิ่มเติม

4. **HTTPS** — ตรวจสอบว่า deployment platform (Vercel/etc.) บังคับ HTTPS อยู่
   - `Strict-Transport-Security` header ตั้งไว้แล้วแต่ต้องมี HTTPS ก่อน

5. **Rate Limiting ด้วย Redis** — ถ้ามีหลาย instance:
   - ปัจจุบันเป็น in-memory (ทำงานเฉพาะ per-instance)
   - พิจารณา `@upstash/ratelimit` หรือ Redis-backed solution

6. **Database Connection Security**:
   - เปิด SSL สำหรับ PostgreSQL connection (`?sslmode=require`)
   - ตรวจสอบว่า Supabase RLS (Row Level Security) เปิดอยู่

7. **Logging & Monitoring**:
   - พิจารณาเพิ่ม structured logging สำหรับ auth events
   - Alert เมื่อ rate limit ถูก trigger บ่อย (อาจเป็นการโจมตี)

### 🟡 Nice-to-Have

8. **bcrypt สำหรับ Password Hashing** — SHA-256 ใช้ได้แต่ bcrypt ดีกว่า:
   ```bash
   npm install bcryptjs
   ```
   - bcrypt มี built-in salt + ช้ากว่า (ดีสำหรับ password hashing)

9. **CSRF Token** — Server Actions ของ Next.js มี built-in protection อยู่แล้ว
   แต่ถ้ามี custom forms ที่ submit ตรงไป API ควรเพิ่ม CSRF token

10. **Content Security Policy Reporting**:
    - เพิ่ม `report-uri` หรือ `report-to` directive ใน CSP
    - เพื่อรับรายงานเมื่อ CSP ถูกละเมิด

11. **Dependency Audit**:
    ```bash
    npm audit
    ```
    - ตรวจ vulnerability ใน dependencies เป็นประจำ

---

## 9. Checklist ก่อน Deploy Production

```
[ ] ตั้ง SESSION_SECRET ใน .env (≥32 chars, random)
[ ] ตั้ง AUTH_USERS ใน .env (password hash, ไม่ใช่ 1234)
[ ] ตรวจ .env ไม่ถูก commit ไป Git
[ ] เปิด HTTPS บน deployment platform
[ ] ตรวจ database connection ใช้ SSL
[ ] รัน npm audit เพื่อตรวจ dependency vulnerabilities
[ ] ทดสอบ login ด้วย credentials ผิด → ต้องโดน rate limit หลัง 5 ครั้ง
[ ] ทดสอบเข้า /api โดยไม่ login → ต้องได้ 401
[ ] ตรวจ Security Headers ผ่าน browser DevTools
[ ] ทดสอบ XSS payload ใน form → ต้องถูก sanitize
```

---

## โครงสร้างไฟล์ความปลอดภัย

```
report-electical/
├── proxy.ts                           # 🛡️ Route protection + Security headers
├── next.config.ts                     # 🛡️ Backup security headers + poweredByHeader off
├── .env.example                       # 📝 Complete env template
├── app/
│   ├── lib/
│   │   ├── session.ts                 # 🔐 HMAC-signed sessions + credential validation
│   │   ├── api-auth.ts                # 🛡️ API auth guard (defense-in-depth)
│   │   ├── rate-limiter.ts            # ⏱️ In-memory rate limiter
│   │   ├── sanitize.ts                # 🧹 Input sanitization (XSS, URL, phone)
│   │   └── electrical-requests-api.ts # ✏️ Applied sanitization in parsers
│   ├── actions/
│   │   └── auth.ts                    # 🔐 Login rate limiting + input validation
│   └── api/
│       ├── route.ts                   # 🛡️ Auth guard + rate limit
│       ├── [id]/route.ts              # 🛡️ Auth guard + rate limit
│       ├── [id]/send-line/route.ts    # 🛡️ Auth guard + rate limit
│       ├── dashboard/route.ts         # 🛡️ Auth guard
│       └── logbook/route.ts           # 🛡️ Auth guard
└── SECURITY.md                        # 📖 เอกสารนี้
```
