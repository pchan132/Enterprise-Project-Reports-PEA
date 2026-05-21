"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type StatusCount = {
  status: string;
  count: number;
};

type RequestTypeSummary = {
  type: string;
  label: string;
  count: number;
  statusCounts: StatusCount[];
};

type DashboardData = {
  total: number;
  byType: RequestTypeSummary[];
};

// ---------------------------------------------------------------------------
// สี & ไอคอนสำหรับแต่ละประเภทคำร้อง
// ---------------------------------------------------------------------------

/** สีพื้นหลัง + ขอบ + ไอคอนแต่ละประเภท (HSL-based เพื่อความสวยงาม) */
const TYPE_STYLES: Record<
  string,
  { gradient: string; border: string; icon: string; iconBg: string }
> = {
  ขอใช้ไฟใหม่ถาวร: {
    gradient: "from-emerald-500 to-teal-600",
    border: "border-emerald-200",
    icon: "⚡",
    iconBg: "bg-emerald-100 text-emerald-700",
  },
  ขอใช้ไฟชั่วคราว: {
    gradient: "from-amber-400 to-orange-500",
    border: "border-amber-200",
    icon: "⏱️",
    iconBg: "bg-amber-100 text-amber-700",
  },
  ขอไฟเกษตร: {
    gradient: "from-lime-500 to-green-600",
    border: "border-lime-200",
    icon: "🌾",
    iconBg: "bg-lime-100 text-lime-700",
  },
  เพิ่มขนาด: {
    gradient: "from-blue-500 to-indigo-600",
    border: "border-blue-200",
    icon: "📐",
    iconBg: "bg-blue-100 text-blue-700",
  },
  ยกเลิก: {
    gradient: "from-rose-400 to-red-500",
    border: "border-rose-200",
    icon: "✖️",
    iconBg: "bg-rose-100 text-rose-700",
  },
  ย้าย: {
    gradient: "from-violet-500 to-purple-600",
    border: "border-violet-200",
    icon: "🔄",
    iconBg: "bg-violet-100 text-violet-700",
  },
  เปลี่ยนชื่อผู้ใช้ไฟฟ้า: {
    gradient: "from-cyan-500 to-sky-600",
    border: "border-cyan-200",
    icon: "✏️",
    iconBg: "bg-cyan-100 text-cyan-700",
  },
  "เปลี่ยนเป็น TOU": {
    gradient: "from-fuchsia-500 to-pink-600",
    border: "border-fuchsia-200",
    icon: "🔀",
    iconBg: "bg-fuchsia-100 text-fuchsia-700",
  },
  ขอขยายเขต: {
    gradient: "from-teal-500 to-emerald-600",
    border: "border-teal-200",
    icon: "📍",
    iconBg: "bg-teal-100 text-teal-700",
  },
  คำร้องตรวจสอบ: {
    gradient: "from-sky-500 to-blue-600",
    border: "border-sky-200",
    icon: "🔍",
    iconBg: "bg-sky-100 text-sky-700",
  },
  "ไฟชั่วคราว > ถาวร": {
    gradient: "from-orange-500 to-amber-600",
    border: "border-orange-200",
    icon: "🔁",
    iconBg: "bg-orange-100 text-orange-700",
  },
  คำร้องอื่นๆ: {
    gradient: "from-slate-400 to-slate-600",
    border: "border-slate-200",
    icon: "📋",
    iconBg: "bg-slate-100 text-slate-700",
  },
};

const DEFAULT_STYLE = {
  gradient: "from-slate-400 to-slate-600",
  border: "border-slate-200",
  icon: "📄",
  iconBg: "bg-slate-100 text-slate-700",
};

function getTypeStyle(type: string) {
  return TYPE_STYLES[type] ?? DEFAULT_STYLE;
}

// ---------------------------------------------------------------------------
// สีสำหรับแต่ละ Status
// ---------------------------------------------------------------------------

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  "รับเรื่อง":                              { bg: "bg-blue-50",    text: "text-blue-700",    dot: "bg-blue-500" },
  "หาเอกสารเพิ่มเติม":                      { bg: "bg-yellow-50",  text: "text-yellow-700",  dot: "bg-yellow-500" },
  "รอตรวจสอบคำร้อง":                        { bg: "bg-indigo-50",  text: "text-indigo-700",  dot: "bg-indigo-500" },
  "ตรวจไม่ผ่าน":                            { bg: "bg-red-50",     text: "text-red-700",     dot: "bg-red-500" },
  "รอโทรแจ้ง":                              { bg: "bg-orange-50",  text: "text-orange-700",  dot: "bg-orange-500" },
  "รอทำชำระเงิน":                           { bg: "bg-amber-50",   text: "text-amber-700",   dot: "bg-amber-500" },
  "รอติดตั้งมิเตอร์ / ดำเนินการเพิ่ม / ย้าย": { bg: "bg-purple-50",  text: "text-purple-700",  dot: "bg-purple-500" },
  "กำลังดำเนินการ หน้างาน":                   { bg: "bg-cyan-50",    text: "text-cyan-700",    dot: "bg-cyan-500" },
  "เสร็จสิ้น":                              { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  "ยกเลิก":                                { bg: "bg-slate-100",  text: "text-slate-600",   dot: "bg-slate-400" },
};

