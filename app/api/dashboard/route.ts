import { prisma } from "@/app/lib/prisma";
import { REQUEST_TYPES } from "@/app/lib/data/request-types";

export const runtime = "nodejs";

// ---------------------------------------------------------------------------
// Status constants (ต้องตรงกับค่าใน DB)
// ---------------------------------------------------------------------------

const STATUS_REVIEW = "รอตรวจสอบคำร้อง";
const STATUS_PAYMENT = "รอทำชำระเงิน";
const STATUS_INSTALL = "รอติดตั้งมิเตอร์ / ดำเนินการเพิ่ม / ย้าย";

/** Pipeline stages – in display order (left → right) */
const PIPELINE_STAGES = [
  "รับเรื่อง",
  STATUS_REVIEW,
  STATUS_PAYMENT,
  STATUS_INSTALL,
  "เสร็จสิ้น",
] as const;

/** SLA threshold in days */
const SLA_OVERDUE_DAYS = 3;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(0, 0, 0, 0);
  return d;
}

// ---------------------------------------------------------------------------
// GET /api/dashboard
// ---------------------------------------------------------------------------

/**
 * Response shape:
 * {
 *   total: number,
 *   byType: { type, label, count, statusCounts }[],
 *   overdueReview: { count, items: { id, firstName, lastName, createdAt, waitingDays }[] },
 *   overdueInstall: { count, items: { id, firstName, lastName, createdAt, waitingDays }[] },
 *   pendingPayment: { count, items: { id, firstName, lastName, phone, requestType, createdAt, waitingDays }[] },
 *   pipeline: { status, count }[],
 * }
 */
export async function GET() {
  try {
    const now = new Date();
    const threshold = daysAgo(SLA_OVERDUE_DAYS);

    // ─── Run all queries in parallel ───
    const [
      total,
      typeCounts,
      typeStatusCounts,
      overdueReviewItems,
      overdueInstallItems,
      pendingPaymentItems,
      pipelineCounts,
    ] = await Promise.all([
      // 1. Total count
      prisma.electricalRequest.count(),

      // 2. Count by requestType (unnest)
      prisma.$queryRaw<{ type_value: string; count: bigint }[]>`
        SELECT t.type_value, COUNT(*) AS count
        FROM electrical_requests,
             LATERAL unnest(request_type) AS t(type_value)
        GROUP BY t.type_value
        ORDER BY count DESC
      `,

      // 3. Count by requestType + status
      prisma.$queryRaw<
        { type_value: string; status: string; count: bigint }[]
      >`
        SELECT t.type_value, e.status, COUNT(*) AS count
        FROM electrical_requests e,
             LATERAL unnest(e.request_type) AS t(type_value)
        GROUP BY t.type_value, e.status
        ORDER BY t.type_value, count DESC
      `,

      // 4. Overdue Review (status = รอตรวจสอบคำร้อง, createdAt < threshold)
      prisma.electricalRequest.findMany({
        where: {
          status: STATUS_REVIEW,
          createdAt: { lt: threshold },
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          createdAt: true,
        },
        orderBy: { createdAt: "asc" },
      }),

      // 5. Overdue Install (status = รอติดตั้ง..., createdAt < threshold)
      prisma.electricalRequest.findMany({
        where: {
          status: STATUS_INSTALL,
          createdAt: { lt: threshold },
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          createdAt: true,
        },
        orderBy: { createdAt: "asc" },
      }),

      // 6. Pending Payment (ALL items, sorted oldest → newest)
      prisma.electricalRequest.findMany({
        where: { status: STATUS_PAYMENT },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
          requestType: true,
          createdAt: true,
        },
        orderBy: { createdAt: "asc" },
      }),

      // 7. Pipeline counts (group by status, only major stages)
      prisma.electricalRequest.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
    ]);

    // ─── Build byType (same logic as before) ───
    const statusMap = new Map<string, { status: string; count: number }[]>();
    for (const row of typeStatusCounts) {
      const key = row.type_value;
      if (!statusMap.has(key)) statusMap.set(key, []);
      statusMap.get(key)!.push({
        status: row.status,
        count: Number(row.count),
      });
    }

    const countMap = new Map(
      typeCounts.map((row) => [row.type_value, Number(row.count)]),
    );

    const byType = REQUEST_TYPES.map((rt) => ({
      type: rt.value,
      label: rt.label,
      count: countMap.get(rt.value) ?? 0,
      statusCounts: statusMap.get(rt.value) ?? [],
    }));

    const knownValues = new Set(REQUEST_TYPES.map((rt) => rt.value));
    for (const [typeValue, count] of countMap) {
      if (!knownValues.has(typeValue)) {
        byType.push({
          type: typeValue,
          label: typeValue,
          count,
          statusCounts: statusMap.get(typeValue) ?? [],
        });
      }
    }

    // ─── Build overdue items with waitingDays ───
    const calcWaitingDays = (createdAt: Date) =>
      Math.floor(
        (now.getTime() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24),
      );

    const overdueReview = {
      count: overdueReviewItems.length,
      items: overdueReviewItems.map((item) => ({
        ...item,
        waitingDays: calcWaitingDays(item.createdAt),
      })),
    };

    const overdueInstall = {
      count: overdueInstallItems.length,
      items: overdueInstallItems.map((item) => ({
        ...item,
        waitingDays: calcWaitingDays(item.createdAt),
      })),
    };

    // ─── Build pending payment list ───
    const pendingPayment = {
      count: pendingPaymentItems.length,
      items: pendingPaymentItems.map((item) => ({
        ...item,
        waitingDays: calcWaitingDays(item.createdAt),
      })),
    };

    // ─── Build pipeline ───
    const pipelineMap = new Map(
      pipelineCounts.map((row) => [row.status, row._count._all]),
    );

    const pipeline = PIPELINE_STAGES.map((status) => ({
      status,
      count: pipelineMap.get(status) ?? 0,
    }));

    return Response.json({
      total,
      byType,
      overdueReview,
      overdueInstall,
      pendingPayment,
      pipeline,
    });
  } catch (error) {
    console.error("Failed to fetch dashboard summary", error);
    return Response.json(
      {
        success: false,
        message: "ไม่สามารถโหลดข้อมูล Dashboard ได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง",
        errorCode: "DASHBOARD_FETCH_FAILED",
      },
      { status: 500 },
    );
  }
}
