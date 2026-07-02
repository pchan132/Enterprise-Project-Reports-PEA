/**
 * LINE Webhook Endpoint
 * ---------------------
 * รับ POST request จาก LINE Platform และตอบกลับด้วย Reply Message
 * ใช้ Reply Token แทน Push Message เพื่อไม่ใช้โควต้า (ฟรี 100%)
 *
 * ฟีเจอร์:
 * - ตรวจสอบ x-line-signature ด้วย LINE_CHANNEL_SECRET (HMAC-SHA256)
 * - ตอบกลับ Flex Message เมนูเมื่อผู้ใช้พิมพ์ "เมนู" / "สรุปงาน"
 * - ดึงข้อมูล ElectricalRequest จาก DB ตามสถานะ (เฉพาะวันนี้)
 */

import { createHmac, timingSafeEqual } from "crypto";
import { prisma } from "@/app/lib/prisma";
import type { NextRequest } from "next/server";

export const runtime = "nodejs";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface LineTextMessage {
  type: "text";
  text: string;
}

interface LineWebhookEvent {
  type: string;
  replyToken?: string;
  message?: LineTextMessage;
}

interface LineWebhookBody {
  events: LineWebhookEvent[];
}

interface LineQuickReplyItem {
  type: "action";
  imageUrl?: string;
  action: {
    type: "message";
    label: string;
    text: string;
  };
}

interface LineQuickReply {
  items: LineQuickReplyItem[];
}

type LineMessage =
  | { type: "text"; text: string; quickReply?: LineQuickReply }
  | {
      type: "flex";
      altText: string;
      contents: Record<string, unknown>;
      quickReply?: LineQuickReply;
    };

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const LINE_REPLY_URL = "https://api.line.me/v2/bot/message/reply";

const MENU_TRIGGER_KEYWORDS = ["เมนู", "สรุปงาน"];

/** Prefix สำหรับ intent การดูข้อมูลตามสถานะ */
const DATA_QUERY_PREFIX = "ดูข้อมูล: ";

/** สถานะที่รองรับ (ตรงกับค่าในฐานข้อมูล) */
const SUPPORTED_STATUSES = ["รอตรวจสอบ", "รอชำระเงิน", "รอติดตั้ง"] as const;
type SupportedStatus = (typeof SUPPORTED_STATUSES)[number];

/** จำนวนรายการสูงสุดที่แสดงใน Reply เพื่อไม่ให้ข้อความยาวเกินไป */
const MAX_DISPLAY_ITEMS = 5;

