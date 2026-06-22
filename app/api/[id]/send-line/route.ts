import { sendLineNotification } from "@/app/lib/line-notify";
import { prisma } from "@/app/lib/prisma";
import { requireApiAuth } from "@/app/lib/api-auth";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/app/lib/rate-limiter";

export const runtime = "nodejs";

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: Request, { params }: RouteParams) {
  // 🛡️ Auth guard (defense-in-depth)
  const auth = await requireApiAuth();
  if (!auth.authenticated) return auth.response;

  // 🛡️ Rate limiting for write operations
  const clientIp = getClientIp(request);
  const rateCheck = checkRateLimit("apiWrite", clientIp);
  if (!rateCheck.allowed) return rateLimitResponse(rateCheck.retryAfterSeconds!);

  const { id } = await params;

  try {
    // Look up by UUID or requestNo
    const electricalRequest = await prisma.electricalRequest.findFirst({
      where: {
        OR: [{ id }, { requestNo: id }],
      },
    });

    if (!electricalRequest) {
      return Response.json(
        {
          success: false,
          message: "ไม่พบข้อมูลคำร้องที่ระบุ",
          errorCode: "NOT_FOUND",
        },
        { status: 404 },
      );
    }

    const result = await sendLineNotification(electricalRequest);

    if (!result.success) {
      return Response.json(
        {
          success: false,
          message: result.message,
          errorCode: "LINE_API_ERROR",
        },
        { status: 502 },
      );
    }

    return Response.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error("[send-line] Failed to send LINE notification:", error);
    return Response.json(
      {
        success: false,
        message: "ไม่สามารถส่งแจ้งเตือน LINE ได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง",
        errorCode: "INTERNAL_ERROR",
      },
      { status: 500 },
    );
  }
}
