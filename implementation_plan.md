# Dashboard Redesign — 3-Zone Operational Dashboard

Redesign the Dashboard page from a simple "cards-by-type" view into a 3-zone operational command center:
- **Zone 1**: SLA alerts + actionable call list (overdue reviews, overdue installations, pending payments)
- **Zone 2**: Horizontal workflow pipeline showing bottleneck identification
- **Zone 3**: Statistics by request type with status micro-breakdowns

## User Review Required

> [!IMPORTANT]
> **Status string matching**: The Prisma schema stores `status` as a plain `String`. The current codebase uses these exact Thai status strings:
> - `"รอตรวจสอบคำร้อง"` — for "Overdue Review" SLA check
> - `"รอติดตั้งมิเตอร์ / ดำเนินการเพิ่ม / ย้าย"` — for "Overdue Installation" SLA check
> - `"รอทำชำระเงิน"` — for the "Pending Payment" call list
>
> Your request refers to shortened names like "รอตรวจสอบ" and "รอติดตั้ง". I'll use the **full actual DB values** above in the queries to match correctly. Please confirm these are the right statuses.

> [!IMPORTANT]
> **SLA Day Thresholds**: You mentioned 3–7 days for review and 3–5 days for installation. I'll use **≥ 3 days** as the overdue threshold for both, and display the actual waiting days per item so the admin sees severity at a glance.

> [!WARNING]
> **New dependency**: `lucide-react` is not currently installed. I'll add it via `npm install lucide-react`.

## Open Questions

1. **Dashboard sub-routes**: The current dashboard links each type card to `/dashboard/[type]`. Should the new Zone 3 type cards still link to those sub-routes?
   → I'll **preserve** the existing link behavior for Zone 3 cards.

2. **Overdue items click behavior**: Should clicking an overdue SLA card navigate to a filtered request list? 
   → I'll make the overdue items link to the main request list filtered by that status for now.

---

## Proposed Changes

### Backend — New Dashboard API

#### [MODIFY] [route.ts](file:///e:/MyWeb/reportEletical/report-electical/app/api/dashboard/route.ts)

Extend the existing `/api/dashboard` API to return 3 additional data sets alongside the existing `total` + `byType`:

1. **`overdueReview`** — Count + list of requests with status `"รอตรวจสอบคำร้อง"` and `createdAt` older than 3 days
2. **`overdueInstall`** — Count + list of requests with status `"รอติดตั้งมิเตอร์ / ดำเนินการเพิ่ม / ย้าย"` and `createdAt` older than 3 days
3. **`pendingPayment`** — Full list of requests with status `"รอทำชำระเงิน"`, sorted by `createdAt ASC` (oldest first). Includes: `id`, `firstName`, `lastName`, `phone`, `requestType`, `createdAt`
4. **`pipeline`** — Count of requests grouped by status for the 5 major pipeline stages: รับเรื่อง → รอตรวจสอบคำร้อง → รอทำชำระเงิน → รอติดตั้งมิเตอร์ → เสร็จสิ้น

All queries wrapped in try-catch with standardized error response per project rules.

---

### Frontend — Dashboard Page

#### [MODIFY] [page.tsx](file:///e:/MyWeb/reportEletical/report-electical/app/dashboard/page.tsx)

Complete rewrite of the dashboard page into 3 vertical zones:

**Zone 1 — Action Center** (`ด่วน! สิ่งที่ต้องจัดการวันนี้`)
- Two SLA alert cards (red/orange theme):
  - Overdue Review card with count + pulsing indicator
  - Overdue Installation card with count + pulsing indicator
- Pending Payment call list table:
  - Sorted by `createdAt` ASC (oldest first — enforced by API)
  - Columns: #, Waiting Days, Name, Phone (`tel:` link), Request Type
  - Empty state when no pending payments

**Zone 2 — Workflow Pipeline** (`คอขวดของงานอยู่ตรงไหน?`)
- Horizontal 5-step pipeline with arrows between steps
- Each step shows status name + count
- Bottleneck step (highest count, excluding เสร็จสิ้น) gets visual emphasis (scale, border glow, animated ring)

**Zone 3 — Statistics View** (`สถิติแยกตามประเภท`)
- Grid of cards by request type (preserved from existing design)
- Each card shows total count + colored status micro-breakdown
- Cards link to `/dashboard/[type]`

**Tech details:**
- `lucide-react` icons: `AlertTriangle`, `Clock`, `Phone`, `ChevronRight`, `ArrowRight`, `Zap`, `BarChart3`, etc.
- All existing TYPE_STYLES and STATUS_COLORS preserved
- Loading skeleton covering all 3 zones
- Error state with Thai user-friendly message
- Brand color: `#007A64` (dark teal) via Tailwind `teal-700`/`teal-800`

---

## Verification Plan

### Manual Verification
- Run `npm run dev` and navigate to `/dashboard`
- Verify all 3 zones render correctly
- Verify SLA cards show correct overdue counts
- Verify pending payment list is sorted oldest-first
- Verify pipeline bottleneck is visually highlighted
- Verify type cards link to sub-routes
- Verify phone numbers are clickable `tel:` links
- Verify loading skeleton and error states
