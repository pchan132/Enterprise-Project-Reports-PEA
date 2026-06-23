"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Clock,
  Phone,
  ChevronRight,
  ArrowRight,
  Zap,
  Wrench,
  BarChart3,
  RefreshCw,
  Flame,
  Users,
  Send,
} from "lucide-react";
import LineReportModal from "../components/line-report-modal";

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

type OverdueItem = {
  id: string;
  firstName: string;
  lastName: string;
  createdAt: string;
  waitingDays: number;
};

type PendingPaymentItem = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  requestType: string[];
  createdAt: string;
  waitingDays: number;
};

type PipelineStep = {
  status: string;
  count: number;
};

type DashboardData = {
  total: number;
  byType: RequestTypeSummary[];
  overdueReview: { count: number; items: OverdueItem[] };
  overdueInstall: { count: number; items: OverdueItem[] };
  pendingPayment: { count: number; items: PendingPaymentItem[] };
  pipeline: PipelineStep[];
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
  สับเปลี่ยน: {
    gradient: "from-yellow-500 to-amber-600",
    border: "border-yellow-200",
    icon: "🔧",
    iconBg: "bg-yellow-100 text-yellow-700",
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
// Pipeline step config
// ---------------------------------------------------------------------------

const PIPELINE_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string; bgLight: string; borderColor: string }> = {
  "รับเรื่อง": {
    label: "รับเรื่อง",
    icon: <Zap className="h-5 w-5" />,
    color: "text-blue-600",
    bgLight: "bg-blue-50",
    borderColor: "border-blue-200",
  },
  "รอตรวจสอบคำร้อง": {
    label: "รอตรวจสอบ",
    icon: <Clock className="h-5 w-5" />,
    color: "text-indigo-600",
    bgLight: "bg-indigo-50",
    borderColor: "border-indigo-200",
  },
  "รอทำชำระเงิน": {
    label: "รอชำระเงิน",
    icon: <Phone className="h-5 w-5" />,
    color: "text-amber-600",
    bgLight: "bg-amber-50",
    borderColor: "border-amber-200",
  },
  "รอติดตั้งมิเตอร์ / ดำเนินการเพิ่ม / ย้าย": {
    label: "รอติดตั้ง",
    icon: <Wrench className="h-5 w-5" />,
    color: "text-purple-600",
    bgLight: "bg-purple-50",
    borderColor: "border-purple-200",
  },
  "เสร็จสิ้น": {
    label: "เสร็จสิ้น",
    icon: <BarChart3 className="h-5 w-5" />,
    color: "text-emerald-600",
    bgLight: "bg-emerald-50",
    borderColor: "border-emerald-200",
  },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isLineModalOpen, setIsLineModalOpen] = useState(false);

  const fetchDashboard = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/dashboard", { cache: "no-store" });

      if (!response.ok) {
        throw new Error("โหลดข้อมูล Dashboard ไม่สำเร็จ");
      }

      const payload = (await response.json()) as DashboardData;
      setData(payload);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "ไม่สามารถโหลดข้อมูลได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  // Find bottleneck: the pipeline step (excluding เสร็จสิ้น) with the most items
  const bottleneckStatus = data?.pipeline
    .filter((s) => s.status !== "เสร็จสิ้น")
    .reduce(
      (max, s) => (s.count > max.count ? s : max),
      { status: "", count: 0 },
    ).status;

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-transparent px-2 py-4 sm:px-4 sm:py-6 lg:px-6">
      <main className="flex w-full flex-1 flex-col gap-6 sm:gap-8">
        {/* ─── Header ─── */}
        <header className="flex flex-col gap-3 rounded-2xl border border-white/60 bg-white/70 px-4 py-5 shadow-lg shadow-teal-900/5 backdrop-blur-xl sm:flex-row sm:items-end sm:justify-between sm:rounded-3xl sm:px-6 sm:py-8">
          <div>
            <p className="text-sm font-medium text-teal-700">
              ระบบรับคำร้อง — ภาพรวมการดำเนินงาน
            </p>
            <h1 className="mt-1 text-2xl font-bold text-slate-950 sm:text-3xl">
              Dashboard
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              {new Date().toLocaleDateString("th-TH", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>

          {/* Total badge + Refresh + Line */}
          <div className="flex items-center gap-3">
            {data && (
              <div className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 px-4 py-2 text-white shadow-md">
                <Users className="h-4 w-4 opacity-80" />
                <span className="text-sm font-medium hidden sm:inline">คำร้องทั้งหมด</span>
                <span className="text-lg font-extrabold">
                  {data.total.toLocaleString("th-TH")}
                </span>
              </div>
            )}
            <button
              onClick={() => setIsLineModalOpen(true)}
              className="flex h-10 items-center gap-2 rounded-xl border border-emerald-500 bg-emerald-50 px-3 text-sm font-bold text-emerald-700 shadow-sm transition-all hover:bg-emerald-100 hover:shadow-md sm:px-4"
              title="ส่งรายงานคำร้องเข้า LINE"
            >
              <Send className="h-4 w-4" />
              <span className="hidden sm:inline">ส่งรายงาน</span>
            </button>
            <button
              onClick={fetchDashboard}
              disabled={loading}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition-all hover:border-teal-300 hover:text-teal-600 hover:shadow-md disabled:opacity-50"
              title="รีเฟรชข้อมูล"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </header>

        {/* ─── Error ─── */}
        {error && (
          <div className="flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-medium text-rose-700">
            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* ─── Loading Skeleton ─── */}
        {loading && <DashboardSkeleton />}

        {/* ─── Dashboard Content ─── */}
        {!loading && data && (
          <>
            {/* ═══════════════════════════════════════════════════════════ */}
            {/* ZONE 1 — Action Center                                     */}
            {/* ═══════════════════════════════════════════════════════════ */}
            <section id="zone-action-center">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100">
                  <Flame className="h-4 w-4 text-red-600" />
                </div>
                <h2 className="text-lg font-bold text-slate-900">
                  ด่วน! สิ่งที่ต้องจัดการวันนี้
                </h2>
              </div>

              {/* SLA Alert Cards */}
              <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                {/* Overdue Review */}
                <SLAAlertCard
                  title="ล่าช้า: รอตรวจสอบ"
                  subtitle="คำร้องค้างรอตรวจสอบเกิน 3 วัน"
                  count={data.overdueReview.count}
                  items={data.overdueReview.items}
                  colorScheme="red"
                  icon={<AlertTriangle className="h-6 w-6" />}
                  filterStatus="รอตรวจสอบคำร้อง"
                />
                {/* Overdue Installation */}
                <SLAAlertCard
                  title="ล่าช้า: รอติดตั้ง"
                  subtitle="คำร้องค้างรอติดตั้งเกิน 3 วัน"
                  count={data.overdueInstall.count}
                  items={data.overdueInstall.items}
                  colorScheme="orange"
                  icon={<Wrench className="h-6 w-6" />}
                  filterStatus="รอติดตั้งมิเตอร์ / ดำเนินการเพิ่ม / ย้าย"
                />
              </div>

              {/* Pending Payment Call List */}
              <PendingPaymentTable items={data.pendingPayment.items} />
            </section>

            {/* ═══════════════════════════════════════════════════════════ */}
            {/* ZONE 2 — Workflow Pipeline                                 */}
            {/* ═══════════════════════════════════════════════════════════ */}
            <section id="zone-pipeline">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100">
                  <ArrowRight className="h-4 w-4 text-indigo-600" />
                </div>
                <h2 className="text-lg font-bold text-slate-900">
                  Workflow Pipeline — คอขวดของงานอยู่ตรงไหน?
                </h2>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-white/60 bg-white/70 p-4 shadow-lg shadow-teal-900/5 backdrop-blur-xl sm:rounded-3xl sm:p-6">
                <div className="flex items-center justify-between gap-1 sm:gap-2">
                  {data.pipeline.map((step, idx) => {
                    const config = PIPELINE_CONFIG[step.status];
                    const isBottleneck =
                      step.status === bottleneckStatus && step.count > 0;

                    return (
                      <div key={step.status} className="flex items-center gap-1 sm:gap-2 flex-1">
                        {/* Step card */}
                        <div
                          className={`
                            relative flex flex-1 flex-col items-center rounded-xl border-2 px-2 py-3 transition-all duration-300 sm:rounded-2xl sm:px-4 sm:py-5
                            ${isBottleneck
                              ? `${config?.borderColor ?? "border-slate-300"} shadow-lg shadow-current/10 scale-[1.03] ring-2 ring-current/20`
                              : "border-slate-100 bg-white hover:border-slate-200 hover:shadow-md"
                            }
                            ${isBottleneck ? config?.bgLight ?? "bg-white" : "bg-white"}
                          `}
                        >
                          {/* Bottleneck badge */}
                          {isBottleneck && (
                            <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-red-500 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-sm">
                              คอขวด
                            </div>
                          )}

                          <div
                            className={`flex h-9 w-9 items-center justify-center rounded-xl sm:h-10 sm:w-10 ${
                              isBottleneck
                                ? `${config?.bgLight ?? "bg-slate-100"} ${config?.color ?? "text-slate-600"}`
                                : "bg-slate-50 text-slate-400"
                            }`}
                          >
                            {config?.icon ?? <BarChart3 className="h-5 w-5" />}
                          </div>

                          <p
                            className={`mt-2 text-center text-[11px] font-medium sm:text-xs ${
                              isBottleneck
                                ? config?.color ?? "text-slate-700"
                                : "text-slate-500"
                            }`}
                          >
                            {config?.label ?? step.status}
                          </p>

                          <p
                            className={`mt-1 text-xl font-extrabold sm:text-2xl ${
                              isBottleneck
                                ? config?.color ?? "text-slate-900"
                                : "text-slate-800"
                            }`}
                          >
                            {step.count.toLocaleString("th-TH")}
                          </p>
                        </div>

                        {/* Arrow between steps */}
                        {idx < data.pipeline.length - 1 && (
                          <ChevronRight className="h-4 w-4 flex-shrink-0 text-slate-300 sm:h-5 sm:w-5" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* ═══════════════════════════════════════════════════════════ */}
            {/* ZONE 3 — Statistics View                                   */}
            {/* ═══════════════════════════════════════════════════════════ */}
            <section id="zone-statistics">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-100">
                  <BarChart3 className="h-4 w-4 text-teal-600" />
                </div>
                <h2 className="text-lg font-bold text-slate-900">
                  สถิติแยกตามประเภท
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
                {data.byType.map((item) => {
                  const style = getTypeStyle(item.type);

                  return (
                    <Link
                      key={item.type}
                      href={`/dashboard/${encodeURIComponent(item.type)}`}
                      className={`group relative flex flex-col overflow-hidden rounded-2xl border bg-white/80 p-4 shadow-lg shadow-slate-200/50 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-teal-900/10 sm:rounded-3xl sm:p-6 sm:hover:-translate-y-2 ${style.border}`}
                    >
                      {/* ไอคอนวงกลม */}
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-2xl text-xl shadow-inner ${style.iconBg}`}
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
                        <ChevronRight className="h-5 w-5" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          </>
        )}

        {/* ─── Empty ─── */}
        {!loading && !data && !error && (
          <div className="rounded-xl border border-slate-200 bg-white px-6 py-16 text-center text-sm text-slate-500 shadow-sm">
            ไม่มีข้อมูลสำหรับแสดงผล
          </div>
        )}
      </main>

      <LineReportModal 
        isOpen={isLineModalOpen} 
        onClose={() => setIsLineModalOpen(false)} 
      />
    </div>
  );
}

// ===========================================================================
// Sub-components
// ===========================================================================

// ---------------------------------------------------------------------------
// SLA Alert Card
// ---------------------------------------------------------------------------

function SLAAlertCard({
  title,
  subtitle,
  count,
  items,
  colorScheme,
  icon,
  filterStatus,
}: {
  title: string;
  subtitle: string;
  count: number;
  items: OverdueItem[];
  colorScheme: "red" | "orange";
  icon: React.ReactNode;
  filterStatus: string;
}) {
  const isRed = colorScheme === "red";
  const hasCritical = count > 0;

  const bgGradient = isRed
    ? "from-red-500 to-rose-600"
    : "from-orange-400 to-amber-500";

  const bgLight = isRed ? "bg-red-50" : "bg-orange-50";
  const borderColor = isRed ? "border-red-200" : "border-orange-200";
  const textMuted = isRed ? "text-red-300" : "text-orange-300";
  const ringColor = isRed ? "ring-red-400/30" : "ring-orange-400/30";

  // Show up to 6 most overdue
  const topItems = items.slice(0, 6);

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border transition-all duration-300 sm:rounded-3xl ${
        hasCritical
          ? `bg-gradient-to-br ${bgGradient} ${borderColor} shadow-xl ring-2 ${ringColor}`
          : `${bgLight} ${borderColor} shadow-md`
      }`}
    >
      <div className="relative z-10 p-4 sm:p-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <p
              className={`text-sm font-bold ${
                hasCritical ? "text-white" : isRed ? "text-red-700" : "text-orange-700"
              }`}
            >
              {title}
            </p>
            <p
              className={`mt-0.5 text-xs ${
                hasCritical ? textMuted : isRed ? "text-red-500" : "text-orange-500"
              }`}
            >
              {subtitle}
            </p>
          </div>
          <div
            className={`flex h-11 w-11 items-center justify-center rounded-xl ${
              hasCritical
                ? "bg-white/20 text-white"
                : isRed
                  ? "bg-red-100 text-red-500"
                  : "bg-orange-100 text-orange-500"
            }`}
          >
            {icon}
          </div>
        </div>

        {/* Count */}
        <p
          className={`mt-3 text-4xl font-extrabold tracking-tight ${
            hasCritical ? "text-white" : isRed ? "text-red-700" : "text-orange-700"
          }`}
        >
          {count.toLocaleString("th-TH")}
          <span
            className={`ml-1.5 text-sm font-medium ${
              hasCritical ? textMuted : isRed ? "text-red-400" : "text-orange-400"
            }`}
          >
            รายการ
          </span>
        </p>

        {/* Top overdue names */}
        {topItems.length > 0 && (
          <div className="mt-3 space-y-1">
            {topItems.map((item) => (
              <div
                key={item.id}
                className={`flex items-center justify-between rounded-lg px-2.5 py-1 text-xs ${
                  hasCritical ? "bg-white/15 text-white/90" : `${bgLight} ${isRed ? "text-red-700" : "text-orange-700"}`
                }`}
              >
                <span className="truncate">
                  <Link href={`/requests/${item.id}`} className="cursor-pointer">
                  {item.firstName} {item.lastName}
                  </Link>
                </span>
                <span className={`ml-2 font-bold ${hasCritical ? "text-white" : ""}`}>
                  {item.waitingDays} วัน
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Link to filtered view */}
        {hasCritical && (
          <Link
            href={`/?status=${encodeURIComponent(filterStatus)}`}
            className="mt-3 flex items-center gap-1 text-xs font-medium text-white/80 transition-colors hover:text-white"
          >
            ดูทั้งหมด
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>

      {/* Decorative blur */}
      {hasCritical && (
        <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/10 blur-2xl" />
      )}

      {/* Pulsing dot */}
      {hasCritical && (
        <div className="absolute right-3 top-3">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-white" />
          </span>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pending Payment Call List
// ---------------------------------------------------------------------------

function PendingPaymentTable({ items }: { items: PendingPaymentItem[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/60 bg-white/70 shadow-lg shadow-teal-900/5 backdrop-blur-xl sm:rounded-3xl">
      {/* Table header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100">
            <Phone className="h-4 w-4 text-amber-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              รายการตามยอด — รอทำชำระเงิน
            </h3>
            <p className="text-xs text-slate-500">
              เรียงจากรอนานสุดก่อน • {items.length} รายการ
            </p>
          </div>
        </div>
        {items.length > 0 && (
          <Link
            href={`/?status=${encodeURIComponent("รอทำชำระเงิน")}`}
            className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-all hover:border-teal-300 hover:text-teal-700 hover:shadow-sm"
          >
            ดูทั้งหมด
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>

      {/* Table content */}
      {items.length === 0 ? (
        <div className="px-6 py-12 text-center text-sm text-slate-400">
          🎉 ไม่มีรายการรอชำระเงิน
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-left text-xs font-medium text-slate-500">
                <th className="py-2.5 pl-4 pr-2 sm:pl-6">#</th>
                <th className="px-2 py-2.5">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    รอ (วัน)
                  </div>
                </th>
                <th className="px-2 py-2.5">ชื่อ-สกุล</th>
                <th className="px-2 py-2.5">เบอร์โทร</th>
                <th className="px-2 py-2.5 pr-4 sm:pr-6">ประเภทคำร้อง</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => {
                const isUrgent = item.waitingDays >= 7;
                const isWarning = item.waitingDays >= 4;

                return (
                  <tr
                    key={item.id}
                    className={`border-b border-slate-50 transition-colors last:border-0 hover:bg-teal-50/40 ${
                      isUrgent ? "bg-red-50/40" : isWarning ? "bg-amber-50/30" : ""
                    }`}
                  >
                    <td className="py-2.5 pl-4 pr-2 text-xs text-slate-400 sm:pl-6">
                      {idx + 1}
                    </td>
                    <td className="px-2 py-2.5">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold ${
                          isUrgent
                            ? "bg-red-100 text-red-700"
                            : isWarning
                              ? "bg-amber-100 text-amber-700"
                              : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {item.waitingDays}
                      </span>
                    </td>
                    <td className="px-2 py-2.5 font-medium text-slate-800">
                      <Link href={`/requests/${item.id}`}>
                      {item.firstName} {item.lastName}
                      </Link>
                    </td>
                    <td className="px-2 py-2.5">
                      <a
                        href={`tel:${item.phone}`}
                        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-teal-700 transition-all hover:bg-teal-50 hover:text-teal-800"
                      >
                        <Phone className="h-3 w-3" />
                        {item.phone}
                      </a>
                    </td>
                    <td className="px-2 py-2.5 pr-4 sm:pr-6">
                      <div className="flex flex-wrap gap-1">
                        {item.requestType.map((rt) => (
                          <span
                            key={rt}
                            className="inline-block rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600"
                          >
                            {rt}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Loading Skeleton
// ---------------------------------------------------------------------------

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      {/* Zone 1 skeleton */}
      <div>
        <div className="mb-4 h-7 w-56 animate-pulse rounded-lg bg-slate-200" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
          <div className="h-44 animate-pulse rounded-2xl bg-gradient-to-br from-red-200 to-rose-200 sm:rounded-3xl" />
          <div className="h-44 animate-pulse rounded-2xl bg-gradient-to-br from-orange-200 to-amber-200 sm:rounded-3xl" />
        </div>
        <div className="mt-4 h-64 animate-pulse rounded-2xl border border-slate-200 bg-white sm:rounded-3xl" />
      </div>

      {/* Zone 2 skeleton */}
      <div>
        <div className="mb-4 h-7 w-72 animate-pulse rounded-lg bg-slate-200" />
        <div className="flex gap-2 rounded-2xl border border-slate-200 bg-white p-6 sm:rounded-3xl">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex flex-1 items-center gap-2">
              <div className="h-28 w-full animate-pulse rounded-xl bg-slate-100" />
              {i < 4 && <div className="h-4 w-4 flex-shrink-0 animate-pulse rounded bg-slate-100" />}
            </div>
          ))}
        </div>
      </div>

      {/* Zone 3 skeleton */}
      <div>
        <div className="mb-4 h-7 w-48 animate-pulse rounded-lg bg-slate-200" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:rounded-3xl"
            >
              <div className="h-12 w-12 rounded-2xl bg-slate-200" />
              <div className="mt-4 h-4 w-28 rounded bg-slate-200" />
              <div className="mt-2 h-8 w-14 rounded bg-slate-200" />
              <div className="mt-3 border-t border-slate-100 pt-3">
                <div className="h-5 w-full rounded bg-slate-100" />
                <div className="mt-1.5 h-5 w-3/4 rounded bg-slate-100" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
