"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import type {
  ApiErrorResponse,
  ElectricalRequestDto,
  ElectricalRequestResponse,
} from "@/app/lib/electrical-request-types";

type RequestDetailProps = {
  requestId: string;
};

type DetailItem = {
  label: string;
  value: string | number | boolean | null | undefined;
  wide?: boolean;
};

function formatThaiDate(value: string | null | undefined) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("th-TH", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00+07:00`));
}

function formatThaiDateTime(value: string | null | undefined) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("th-TH", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function displayValue(value: DetailItem["value"]) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  if (typeof value === "boolean") {
    return value ? "ใช่" : "ไม่ใช่";
  }

  return String(value);
}

function DetailGrid({ items }: { items: DetailItem[] }) {
  return (
    <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <div
          key={item.label}
          className={item.wide ? "sm:col-span-2 lg:col-span-3" : undefined}
        >
          <dt className="text-sm font-medium text-slate-500">{item.label}</dt>
          <dd className="mt-1 text-wrap text-base font-semibold text-slate-950">
            {displayValue(item.value)}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export default function RequestDetail({ requestId }: RequestDetailProps) {
  const [request, setRequest] = useState<ElectricalRequestDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadRequest() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(`/api/${encodeURIComponent(requestId)}`, {
          cache: "no-store",
        });
        const payload = (await response.json()) as ElectricalRequestResponse & ApiErrorResponse;

        if (!response.ok) {
          throw new Error(payload.error ?? "โหลดรายละเอียดคำร้องไม่สำเร็จ");
        }

        if (!ignore) {
          setRequest(payload.data);
        }
      } catch (err) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : "โหลดรายละเอียดคำร้องไม่สำเร็จ");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadRequest();

    return () => {
      ignore = true;
    };
  }, [requestId]);

  if (loading) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white px-6 py-10 text-center text-slate-600 shadow-sm">
        กำลังโหลดรายละเอียดคำร้อง...
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="rounded-lg border border-rose-200 bg-rose-50 px-6 py-5 text-rose-700">
        <p className="font-semibold">{error || "ไม่พบข้อมูลคำร้อง"}</p>
        <Link href="/requests" className="mt-3 inline-block text-sm font-semibold text-rose-800">
          กลับไปรายการคำร้อง
        </Link>
      </div>
    );
  }

  const fullName = `${request.firstName} ${request.lastName}`;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm sm:rounded-lg">
      <header className="border-b border-slate-200 px-3 py-4 sm:px-6 sm:py-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-medium text-teal-700">
              {request.requestNo ?? request.id}
            </p>
            <h1 className="mt-1 text-2xl font-bold text-slate-950 sm:text-3xl">
              {fullName}
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              รายละเอียดข้อมูลทั้งหมดของผู้ยื่นคำร้องที่เลือก
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/requests"
              className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:border-teal-600 hover:text-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500/40 sm:h-11 sm:px-4"
            >
              กลับรายการ
            </Link>
            <Link
              href={`/requests/${request.id}/edit`}
              className="inline-flex h-10 items-center justify-center rounded-lg bg-teal-700 px-3 text-sm font-semibold text-white transition hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-500/40 sm:h-11 sm:px-4"
            >
              แก้ไขข้อมูล
            </Link>
          </div>
        </div>
      </header>

      <div className="space-y-5 px-3 py-4 sm:space-y-7 sm:px-6 sm:py-5">
        <section className="space-y-4">
          <h2 className="text-base font-semibold text-slate-950">ข้อมูลผู้ใช้ไฟ</h2>
          <DetailGrid
            items={[
              { label: "เลขคำร้อง", value: request.requestNo ?? request.id },
              { label: "ชื่อ", value: request.firstName },
              { label: "นามสกุล", value: request.lastName },
              { label: "เบอร์โทรหลัก", value: request.phone },
              { label: "เบอร์โทรสำรอง", value: request.phone2 },
              { label: "สถานะ", value: request.status },
            ]}
          />
        </section>

        <section className="space-y-4 border-t border-slate-200 pt-5">
          <h2 className="text-base font-semibold text-slate-950">สถานที่ขอใช้ไฟ</h2>
          <DetailGrid
            items={[
              { label: "ที่อยู่", value: request.address, wide: true },
              { label: "ตำบล", value: request.subDistrict },
              { label: "อำเภอ", value: request.district },
              { label: "จังหวัด", value: request.province },
              { label: "ละติจูด", value: request.lat },
              { label: "ลองจิจูด", value: request.long },
            ]}
          />
        </section>

        <section className="space-y-4 border-t border-slate-200 pt-5">
          <h2 className="text-base font-semibold text-slate-950">รายละเอียดคำร้อง</h2>
          <DetailGrid
            items={[
              { label: "วันที่รับคำร้อง", value: formatThaiDate(request.requestDate) },
              { label: "ประเภทคำร้อง", value: Array.isArray(request.requestType) ? request.requestType.join(", ") : request.requestType },
              { label: "ขนาด/ตัวเลือกมิเตอร์", value: request.meterOption },
              { label: "หมายเลขผู้ใช้ไฟ", value: request.caRefNo },
              { label: "หมายเลขเครื่องวัด", value: request.peaNo },
              { label: "แก้ไขล่าสุด", value: formatThaiDateTime(request.updatedAt) },
              { label: "ติดตาม/ทวงคำร้องแล้ว", value: request.isFollowUp },
              { label: "รายละเอียดเพิ่มเติม", value: request.description, wide: true },
            ]}
          />
        </section>

        <section className="space-y-4 border-t border-slate-200 pt-5">
          <h2 className="text-base font-semibold text-slate-950">ข้อมูลระบบ</h2>
          <DetailGrid
            items={[
              { label: "ID", value: request.id },
              { label: "สร้างเมื่อ", value: formatThaiDateTime(request.createdAt) },
              { label: "แก้ไขล่าสุด", value: formatThaiDateTime(request.updatedAt) },
            ]}
          />
        </section>
      </div>
    </div>
  );
}
