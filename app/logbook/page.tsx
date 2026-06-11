"use client";

import { useCallback, useEffect, useState } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type LogbookSummary = {
  total: number;
  completed: number;
  attentionNeeded: number;
};

type LogbookRequest = {
  id: string;
  requestNo: string | null;
  firstName: string;
  lastName: string;
  phone: string;
  description: string | null;
  requestType: string[];
  status: string;
  createdAt: string;
};

type LogbookData = {
  summary: LogbookSummary;
  requests: LogbookRequest[];
};

// ---------------------------------------------------------------------------
// Status badge colours (reused from dashboard)
// ---------------------------------------------------------------------------

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> =
  {
    รับเรื่อง: {
      bg: "bg-blue-50",
      text: "text-blue-700",
      dot: "bg-blue-500",
    },
    หาเอกสารเพิ่มเติม: {
      bg: "bg-yellow-50",
      text: "text-yellow-700",
      dot: "bg-yellow-500",
    },
    รอตรวจสอบคำร้อง: {
      bg: "bg-indigo-50",
      text: "text-indigo-700",
      dot: "bg-indigo-500",
    },
    ตรวจไม่ผ่าน: {
      bg: "bg-red-50",
      text: "text-red-700",
      dot: "bg-red-500",
    },
    รอโทรแจ้ง: {
      bg: "bg-orange-50",
      text: "text-orange-700",
      dot: "bg-orange-500",
    },
    รอทำชำระเงิน: {
      bg: "bg-amber-50",
      text: "text-amber-700",
      dot: "bg-amber-500",
    },
    "รอติดตั้งมิเตอร์ / ดำเนินการเพิ่ม / ย้าย": {
      bg: "bg-purple-50",
      text: "text-purple-700",
      dot: "bg-purple-500",
    },
    "กำลังดำเนินการ หน้างาน": {
      bg: "bg-cyan-50",
      text: "text-cyan-700",
      dot: "bg-cyan-500",
    },
    เสร็จสิ้น: {
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      dot: "bg-emerald-500",
    },
    ยกเลิก: {
      bg: "bg-slate-100",
      text: "text-slate-600",
      dot: "bg-slate-400",
    },
  };

const DEFAULT_STATUS = {
  bg: "bg-gray-50",
  text: "text-gray-700",
  dot: "bg-gray-400",
};

