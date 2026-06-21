import { Prisma } from "@/app/generated/prisma/client";
import {
  isRequestBody,
  parseCreateElectricalRequest,
  parsePagination,
  serializeElectricalRequest,
} from "@/app/lib/electrical-requests-api";
import {
  buildElectricalRequestBaseWhere,
  parseSearchKeyword,
  searchElectricalRequests,
} from "@/app/lib/electrical-request-search";
import { sendLineNotificationAsync } from "@/app/lib/line-notify";
import { prisma } from "@/app/lib/prisma";
import type { NextRequest } from "next/server";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const { page, pageSize, skip } = parsePagination(searchParams);
  const where = buildElectricalRequestBaseWhere(searchParams);
  const keyword = parseSearchKeyword(searchParams);

  // Sort direction: default DESC (ใหม่สุดก่อน)
  const sortOrderParam = searchParams.get("sortOrder")?.toLowerCase();
  const sortOrder: "asc" | "desc" =
    sortOrderParam === "asc" ? "asc" : "desc";
  const orderBy = [{ requestDate: sortOrder }, { createdAt: sortOrder }];

  try {
    if (keyword) {
      const candidates = await prisma.electricalRequest.findMany({
        where,
        orderBy,
      });
      const matchedRequests = searchElectricalRequests(candidates, keyword);
      const requests = matchedRequests.slice(skip, skip + pageSize);

      return Response.json({
        data: requests.map(serializeElectricalRequest),
        meta: {
          page,
          pageSize,
          total: matchedRequests.length,
          totalPages: Math.max(1, Math.ceil(matchedRequests.length / pageSize)),
        },
      });
    }

    const [requests, total] = await prisma.$transaction([
      prisma.electricalRequest.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
      }),
      prisma.electricalRequest.count({ where }),
    ]);

    return Response.json({
      data: requests.map(serializeElectricalRequest),
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
    });
  } catch (error) {
    console.error("Failed to fetch electrical requests", error);
    return Response.json(
      { error: "Failed to fetch electrical requests" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const bodyResult = await readJsonBody(request);

  if (bodyResult instanceof Response) {
    return bodyResult;
  }

  const result = parseCreateElectricalRequest(bodyResult);

  if (result.errors) {
    return Response.json({ errors: result.errors }, { status: 400 });
  }

  try {
    const data = {
      ...result.data,
      requestNo:
        result.data.requestNo ?? (await generateRequestNo(result.data.requestDate)),
    };

    const created = await prisma.electricalRequest.create({ data });

    // Fire-and-forget LINE push notification
    sendLineNotificationAsync(created);

    return Response.json(
      { data: serializeElectricalRequest(created) },
      { status: 201 },
    );
  } catch (error) {
    if (isPrismaError(error, "P2002")) {
      return Response.json(
        { error: "requestNo already exists" },
        { status: 409 },
      );
    }

    console.error("Failed to create electrical request", error);
    return Response.json(
      { error: "Failed to create electrical request" },
      { status: 500 },
    );
  }
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

async function generateRequestNo(requestDate: Date | string) {
  const date = requestDate instanceof Date ? requestDate : new Date(requestDate);
  const year = String(date.getUTCFullYear()).slice(-2);
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const prefix = `REQ-${year}${month}${day}-`;

  const latest = await prisma.electricalRequest.findFirst({
    where: {
      requestNo: {
        startsWith: prefix,
      },
    },
    orderBy: {
      requestNo: "desc",
    },
    select: {
      requestNo: true,
    },
  });

  const latestSequence = latest?.requestNo
    ? Number(latest.requestNo.slice(prefix.length))
    : 0;
  const nextSequence = Number.isFinite(latestSequence) ? latestSequence + 1 : 1;

  return `${prefix}${String(nextSequence).padStart(3, "0")}`;
}

function isPrismaError(error: unknown, code: string) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === code
  );
}
