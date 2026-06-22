import { Prisma } from "@/app/generated/prisma/client";
import {
  isRequestBody,
  parseUpdateElectricalRequest,
  serializeElectricalRequest,
} from "@/app/lib/electrical-requests-api";
import { sendLineNotificationAsync } from "@/app/lib/line-notify";
import { prisma } from "@/app/lib/prisma";
import { requireApiAuth } from "@/app/lib/api-auth";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/app/lib/rate-limiter";
import type { NextRequest } from "next/server";

export const runtime = "nodejs";

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, { params }: RouteParams) {
  // 🛡️ Auth guard (defense-in-depth)
  const auth = await requireApiAuth();
  if (!auth.authenticated) return auth.response;

  const { id } = await params;

  try {
    const electricalRequest = await findRequestByIdOrRequestNo(id);

    if (!electricalRequest) {
      return Response.json(
        { error: "Electrical request not found" },
        { status: 404 },
      );
    }

    return Response.json({
      data: serializeElectricalRequest(electricalRequest),
    });
  } catch (error) {
    console.error("Failed to fetch electrical request", error);
    return Response.json(
      { error: "Failed to fetch electrical request" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  // 🛡️ Auth guard (defense-in-depth)
  const auth = await requireApiAuth();
  if (!auth.authenticated) return auth.response;

  // 🛡️ Rate limiting for write operations
  const clientIp = getClientIp(request);
  const rateCheck = checkRateLimit("apiWrite", clientIp);
  if (!rateCheck.allowed) return rateLimitResponse(rateCheck.retryAfterSeconds!);

  const { id } = await params;
  const { searchParams } = request.nextUrl;
  const notifyLine = searchParams.get("notifyLine") !== "false";

  const bodyResult = await readJsonBody(request);

  if (bodyResult instanceof Response) {
    return bodyResult;
  }

  const result = parseUpdateElectricalRequest(bodyResult);

  if (result.errors) {
    return Response.json({ errors: result.errors }, { status: 400 });
  }

  try {
    const existingRequest = await findRequestByIdOrRequestNo(id);

    if (!existingRequest) {
      return Response.json(
        { error: "Electrical request not found" },
        { status: 404 },
      );
    }

    const updated = await prisma.electricalRequest.update({
      where: {
        id: existingRequest.id,
      },
      data: result.data,
    });

    // Fire-and-forget LINE push notification (update mode, if opted in)
    if (notifyLine) {
      sendLineNotificationAsync(updated, "update");
    }

    return Response.json({
      data: serializeElectricalRequest(updated),
    });
  } catch (error) {
    if (isPrismaError(error, "P2002")) {
      return Response.json(
        { error: "requestNo already exists" },
        { status: 409 },
      );
    }

    console.error("Failed to update electrical request", error);
    return Response.json(
      { error: "Failed to update electrical request" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  // 🛡️ Auth guard (defense-in-depth)
  const auth = await requireApiAuth();
  if (!auth.authenticated) return auth.response;

  // 🛡️ Rate limiting for write operations
  const clientIp = getClientIp(request);
  const rateCheck = checkRateLimit("apiWrite", clientIp);
  if (!rateCheck.allowed) return rateLimitResponse(rateCheck.retryAfterSeconds!);

  const { id } = await params;

  try {
    const existingRequest = await findRequestByIdOrRequestNo(id);

    if (!existingRequest) {
      return Response.json(
        { error: "Electrical request not found" },
        { status: 404 },
      );
    }

    const deleted = await prisma.electricalRequest.delete({
      where: {
        id: existingRequest.id,
      },
    });

    return Response.json({
      data: serializeElectricalRequest(deleted),
    });
  } catch (error) {
    console.error("Failed to delete electrical request", error);
    return Response.json(
      { error: "Failed to delete electrical request" },
      { status: 500 },
    );
  }
}

function findRequestByIdOrRequestNo(id: string) {
  return prisma.electricalRequest.findFirst({
    where: {
      OR: [
        {
          id,
        },
        {
          requestNo: id,
        },
      ],
    },
  });
}

async function readJsonBody(request: Request) {
  try {
    const body = await request.json();

    if (!isRequestBody(body)) {
      return Response.json(
        { error: "Request body must be a JSON object" },
        { status: 400 },
      );
    }

    return body;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }
}

function isPrismaError(error: unknown, code: string) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === code
  );
}