function getStatusColor(status: string) {
  return STATUS_COLORS[status] ?? DEFAULT_STATUS;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toLocalDateString(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatThaiDate(dateStr: string) {
  const date = new Date(`${dateStr}T00:00:00`);
  return new Intl.DateTimeFormat("th-TH", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

function formatTime(isoString: string) {
  const date = new Date(isoString);
  return date.toLocaleTimeString("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isOtherType(types: string[]) {
  return types.includes("คำร้องอื่นๆ");
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function LogbookPage() {
  const [selectedDate, setSelectedDate] = useState(() =>
    toLocalDateString(new Date()),
  );
  const [data, setData] = useState<LogbookData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchLogbook = useCallback(async (date: string) => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/logbook?date=${date}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("โหลดข้อมูลสมุดบันทึกไม่สำเร็จ");
      }

      const payload = (await response.json()) as LogbookData;
      setData(payload);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "โหลดข้อมูลไม่สำเร็จ",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogbook(selectedDate);
  }, [selectedDate, fetchLogbook]);

  function handlePrint() {
    window.print();
  }

  return (
    <div className="min-h-screen bg-transparent px-4 py-8 sm:px-6 lg:px-8">
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        {/* ─── Header ─── */}
        <header className="flex flex-col gap-4 rounded-3xl border border-white/60 bg-white/70 px-6 py-8 shadow-xl shadow-teal-900/5 backdrop-blur-xl sm:flex-row sm:items-end sm:justify-between print:rounded-none print:border-none print:bg-transparent print:px-0 print:py-4 print:shadow-none print:backdrop-blur-none">
          <div>
            <p className="text-sm font-medium text-teal-700 print:hidden">
              ระบบรับคำร้อง
            </p>
            <h1 className="mt-1 text-2xl font-bold text-slate-950 sm:text-3xl">
              📒 สมุดบันทึกประจำวัน
            </h1>
            <p className="mt-2 text-base text-slate-600 print:text-sm">
              {formatThaiDate(selectedDate)}
            </p>
          </div>

          <div className="flex items-center gap-3 print:hidden">
            {/* Date Picker */}
            <div className="relative">
              <label htmlFor="logbook-date" className="sr-only">
                เลือกวันที่
              </label>
              <input
                id="logbook-date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="h-11 rounded-xl border border-slate-200/60 bg-white/80 px-4 text-sm font-medium text-slate-700 shadow-sm transition-all duration-200 hover:border-teal-300 hover:shadow-md focus:border-teal-500 focus:outline-none focus:ring-4 focus:ring-teal-100"
              />
            </div>

            {/* Print Button */}
            <button
              id="logbook-print-btn"
              type="button"
              onClick={handlePrint}
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-teal-200/60 bg-teal-700 px-5 text-sm font-bold text-white shadow-md shadow-teal-900/20 transition-all duration-200 hover:bg-teal-800 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-teal-100"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="6 9 6 2 18 2 18 9" />
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <rect width="12" height="8" x="6" y="14" />
              </svg>
              พิมพ์
            </button>
          </div>
        </header>

        {/* ─── Error ─── */}
        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-medium text-rose-700 print:hidden">
            {error}
          </div>
        )}

        {/* ─── Summary Cards ─── */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 print:hidden">
          {/* Total */}
          <SummaryCard
            loading={loading}
            value={data?.summary.total ?? 0}
            label="คำร้องทั้งหมด"
            icon="📥"
            gradient="from-teal-600 via-teal-700 to-emerald-800"
            glowColor="bg-teal-400/20"
          />

          {/* Completed / Assigned */}
          <SummaryCard
            loading={loading}
            value={data?.summary.completed ?? 0}
            label="ดำเนินการ / มอบหมายแล้ว"
            icon="✅"
            gradient="from-emerald-500 via-emerald-600 to-green-700"
            glowColor="bg-emerald-400/20"
          />

          {/* Attention Needed */}
          <SummaryCard
            loading={loading}
            value={data?.summary.attentionNeeded ?? 0}
            label="ต้องตรวจสอบ (คำร้องอื่นๆ)"
            icon="⚠️"
            gradient="from-amber-500 via-orange-500 to-red-500"
            glowColor="bg-orange-400/20"
          />
        </div>

        {/* ─── Loading skeleton for table ─── */}
        {loading && (
          <div className="overflow-hidden rounded-3xl border border-white/60 bg-white/70 shadow-xl shadow-teal-900/5 backdrop-blur-xl print:hidden">
            <div className="animate-pulse p-6">
              <div className="mb-4 h-5 w-40 rounded bg-slate-200" />
              <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4"
                  >
                    <div className="h-4 w-16 rounded bg-slate-200" />
                    <div className="h-4 w-28 rounded bg-slate-200" />
                    <div className="h-4 flex-1 rounded bg-slate-200" />
                    <div className="h-4 w-24 rounded bg-slate-200" />
                    <div className="h-4 w-20 rounded bg-slate-200" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ─── Log Table ─── */}
        {!loading && data && data.requests.length > 0 && (
          <div className="overflow-hidden rounded-3xl border border-white/60 bg-white/70 shadow-xl shadow-teal-900/5 backdrop-blur-xl print:rounded-none print:border print:border-slate-300 print:bg-white print:shadow-none print:backdrop-blur-none">
            {/* Table header bar */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 print:border-b-2 print:border-slate-400">
              <h2 className="text-lg font-bold text-slate-800">
                รายการคำร้อง — {data.requests.length} รายการ
              </h2>
              <span className="text-xs text-slate-500 print:hidden">
                เรียงตามเวลารับเรื่อง (เก่าสุด → ใหม่สุด)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm" id="logbook-table">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 print:bg-slate-100">
                    <th className="whitespace-nowrap px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 print:text-slate-700">
                      เวลา
                    </th>
                    <th className="whitespace-nowrap px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 print:text-slate-700">
                      เลขคำร้อง
                    </th>
                    <th className="whitespace-nowrap px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 print:text-slate-700">
                      ชื่อ-นามสกุล
                    </th>
                    <th className="whitespace-nowrap px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 print:text-slate-700">
                      ประเภท
                    </th>
                    <th className="whitespace-nowrap px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 print:text-slate-700">
                      รายละเอียด / หมายเหตุ
                    </th>
                    <th className="whitespace-nowrap px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 print:text-slate-700">
                      สถานะ
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 print:divide-slate-300">
                  {data.requests.map((req, index) => {
                    const isAnomaly = isOtherType(req.requestType);
                    const statusColor = getStatusColor(req.status);

                    return (
                      <tr
                        key={req.id}
                        className={`transition-colors duration-150 ${
                          isAnomaly
                            ? "bg-orange-50/70 hover:bg-orange-100/70 print:bg-orange-50"
                            : index % 2 === 0
                              ? "bg-white/40 hover:bg-teal-50/50"
                              : "bg-slate-50/30 hover:bg-teal-50/50"
                        }`}
                      >
                        {/* เวลา */}
                        <td className="whitespace-nowrap px-5 py-3.5 font-mono text-sm text-slate-700">
                          {formatTime(req.createdAt)}
                        </td>

                        {/* เลขคำร้อง */}
                        <td className="whitespace-nowrap px-5 py-3.5">
                          <span className="inline-flex items-center rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 print:bg-transparent print:px-0">
                            {req.requestNo ?? "—"}
                          </span>
                        </td>

                        {/* ชื่อ-นามสกุล */}
                        <td className="whitespace-nowrap px-5 py-3.5 font-medium text-slate-900">
                          {req.firstName} {req.lastName}
                        </td>

                        {/* ประเภท */}
                        <td className="px-5 py-3.5">
                          <div className="flex flex-wrap gap-1">
                            {req.requestType.map((type) => (
                              <span
                                key={type}
                                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                  type === "คำร้องอื่นๆ"
                                    ? "bg-orange-100 text-orange-800 print:bg-orange-50"
                                    : "bg-teal-50 text-teal-700 print:bg-transparent"
                                }`}
                              >
                                {type === "คำร้องอื่นๆ" && (
                                  <span className="mr-1">⚠️</span>
                                )}
                                {type}
                              </span>
                            ))}
                          </div>
                        </td>

                        {/* รายละเอียด */}
                        <td className="max-w-xs truncate px-5 py-3.5 text-sm text-slate-600">
                          {req.description || "—"}
                        </td>

                        {/* สถานะ */}
                        <td className="whitespace-nowrap px-5 py-3.5">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${statusColor.bg} ${statusColor.text}`}
                          >
                            <span
                              className={`inline-block h-1.5 w-1.5 rounded-full ${statusColor.dot}`}
                            />
                            {req.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Footer with anomaly legend */}
            {data.summary.attentionNeeded > 0 && (
              <div className="border-t border-slate-100 px-6 py-3 print:border-t-2 print:border-slate-400">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="inline-block h-3 w-6 rounded-sm bg-orange-100 ring-1 ring-orange-200" />
                  <span>
                    = แถวสีส้มหมายถึง «คำร้องอื่นๆ» — ต้องตรวจสอบเพิ่มเติม
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── Empty ─── */}
        {!loading && data && data.requests.length === 0 && (
          <div className="flex flex-col items-center gap-3 rounded-3xl border border-white/60 bg-white/70 px-6 py-20 text-center shadow-xl shadow-teal-900/5 backdrop-blur-xl print:hidden">
            <span className="text-5xl">📭</span>
            <p className="text-base font-medium text-slate-500">
              ไม่มีคำร้องในวันที่ {formatThaiDate(selectedDate)}
            </p>
            <p className="text-sm text-slate-400">
              ลองเลือกวันที่อื่น หรือรอจนกว่าจะมีคำร้องเข้ามา
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Summary Card component
// ---------------------------------------------------------------------------

type SummaryCardProps = {
  loading: boolean;
  value: number;
  label: string;
  icon: string;
  gradient: string;
  glowColor: string;
};

function SummaryCard({
  loading,
  value,
  label,
  icon,
  gradient,
  glowColor,
}: SummaryCardProps) {
  if (loading) {
    return (
      <div className="animate-pulse rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="h-10 w-10 rounded-lg bg-slate-200" />
        <div className="mt-4 h-4 w-24 rounded bg-slate-200" />
        <div className="mt-2 h-8 w-16 rounded bg-slate-200" />
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} p-6 text-white shadow-xl transition-transform duration-300 hover:-translate-y-1 hover:shadow-2xl`}
    >
      {/* Glow decoration */}
      <div
        className={`absolute -right-6 -top-6 h-28 w-28 rounded-full ${glowColor} blur-2xl`}
      />
      <div className="relative z-10">
        <span className="text-2xl">{icon}</span>
        <p className="mt-3 text-sm font-medium opacity-85">{label}</p>
        <p className="mt-1 text-3xl font-extrabold tracking-tight">
          {value.toLocaleString("th-TH")}
        </p>
      </div>
    </div>
  );
}
