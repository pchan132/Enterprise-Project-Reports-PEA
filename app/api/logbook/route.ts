import { prisma } from "@/app/lib/prisma";
import { serializeElectricalRequest } from "@/app/lib/electrical-requests-api";
import type { NextRequest } from "next/server";

export const runtime = "nodejs";

/**
 * GET /api/logbook?date=YYYY-MM-DD
 *
 * ดึงคำร้องทั้งหมดที่ถูกสร้างในวันที่ระบุ (createdAt)
 * พร้อมสรุปสถิติ: total, completed, attentionNeeded
 *
 * Response shape:
 * {
 *   summary: { total, completed, attentionNeeded },
 *   requests: ElectricalRequestDto[]
 * }
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const dateParam = searchParams.get("date")?.trim();

  // Default to today (UTC) if no date is provided
  const dateStr = dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)
    ? dateParam
    : new Date().toISOString().slice(0, 10);

  const dayStart = new Date(`${dateStr}T00:00:00.000Z`);
  const dayEnd = new Date(`${dateStr}T23:59:59.999Z`);

  try {
    const requests = await prisma.electricalRequest.findMany({
      where: {
        createdAt: {
          gte: dayStart,
          lte: dayEnd,
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    const total = requests.length;

    const completed = requests.filter(
      (r) =>
        r.status === "เสร็จสิ้น" ||
        r.status === "รอติดตั้งมิเตอร์ / ดำเนินการเพิ่ม / ย้าย" ||
        r.status === "กำลังดำเนินการ หน้างาน",
    ).length;

    const attentionNeeded = requests.filter((r) =>
      r.requestType.includes("คำร้องอื่นๆ"),
    ).length;

    return Response.json({
      summary: {
        total,
        completed,
        attentionNeeded,
      },
      requests: requests.map(serializeElectricalRequest),
    });
  } catch (error) {
    console.error("Failed to fetch logbook data", error);
    return Response.json(
      { error: "Failed to fetch logbook data" },
      { status: 500 },
    );
  }
}
