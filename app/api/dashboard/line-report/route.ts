import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import type { Prisma } from "@/app/generated/prisma/client";

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

// Function to push a payload to LINE
async function pushToLine(messages: { type: string; text: string }[], token: string, groupId: string) {
  const body = {
    to: groupId,
    messages: messages,
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
    const errText = await response.text();
    console.error(`[LINE Notify] Push failed (${response.status}): ${errText}`);
    throw new Error(`LINE API responded with ${response.status}`);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { status, startDate, endDate } = body;

    if (!status) {
      return NextResponse.json(
        { success: false, message: "กรุณาระบุสถานะคำร้อง", errorCode: "MISSING_STATUS" },
        { status: 400 }
      );
    }

    const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    const groupId = process.env.LINE_GROUP_ID;

    if (!token || !groupId) {
      return NextResponse.json(
        { success: false, message: "ไม่ได้ตั้งค่า LINE API กรุณาตรวจสอบ Environment Variables", errorCode: "MISSING_LINE_ENV" },
        { status: 500 }
      );
    }

    // Build query
    const whereClause: Prisma.ElectricalRequestWhereInput = {
      status: status,
    };

    if (startDate || endDate) {
      whereClause.requestDate = {};
      if (startDate) {
        whereClause.requestDate.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        // Add 1 day to include the whole end date
        end.setDate(end.getDate() + 1);
        whereClause.requestDate.lt = end;
      }
    }

    const requests = await prisma.electricalRequest.findMany({
      where: whereClause,
      orderBy: { requestDate: "asc" },
    });

    if (requests.length === 0) {
      return NextResponse.json(
        { success: false, message: "ไม่พบข้อมูลคำร้องในเงื่อนไขที่ระบุ", errorCode: "NO_DATA" },
        { status: 404 }
      );
    }

    // 1. Prepare formatted texts for each request
    const requestTexts: string[] = [];
    
    for (const request of requests) {
      const ref = request.requestNo ?? request.id.slice(0, 8);
      const requestType = Array.isArray(request.requestType)
        ? request.requestType.join(", ")
        : String(request.requestType);

      const lines: string[] = [
        `📅 วันที่เขียนคำร้อง: ${formatThaiDate(request.requestDate)}`,
        `📅 วันที่อัพเดท: ${formatThaiDate(request.updatedAt)}`,
        `📋 รหัส: ${ref}`,
        "",
        `🏷️ สถานะ: ${request.status}`,
        "",
        `👤 ผู้ขอ: ${request.firstName} ${request.lastName}`,
        `📍 พื้นที่: ต.${request.subDistrict} อ.${request.district}`,
        `📞 เบอร์โทร: ${request.phone}`,
      ];

      if (request.phone2) {
        lines.push(`📞 เบอร์โทรสำรอง: ${request.phone2}`);
      }
      
      lines.push("");
      lines.push(`📝 ประเภท: ${requestType}`);
      lines.push("");

      if (request.meterOption) {
        lines.push(`🔌 ขนาดมิเตอร์: ${request.meterOption}`);
      }
      if (request.peaNo) {
        lines.push(`⚡ PEA No: ${request.peaNo}`);
      }
      if (request.caRefNo) {
        lines.push(`🔢 CA Ref No: ${request.caRefNo}`);
      }
      if (request.lat != null && request.long != null) {
        lines.push(`🗺️ พิกัด: https://maps.google.com/?q=${request.lat},${request.long}`);
      }
      if (request.description) {
        lines.push(`📝 รายละเอียด: ${request.description}`);
      }
      if (request.link) {
        lines.push(`📎 ลิงก์เอกสาร: ${request.link}`);
      }
      
      lines.push("----------------------");
      requestTexts.push(lines.join("\n"));
    }

    // 2. Prepare Header
    const todayStr = formatThaiDate(new Date());
    const headerText = [
      `📊 สรุปคำร้องสถานะ: ${status}`,
      `📅 ประจำวันที่: ${todayStr}`,
      `🗂️ ทั้งหมด: ${requests.length} ราย`,
      `=============`,
    ].join("\n");

    // 3. String Splitting & Array Chunking (Max 4500 chars per bubble, Max 5 bubbles per request)
    const MAX_CHARS_PER_BUBBLE = 4500;
    const MAX_BUBBLES_PER_REQUEST = 5;

    // First bubble starts with header
    const bubbles: { type: string; text: string }[] = [];
    let currentBubbleText = headerText + "\n";

    for (const reqText of requestTexts) {
      // Check if adding this text exceeds max chars
      // We add 1 for the potential newline if we join
      if (currentBubbleText.length + reqText.length + 1 > MAX_CHARS_PER_BUBBLE) {
        // Push current bubble and start a new one
        bubbles.push({ type: "text", text: currentBubbleText.trimEnd() });
        currentBubbleText = reqText + "\n";
      } else {
        // Safe to append
        currentBubbleText += reqText + "\n";
      }
    }
    
    // Push the last remaining bubble
    if (currentBubbleText.trim().length > 0) {
      bubbles.push({ type: "text", text: currentBubbleText.trimEnd() });
    }

    // Chunk bubbles into groups of 5
    const chunkedRequests: { type: string; text: string }[][] = [];
    for (let i = 0; i < bubbles.length; i += MAX_BUBBLES_PER_REQUEST) {
      chunkedRequests.push(bubbles.slice(i, i + MAX_BUBBLES_PER_REQUEST));
    }

    // 4. Send Multi-Request
    for (const messagesChunk of chunkedRequests) {
      await pushToLine(messagesChunk, token, groupId);
    }

    return NextResponse.json({
      success: true,
      message: `ส่งรายงานคำร้องจำนวน ${requests.length} รายการ เรียบร้อยแล้ว`,
    });

  } catch (error) {
    console.error("[LINE Report API] Error:", error);
    return NextResponse.json(
      { success: false, message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์", errorCode: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
