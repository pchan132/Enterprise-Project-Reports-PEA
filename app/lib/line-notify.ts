import type { ElectricalRequest } from "@/app/generated/prisma/client";

type LineNotifyRequest = Pick<
  ElectricalRequest,
  | "id"
  | "requestNo"
  | "requestType"
  | "meterOption"
  | "peaNo"
  | "caRefNo"
  | "firstName"
  | "lastName"
  | "subDistrict"
  | "district"
  | "phone"
  | "phone2"
  | "status"
  | "description"
  | "lat"
  | "long"
  | "requestDate"
  | "updatedAt"
  | "link"
>;

type LineNotifyMode = "new" | "update";

/**
 * Format a Date as a Thai-locale date string (e.g. "21 มิ.ย. 2569").
 * Falls back to ISO slice if formatting fails.
 */
function formatThaiDate(date: Date | string): string {
  try {
    const d = date instanceof Date ? date : new Date(date);
    return new Intl.DateTimeFormat("th-TH", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(d);
  } catch {
    return date instanceof Date ? date.toISOString().slice(0, 10) : String(date);
  }
}

/**
 * Build a human-readable LINE message from an electrical request record.
 */
function buildLineMessage(
  request: LineNotifyRequest,
  mode: LineNotifyMode,
): string {
  const ref = request.requestNo ?? request.id.slice(0, 8);
  const requestType = Array.isArray(request.requestType)
    ? request.requestType.join(", ")
    : String(request.requestType);

  const header =
    mode === "update"
      ? "🔄 อัพเดทข้อมูลคำร้อง"
      : "🔔 มีคำร้องใหม่เข้าสู่ระบบ";

  const lines: string[] = [
    header,
    `📅 วันที่: ${formatThaiDate(request.requestDate)}`,
    `📅 วันที่อัพเดท: ${formatThaiDate(request.updatedAt)}`,
    `📋 รหัส: ${ref}`,
    "",
    `🏷️ สถานะ: ${request.status}`,
    "",
    `👤 ผู้ขอ: ${request.firstName} ${request.lastName}`,
    `📞 เบอร์โทร: ${request.phone}`,
    `📍 พื้นที่: ต.${request.subDistrict} อ.${request.district}`,
    "",
  ];
  // Add meter, PEA No, CA Ref No, and Link
  if (request.phone2) {
    lines.push(`📞 เบอร์โทรสำรอง: ${request.phone2}`);
  }
  lines.push("");
  lines.push(`📝 ประเภท: ${requestType}`);
  if (request.meterOption) {
    lines.push(`🔌 ขนาดมิเตอร์: ${request.meterOption}`);
  }
  if (request.peaNo) {
    lines.push(`⚡ PEA No: ${request.peaNo}`);
  }
  if (request.caRefNo) {
    lines.push(`🔢 CA Ref No: ${request.caRefNo}`);
  }

  // Include Google Maps link only when coordinates are available
  if (request.lat != null && request.long != null) {
    lines.push(
      `🗺️ พิกัด: https://maps.google.com/?q=${request.lat},${request.long}`,
    );
  }

  // Include description if present
  if (request.description) {
    lines.push(`📝 รายละเอียด: ${request.description}`);
  }

  // Include document link if present
  if (request.link) {
    lines.push(`📎 ลิงก์เอกสาร: ${request.link}`);
  }

  lines.push(
    "⚡ กฟภ. ระบบจัดการคำร้องไฟฟ้า",
  );

  return lines.join("\n");
}

/**
 * Push a text message to a LINE group via the Messaging API.
 * Throws on failure so callers can handle errors appropriately.
 */
export async function sendLineNotification(
  request: LineNotifyRequest,
  mode: LineNotifyMode = "new",
): Promise<{ success: boolean; message: string }> {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  const groupId = process.env.LINE_GROUP_ID;

  if (!token || !groupId) {
    console.warn(
      "[LINE Notify] Missing LINE_CHANNEL_ACCESS_TOKEN or LINE_GROUP_ID environment variables",
    );
    return {
      success: false,
      message: "ไม่ได้ตั้งค่า LINE API กรุณาตรวจสอบ Environment Variables",
    };
  }

  const body = {
    to: groupId,
    messages: [
      {
        type: "text",
        text: buildLineMessage(request, mode),
      },
    ],
  };

  const response = await fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(
      `[LINE Notify] Push failed (${response.status}): ${errorBody}`,
    );
    return {
      success: false,
      message: `LINE API ตอบกลับด้วยสถานะ ${response.status}`,
    };
  }

  return { success: true, message: "ส่งแจ้งเตือน LINE สำเร็จ" };
}

/**
 * Fire-and-forget LINE notification.
 * Logs errors but never throws — safe to call in the POST/PUT handler
 * without blocking the HTTP response.
 */
export function sendLineNotificationAsync(
  request: LineNotifyRequest,
  mode: LineNotifyMode = "new",
): void {
  sendLineNotification(request, mode).catch((error) => {
    console.error("[LINE Notify] Async notification failed:", error);
  });
}

