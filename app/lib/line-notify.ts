import type { ElectricalRequest } from "@/app/generated/prisma/client";

type LineNotifyRequest = Pick<
  ElectricalRequest,
  | "id"
  | "requestNo"
  | "requestType"
  | "firstName"
  | "lastName"
  | "subDistrict"
  | "district"
  | "phone"
  | "status"
  | "description"
  | "lat"
  | "long"
  | "requestDate"
>;

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
function buildLineMessage(request: LineNotifyRequest): string {
  const ref = request.requestNo ?? request.id.slice(0, 8);
  const requestType = Array.isArray(request.requestType)
    ? request.requestType.join(", ")
    : String(request.requestType);

  const lines: string[] = [
    "🔔 มีคำร้องใหม่เข้าสู่ระบบ",
    `📅 วันที่: ${formatThaiDate(request.requestDate)}`,
    "━━━━━━━━━━━━━━━━━",
    `📋 รหัส: ${ref}`,
    `📝 ประเภท: ${requestType}`,
    `👤 ผู้ขอ: ${request.firstName} ${request.lastName}`,
    `📍 พื้นที่: ต.${request.subDistrict} อ.${request.district}`,
    `📞 เบอร์โทร: ${request.phone}`,
  ];

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

  lines.push(
    `🏷️ สถานะ: ${request.status}`,
    "━━━━━━━━━━━━━━━━━",
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
        text: buildLineMessage(request),
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
 * Logs errors but never throws — safe to call in the POST handler
 * without blocking the HTTP response.
 */
export function sendLineNotificationAsync(request: LineNotifyRequest): void {
  sendLineNotification(request).catch((error) => {
    console.error("[LINE Notify] Async notification failed:", error);
  });
}
