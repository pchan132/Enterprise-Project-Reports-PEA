"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import WMSF01PrintForm from "@/app/components/wmsf01-print-form";

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
  href?: string;
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
            {item.href ? (
              <a
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-teal-700 underline underline-offset-2 transition hover:text-teal-900"
              >
                <span className="break-all">{displayValue(item.value)}</span>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0">
                  <path fillRule="evenodd" d="M4.25 5.5a.75.75 0 0 0-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 0 0 .75-.75v-4a.75.75 0 0 1 1.5 0v4A2.25 2.25 0 0 1 12.75 17h-8.5A2.25 2.25 0 0 1 2 14.75v-8.5A2.25 2.25 0 0 1 4.25 4h5a.75.75 0 0 1 0 1.5h-5Zm7.25-.75a.75.75 0 0 1 .75-.75h3.5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0V6.31l-5.47 5.47a.75.75 0 1 1-1.06-1.06l5.47-5.47H12.25a.75.75 0 0 1-.75-.75Z" clipRule="evenodd" />
                </svg>
              </a>
            ) : (
              displayValue(item.value)
            )}
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
  const [showPrintForm, setShowPrintForm] = useState(false);

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
            <button
              type="button"
              onClick={() => setShowPrintForm(true)}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 text-sm font-semibold text-amber-800 transition hover:border-amber-500 hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-400/40 sm:h-11 sm:px-4"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path fillRule="evenodd" d="M5 2.75C5 1.784 5.784 1 6.75 1h6.5c.966 0 1.75.784 1.75 1.75v3.552c.377.046.752.097 1.126.153A2.212 2.212 0 0 1 18 8.653v4.097A2.25 2.25 0 0 1 15.75 15h-.75v.75c0 .966-.784 1.75-1.75 1.75h-6.5A1.75 1.75 0 0 1 5 15.75V15h-.75A2.25 2.25 0 0 1 2 12.75V8.653c0-1.082.775-2.034 1.874-2.198.374-.056.75-.107 1.126-.153V2.75ZM6.5 15v.75c0 .138.112.25.25.25h6.5a.25.25 0 0 0 .25-.25V15h-7Zm7-11.25v3.372a40.739 40.739 0 0 0-7 0V3.75h-.002V2.75a.25.25 0 0 1 .25-.25h6.5a.25.25 0 0 1 .25.25v1Zm.497 6a.75.75 0 0 1 .75-.75h.5a.75.75 0 0 1 0 1.5h-.5a.75.75 0 0 1-.75-.75Z" clipRule="evenodd" />
              </svg>
              พิมพ์ฟอร์ม WMSF01
            </button>
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
              { label: "วันที่จัดคิว", value: formatThaiDate(request.targetDate) },
              { label: "แก้ไขล่าสุด", value: formatThaiDateTime(request.updatedAt) },
              { label: "ติดตาม/ทวงคำร้องแล้ว", value: request.isFollowUp },
              { label: "ลิงก์เอกสาร", value: request.link, href: request.link ?? undefined, wide: true },
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

      {/* ── WMSF01 Print Form Modal ── */}
      {showPrintForm && (
        <WMSF01PrintForm
          request={request}
          onClose={() => setShowPrintForm(false)}
        />
      )}
    </div>
  );
}
