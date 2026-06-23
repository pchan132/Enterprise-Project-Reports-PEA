"use client";

import { useState } from "react";
import { X, Send, AlertTriangle, CheckCircle2 } from "lucide-react";

type LineReportModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

const STATUS_LIST = [
  "รับเรื่อง",
  "หาเอกสารเพิ่มเติม",
  "รอตรวจสอบคำร้อง",
  "ตรวจไม่ผ่าน",
  "รอโทรแจ้ง",
  "รอทำชำระเงิน",
  "รอติดตั้งมิเตอร์ / ดำเนินการเพิ่ม / ย้าย",
  "กำลังดำเนินการ หน้างาน",
  "เสร็จสิ้น",
  "ยกเลิก",
];

export default function LineReportModal({ isOpen, onClose }: LineReportModalProps) {
  const [status, setStatus] = useState<string>("รับเรื่อง");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  
  const [toast, setToast] = useState<{ visible: boolean; type: "success" | "error"; message: string }>({
    visible: false,
    type: "success",
    message: "",
  });

  if (!isOpen) return null;

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ visible: true, type, message });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 5000);
  };

  const handleSendReport = async () => {
    if (!status) {
      showToast("error", "กรุณาเลือกสถานะคำร้อง");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/dashboard/line-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, startDate, endDate }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        showToast("error", data.message || "เกิดข้อผิดพลาดในการส่งรายงาน");
      } else {
        showToast("success", data.message || "ส่งรายงานสรุปเข้า LINE สำเร็จ");
        setTimeout(() => {
          onClose();
        }, 2000);
      }
    } catch {
      showToast("error", "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm transition-opacity">
        <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-4">
            <h3 className="text-lg font-bold text-slate-800">ส่งรายงานคำร้องเข้า LINE</h3>
            <button
              onClick={onClose}
              className="rounded-full p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors"
              disabled={loading}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                สถานะคำร้อง <span className="text-red-500">*</span>
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                disabled={loading}
              >
                {STATUS_LIST.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  ตั้งแต่วันที่ (ตัวเลือก)
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  ถึงวันที่ (ตัวเลือก)
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  disabled={loading}
                />
              </div>
            </div>
            
            <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-100">
              💡 หมายเหตุ: ระบบจะส่งข้อมูลสรุปรวมในรูปแบบข้อความเข้าสู่ LINE Group ทันทีเมื่อกดยืนยัน (สูงสุด 5 กล่องข้อความต่อครั้งเพื่อประหยัดโควต้า)
            </p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-6 py-4 bg-slate-50">
            <button
              onClick={onClose}
              disabled={loading}
              className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-200 transition-colors disabled:opacity-50"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleSendReport}
              disabled={loading}
              className="flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-teal-700 transition-colors focus:ring-2 focus:ring-teal-500/50 focus:outline-none disabled:opacity-70 disabled:cursor-wait shadow-sm shadow-teal-600/20"
            >
              {loading ? (
                <>
                  <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                  กำลังส่ง...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  ส่งรายงาน
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Toast */}
      <div
        aria-live="polite"
        className={[
          "fixed right-4 top-4 z-[9999] max-w-sm transform rounded-lg px-4 py-3 shadow-lg transition-all duration-300",
          toast.visible ? "translate-y-0 opacity-100" : "-translate-y-2 pointer-events-none opacity-0",
          toast.type === "success"
            ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
            : "border border-rose-200 bg-rose-50 text-rose-800",
        ].join(" ")}
      >
        <div className="flex items-center gap-2">
          {toast.type === "success" ? (
            <CheckCircle2 className="h-5 w-5 shrink-0" />
          ) : (
            <AlertTriangle className="h-5 w-5 shrink-0" />
          )}
          <p className="text-sm font-medium">{toast.message}</p>
        </div>
      </div>
    </>
  );
}
