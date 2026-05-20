import { prisma } from "@/app/lib/prisma";
import { REQUEST_TYPES } from "@/app/lib/data/request-types";

export const runtime = "nodejs";

/**
 * GET /api/dashboard
 *
 * ส่งข้อมูลจำนวนคำร้อง แยกตามประเภท (requestType)
 * เนื่องจาก requestType เป็น string[] (PostgreSQL array) จึงใช้ unnest
 * เพื่อนับจำนวนคำร้องที่มีแต่ละประเภทอย่างถูกต้อง
 *
 * Response shape:
 * {
 *   total: number,
 *   byType: { type: string, label: string, count: number }[]
 * }
 */
export async function GET() {
  try {
    // นับจำนวนรวมทั้งหมด
    const total = await prisma.electricalRequest.count();

    // นับจำนวนตาม requestType โดย unnest array
    const typeCounts = await prisma.$queryRaw<
      { type_value: string; count: bigint }[]
    >`
      SELECT t.type_value, COUNT(*) AS count
      FROM electrical_requests,
           LATERAL unnest(request_type) AS t(type_value)
      GROUP BY t.type_value
      ORDER BY count DESC
    `;

    // สร้าง Map เพื่อ lookup จำนวนที่ได้จาก DB
    const countMap = new Map(
      typeCounts.map((row) => [row.type_value, Number(row.count)]),
    );

    // รวมกับรายการประเภทที่กำหนดไว้ เพื่อให้แสดงทุกประเภท (แม้จำนวนเป็น 0)
    const byType = REQUEST_TYPES.map((rt) => ({
      type: rt.value,
      label: rt.label,
      count: countMap.get(rt.value) ?? 0,
    }));

    // เพิ่มประเภทที่อยู่ใน DB แต่ไม่มีใน REQUEST_TYPES (กรณีข้อมูลเก่า)
    const knownValues = new Set(REQUEST_TYPES.map((rt) => rt.value));
    for (const [typeValue, count] of countMap) {
      if (!knownValues.has(typeValue)) {
        byType.push({ type: typeValue, label: typeValue, count });
      }
    }

    return Response.json({ total, byType });
  } catch (error) {
    console.error("Failed to fetch dashboard summary", error);
    return Response.json(
      { error: "Failed to fetch dashboard summary" },
      { status: 500 },
    );
  }
}
