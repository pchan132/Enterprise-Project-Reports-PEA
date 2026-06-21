# LINE Push Notification — Implementation Walkthrough

## Summary

Added LINE Messaging API push notifications to the PEA request management system with two triggers:

1. **Auto-notify** — fires automatically when a new request is created
2. **Manual trigger** — a "ส่งแจ้งเตือน LINE" button on the detail page

---

## Files Changed

### New Files

#### [line-notify.ts](file:///e:/MyWeb/reportEletical/report-electical/app/lib/line-notify.ts)
Shared utility containing:
- `buildLineMessage()` — formats a Thai text message with emojis from an `ElectricalRequest` record
- `sendLineNotification()` — calls `https://api.line.me/v2/bot/message/push` via `fetch`, returns `{ success, message }`
- `sendLineNotificationAsync()` — fire-and-forget wrapper that logs errors but never throws

#### [send-line/route.ts](file:///e:/MyWeb/reportEletical/report-electical/app/api/%5Bid%5D/send-line/route.ts)
`POST /api/[id]/send-line` — manual trigger endpoint. Looks up the request by UUID or `requestNo`, calls `sendLineNotification()` (awaited), returns standardized JSON response.

#### [send-to-line-button.tsx](file:///e:/MyWeb/reportEletical/report-electical/app/components/send-to-line-button.tsx)
Reusable `"use client"` component. Features:
- Loading spinner during API call
- Emerald color scheme (distinct from existing teal/indigo/amber buttons)
- Fixed-position toast notification for success/error feedback
- Accessibility: `aria-live="polite"` on toast

---

### Modified Files

#### [route.ts](file:///e:/MyWeb/reportEletical/report-electical/app/api/route.ts) (POST handler)
- Added import of `sendLineNotificationAsync`
- After `prisma.electricalRequest.create()` succeeds, calls `sendLineNotificationAsync(created)` — non-blocking, won't delay or fail the HTTP response

#### [request-detail.tsx](file:///e:/MyWeb/reportEletical/report-electical/app/components/request-detail.tsx)
- Added `<SendToLineButton>` to the header action buttons, positioned between the print/PDF buttons and the back/edit buttons

#### [.env](file:///e:/MyWeb/reportEletical/report-electical/.env)
- Fixed `LINE_CHANNEL-ID` → `LINE_CHANNEL_ID` (hyphens are non-standard for env vars)
- Removed spaces around `=` signs for reliable dotenv parsing

---

## Message Format

```
🔔 มีคำร้องใหม่เข้าสู่ระบบ
━━━━━━━━━━━━━━━━━
📋 รหัส: REQ-260621-001
📝 ประเภท: ขอติดตั้งมิเตอร์ใหม่
👤 ผู้ขอ: สมชาย ใจดี
📍 พื้นที่: ต.ท่าศาลา อ.เมืองลพบุรี
📞 เบอร์โทร: 081-234-5678
🏷️ สถานะ: รับเรื่อง
━━━━━━━━━━━━━━━━━
⚡ กฟภ. ระบบจัดการคำร้องไฟฟ้า
```

---

## Architecture Decisions

| Decision | Rationale |
|---|---|
| **Fire-and-forget for auto-notify** | LINE API failures shouldn't block or fail request creation — the primary data operation is more important |
| **Awaited for manual trigger** | User explicitly clicked the button, so they need feedback on success/failure |
| **Shared `line-notify.ts` utility** | Both triggers use the same message format and API call logic — DRY |
| **Built-in toast (no library)** | Project doesn't have a toast library installed; keeps dependencies minimal |
| **Emerald color scheme** | Visually distinguishes the LINE button from existing teal (edit), indigo (PDF), amber (print) buttons |

---

## Environment Variables Required

| Variable | Description |
|---|---|
| `LINE_CHANNEL_ACCESS_TOKEN` | Long-lived channel access token from the LINE Developers Console |
| `LINE_GROUP_ID` | Target group ID (starts with `C`) where messages will be pushed |

> [!IMPORTANT]
> The `LINE_CHANNEL_ACCESS_TOKEN` value in `.env` appears to be a **Channel Secret**, not a Channel Access Token. The LINE Push API requires the **long-lived channel access token** which is much longer (~172 characters). You can generate one in the [LINE Developers Console](https://developers.line.biz/console/) → your channel → Messaging API tab → "Issue" button under Channel access token.

---

## Verification

- TypeScript type-checking: `npx tsc --noEmit` (running)
- Manual test: create a new request via the form → check LINE group for auto-notification
- Manual test: open request detail → click "ส่งแจ้งเตือน LINE" → verify toast + LINE group message