/** Quick Reply items ที่แนบท้ายทุกข้อความตอบกลับ */
const QUICK_REPLY_ITEMS: LineQuickReply = {
  items: [
    {
      type: "action",
      action: { type: "message", label: "📋 เมนู", text: "เมนู" },
    },
    {
      type: "action",
      action: { type: "message", label: "🔍 รอตรวจสอบ", text: "ดูข้อมูล: รอตรวจสอบ" },
    },
    {
      type: "action",
      action: { type: "message", label: "💰 รอชำระเงิน", text: "ดูข้อมูล: รอชำระเงิน" },
    },
    {
      type: "action",
      action: { type: "message", label: "🔧 รอติดตั้ง", text: "ดูข้อมูล: รอติดตั้ง" },
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Signature verification
// ─────────────────────────────────────────────────────────────────────────────

/**
 * ตรวจสอบ HMAC-SHA256 signature ที่ LINE แนบมาใน header `x-line-signature`
 * ป้องกัน request ปลอมจากภายนอก
 */
function verifyLineSignature(
  body: string,
  signature: string,
  secret: string
): boolean {
  try {
    const expected = createHmac("sha256", secret)
      .update(body, "utf8")
      .digest("base64");

    // timingSafeEqual ป้องกัน timing attack
    const expectedBuf = Buffer.from(expected, "utf8");
    const signatureBuf = Buffer.from(signature, "utf8");

    if (expectedBuf.length !== signatureBuf.length) return false;
    return timingSafeEqual(expectedBuf, signatureBuf);
  } catch {
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// LINE Reply API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * ส่ง Reply Message กลับไปยัง LINE ผ่าน replyToken
 * ไม่นับโควต้า Push Message — ฟรี 100%
 */
async function replyToLine(
  replyToken: string,
  messages: LineMessage[]
): Promise<void> {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token) {
    console.warn("[LINE Webhook] LINE_CHANNEL_ACCESS_TOKEN is not set");
    return;
  }

  // แนบ Quick Reply buttons ไว้ที่ข้อความสุดท้ายของ Reply เสมอ
  // LINE API อนุญาตให้ quickReply อยู่ที่ message สุดท้ายเท่านั้น
  const messagesWithQuickReply = messages.map((msg, index) => {
    if (index === messages.length - 1) {
      return { ...msg, quickReply: msg.quickReply ?? QUICK_REPLY_ITEMS };
    }
    return msg;
  });

  const response = await fetch(LINE_REPLY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ replyToken, messages: messagesWithQuickReply }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(
      `[LINE Webhook] Reply failed (${response.status}): ${errorText}`
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Message Builders
// ─────────────────────────────────────────────────────────────────────────────

/**
 * สร้าง Flex Message รูปแบบ Bubble + Button
 * แต่ละปุ่มเมื่อกดจะส่งข้อความ "ดูข้อมูล: <สถานะ>" กลับมา
 */
function buildMenuFlexMessage(): LineMessage {
  const buttonColors = ["#f59e0b", "#3b82f6", "#10b981"];
  const buttonEmojis = ["🔍", "💰", "🔧"];

  return {
    type: "flex",
    altText: "📋 เมนูสรุปงานคำร้องไฟฟ้า",
    contents: {
      type: "bubble",
      size: "kilo",
      header: {
        type: "box",
        layout: "vertical",
        backgroundColor: "#1a56db",
        paddingAll: "16px",
        contents: [
          {
            type: "text",
            text: "⚡ ระบบคำร้องไฟฟ้า PEA",
            color: "#ffffff",
            size: "md",
            weight: "bold",
          },
          {
            type: "text",
            text: "เลือกสถานะที่ต้องการดูข้อมูลวันนี้",
            color: "#dbeafe",
            size: "sm",
            margin: "sm",
          },
        ],
      },
      body: {
        type: "box",
        layout: "vertical",
        spacing: "sm",
        paddingAll: "12px",
        contents: SUPPORTED_STATUSES.map((status, index) => ({
          type: "button",
          action: {
            type: "message",
            label: `${buttonEmojis[index]} ${status}`,
            text: `${DATA_QUERY_PREFIX}${status}`,
          },
          style: "primary",
          color: buttonColors[index],
          margin: index === 0 ? "none" : "sm",
          height: "sm",
        })),
      },
      footer: {
        type: "box",
        layout: "vertical",
        paddingAll: "8px",
        contents: [
          {
            type: "text",
            text: "กฟภ. ระบบจัดการคำร้องไฟฟ้า",
            color: "#9ca3af",
            size: "xs",
            align: "center",
          },
        ],
      },
    },
  };
}

/**
 * ฟอร์แมตวันที่เป็นภาษาไทย (เช่น "2 ก.ค. 2569")
 */
function formatThaiDate(date: Date): string {
  try {
    return new Intl.DateTimeFormat("th-TH", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(date);
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

/**
 * ดึงข้อมูล ElectricalRequest จาก DB ตามสถานะและ updatedAt ของวันนี้
 * จากนั้นสร้างข้อความ Reply ที่อ่านง่ายพร้อมแสดงรายการสูงสุด 5 รายการ
 */
async function buildStatusReplyMessage(
  status: SupportedStatus
): Promise<LineMessage> {
  // กำหนดช่วงเวลา "วันนี้" ตามเขตเวลา Asia/Bangkok (UTC+7)
  const nowBangkok = new Date(Date.now() + 7 * 60 * 60 * 1000);
  const todayStr = nowBangkok.toISOString().slice(0, 10); // "YYYY-MM-DD"

  const todayStart = new Date(`${todayStr}T00:00:00+07:00`);
  const todayEnd = new Date(`${todayStr}T23:59:59.999+07:00`);

  const requests = await prisma.electricalRequest.findMany({
    where: {
      status,
      updatedAt: {
        gte: todayStart,
        lte: todayEnd,
      },
    },
    orderBy: { updatedAt: "desc" },
    select: {
      requestNo: true,
      firstName: true,
      lastName: true,
      subDistrict: true,
      district: true,
      updatedAt: true,
    },
  });

  const total = requests.length;

  // ─── ไม่มีข้อมูล ───
  if (total === 0) {
    return {
      type: "text",
      text: `✅ วันนี้ไม่มีคำร้องในสถานะ "${status}" ครับ`,
    };
  }

  // ─── มีข้อมูล → สร้างข้อความสรุป ───
  const displayItems = requests.slice(0, MAX_DISPLAY_ITEMS);
  const todayFormatted = formatThaiDate(nowBangkok);
  const divider = "─".repeat(28);

  const lines: string[] = [
    `📋 สรุปคำร้อง: ${status}`,
    `📅 วันที่: ${todayFormatted}`,
    `🔢 จำนวนทั้งหมด: ${total} รายการ`,
    divider,
  ];

  displayItems.forEach((req, index) => {
    const ref = req.requestNo ?? "ไม่มีรหัส";
    const name = `${req.firstName} ${req.lastName}`;
    const area = `ต.${req.subDistrict} อ.${req.district}`;
    lines.push(`${index + 1}. [${ref}]`);
    lines.push(`   👤 ${name}`);
    lines.push(`   📍 ${area}`);
  });

  if (total > MAX_DISPLAY_ITEMS) {
    lines.push(divider);
    lines.push(`... และอีก ${total - MAX_DISPLAY_ITEMS} รายการ`);
  }

  lines.push(divider);
  lines.push("⚡ กฟภ. ระบบจัดการคำร้องไฟฟ้า");

  return {
    type: "text",
    text: lines.join("\n"),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// POST Handler (Webhook Entry Point)
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest): Promise<Response> {
  // ── อ่าน raw body ก่อน เพื่อใช้ verify signature ──
  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    console.error("[LINE Webhook] Failed to read request body");
    // ตอบ 200 เสมอ เพื่อป้องกัน LINE Webhook Retry
    return new Response("OK", { status: 200 });
  }

  // ── ตรวจสอบ x-line-signature ──
  const channelSecret = process.env.LINE_CHANNEL_SECRET;
  const signature = request.headers.get("x-line-signature") ?? "";

  if (!channelSecret) {
    // หากยังไม่ได้ตั้งค่า secret ให้เตือนใน log แต่ยังทำงานต่อ
    console.warn(
      "[LINE Webhook] LINE_CHANNEL_SECRET is not set — skipping signature verification"
    );
  } else if (!signature || !verifyLineSignature(rawBody, signature, channelSecret)) {
    console.warn("[LINE Webhook] Invalid x-line-signature — request rejected");
    return new Response("Unauthorized", { status: 401 });
  }

  // ── Parse JSON ──
  let body: LineWebhookBody;
  try {
    body = JSON.parse(rawBody) as LineWebhookBody;
  } catch {
    console.error("[LINE Webhook] Invalid JSON payload");
    return new Response("OK", { status: 200 });
  }

  // ── ประมวลผลแต่ละ Event แบบ Parallel ──
  const eventPromises = body.events
    .filter(
      (
        event
      ): event is LineWebhookEvent & {
        replyToken: string;
        message: LineTextMessage;
      } =>
        event.type === "message" &&
        event.message?.type === "text" &&
        typeof event.replyToken === "string" &&
        event.replyToken.length > 0
    )
    .map(async (event) => {
      const { replyToken, message } = event;
      const text = message.text.trim();

      try {
        // ── ส่วนที่ 1: เมนูโต้ตอบ ──
        if (MENU_TRIGGER_KEYWORDS.includes(text)) {
          await replyToLine(replyToken, [buildMenuFlexMessage()]);
          return;
        }

        // ── ส่วนที่ 2: ดึงข้อมูลตามสถานะ ──
        if (text.startsWith(DATA_QUERY_PREFIX)) {
          const statusQuery = text.slice(DATA_QUERY_PREFIX.length).trim();

          // ตรวจสอบว่าเป็นสถานะที่รองรับ (ป้องกัน injection)
          const isValidStatus = (SUPPORTED_STATUSES as readonly string[]).includes(statusQuery);
          if (!isValidStatus) {
            await replyToLine(replyToken, [
              {
                type: "text",
                text: `⚠️ ไม่พบสถานะ "${statusQuery}" ในระบบ\nสถานะที่รองรับ: ${SUPPORTED_STATUSES.join(", ")}`,
              },
            ]);
            return;
          }

          const replyMessage = await buildStatusReplyMessage(
            statusQuery as SupportedStatus
          );
          await replyToLine(replyToken, [replyMessage]);
          return;
        }

        // ── ข้อความอื่นๆ: แนะนำให้ใช้เมนู ──
        await replyToLine(replyToken, [
          {
            type: "text",
            text: `พิมพ์ "เมนู" หรือ "สรุปงาน" เพื่อดูข้อมูลคำร้องไฟฟ้าประจำวัน ⚡`,
          },
        ]);
      } catch (eventError) {
        console.error("[LINE Webhook] Error processing event:", eventError);
        // พยายาม reply error message กลับผู้ใช้
        try {
          await replyToLine(replyToken, [
            {
              type: "text",
              text: "⚠️ เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่อีกครั้งครับ",
            },
          ]);
        } catch {
          // ไม่ throw — error ใน reply ไม่ควร crash handler
        }
      }
    });

  // รอทุก event เสร็จสิ้น (allSettled ไม่ reject แม้บาง event พัง)
  await Promise.allSettled(eventPromises);

  // ตอบ 200 OK ให้ LINE เสมอ เพื่อป้องกัน Webhook Retry
  return new Response("OK", { status: 200 });
}