const DEFAULT_STATUS_COLOR = { bg: "bg-gray-50", text: "text-gray-700", dot: "bg-gray-400" };

function getStatusColor(status: string) {
  return STATUS_COLORS[status] ?? DEFAULT_STATUS_COLOR;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    async function fetchDashboard() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch("/api/dashboard", { cache: "no-store" });

        if (!response.ok) {
          throw new Error("โหลดข้อมูล Dashboard ไม่สำเร็จ");
        }

        const payload = (await response.json()) as DashboardData;

        if (!ignore) {
          setData(payload);
        }
      } catch (err) {
        if (!ignore) {
          setError(
            err instanceof Error ? err.message : "โหลดข้อมูลไม่สำเร็จ",
          );
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    fetchDashboard();

    return () => {
      ignore = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-4 text-slate-950 sm:px-6 sm:py-8 lg:px-8">
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        {/* ─── Header ─── */}
        <header className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white px-5 py-6 shadow-sm sm:flex-row sm:items-end sm:justify-between sm:px-6">
          <div>
            <p className="text-sm font-medium text-teal-700">ระบบรับคำร้อง</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-950 sm:text-3xl">
              Dashboard
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              ภาพรวมจำนวนคำร้องแยกตามประเภท — กดที่การ์ดเพื่อดูรายการทั้งหมด
            </p>
          </div>
        </header>

        {/* ─── Error ─── */}
        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-medium text-rose-700">
            {error}
          </div>
        )}

        {/* ─── Loading skeleton ─── */}
        {loading && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {/* Skeleton ตัวรวม */}
            <div className="col-span-full animate-pulse rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="h-5 w-32 rounded bg-slate-200" />
              <div className="mt-3 h-10 w-24 rounded bg-slate-200" />
            </div>
            {/* Skeleton การ์ดย่อย */}
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="h-10 w-10 rounded-lg bg-slate-200" />
                <div className="mt-4 h-4 w-28 rounded bg-slate-200" />
                <div className="mt-2 h-7 w-14 rounded bg-slate-200" />
              </div>
            ))}
          </div>
        )}

        {/* ─── Dashboard Content ─── */}
        {!loading && data && (
          <>
            {/* ตัวเลขรวม */}
            <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-teal-600 to-emerald-700 px-6 py-6 text-white shadow-md">
              <p className="text-sm font-medium text-teal-100">
                จำนวนคำร้องทั้งหมด
              </p>
              <p className="mt-1 text-4xl font-extrabold tracking-tight">
                {data.total.toLocaleString("th-TH")}
              </p>
              <p className="mt-1 text-sm text-teal-200">รายการ</p>
            </div>

            {/* Grid การ์ดแยกตามประเภท */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {data.byType.map((item) => {
                const style = getTypeStyle(item.type);

                return (
                  <Link
                    key={item.type}
                    href={`/dashboard/${encodeURIComponent(item.type)}`}
                    className={`group relative flex flex-col overflow-hidden rounded-xl border bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${style.border}`}
                  >
                    {/* ไอคอนวงกลม */}
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-lg text-lg ${style.iconBg}`}
                    >
                      {style.icon}
                    </div>

                    {/* ชื่อประเภท */}
                    <p className="mt-4 text-sm font-medium text-slate-600 group-hover:text-slate-900">
                      {item.label}
                    </p>

                    {/* จำนวน */}
                    <p className="mt-1 text-3xl font-bold text-slate-900">
                      {item.count.toLocaleString("th-TH")}
                    </p>

                    {/* ─── Status Breakdown ─── */}
                    {item.statusCounts.length > 0 && (
                      <div className="mt-3 flex flex-col gap-1.5 border-t border-slate-100 pt-3">
                        {item.statusCounts.map((sc) => {
                          const color = getStatusColor(sc.status);
                          return (
                            <div
                              key={sc.status}
                              className={`flex items-center justify-between rounded-md px-2 py-1 ${color.bg}`}
                            >
                              <span className={`flex items-center gap-1.5 text-xs font-medium ${color.text}`}>
                                <span className={`inline-block h-1.5 w-1.5 rounded-full ${color.dot}`} />
                                {sc.status}
                              </span>
                              <span className={`text-xs font-bold ${color.text}`}>
                                {sc.count.toLocaleString("th-TH")}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* แถบสี gradient ด้านล่าง */}
                    <div
                      className={`absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r ${style.gradient} opacity-0 transition-opacity duration-200 group-hover:opacity-100`}
                    />

                    {/* ลูกศร */}
                    <div className="absolute right-4 top-5 text-slate-300 transition-colors group-hover:text-teal-600">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="m9 18 6-6-6-6" />
                      </svg>
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}

        {/* ─── Empty ─── */}
        {!loading && !data && !error && (
          <div className="rounded-xl border border-slate-200 bg-white px-6 py-16 text-center text-sm text-slate-500 shadow-sm">
            ไม่มีข้อมูลสำหรับแสดงผล
          </div>
        )}
      </main>
    </div>
  );
}

