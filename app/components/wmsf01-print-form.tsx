"use client";

import { useRef } from "react";
import type { ElectricalRequestDto } from "@/app/lib/electrical-request-types";
import { request } from "http";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type WMSF01PrintFormProps = {
  /** ข้อมูลคำร้อง (ถ้ามี จะ pre-fill ลงในฟอร์ม) */
  request?: ElectricalRequestDto | null;
  /** ชื่อการไฟฟ้า */
  peaOfficeName?: string;
  /** Callback เมื่อปิด modal */
  onClose: () => void;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatThaiDate(value: string | null | undefined): string {
  if (!value) return "";
  try {
    return new Intl.DateTimeFormat("th-TH", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(new Date(`${value}T00:00:00+07:00`));
  } catch {
    return value;
  }
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function WMSF01PrintForm({
  request,
  peaOfficeName = "",
  onClose,
}: WMSF01PrintFormProps) {
  const printAreaRef = useRef<HTMLDivElement>(null);

  const fullName = request
    ? `${request.firstName} ${request.lastName}`.trim()
    : "";

  const requestTypes = request
    ? Array.isArray(request.requestType)
      ? request.requestType.join(", ")
      : request.requestType ?? ""
    : "";

  function handlePrint() {
    window.print();
  }

  // ── Section 1 items ──
  const section1Items = [
    { no: 1, label: "สายจดหน่วย :" },
    { no: 2, label: "ประเภทการใช้ไฟ :" },
    { no: 3, label: "ประเภทอุตสาหกรรม :" },
    { no: 4, label: "ค่าประมาณการใช้ไฟ :                               หน่วย/เดือน" },
    {
      no: 5,
      label:
        "เหตุผลการขอใช้ไฟ /สับเปลี่ยน/รื้อถอน/ต่อกลับ/ตัดฝาก :",
      data: `${request?.meterOption ?? ""} ${Array.isArray(request?.requestType) ? request.requestType.join(", ") : request?.requestType ?? ""}`.trim() || ""
    },
    { no: 6, label: "หมายเลขผู้ใช้ไฟฟ้า 6 หลัก :", data: request?.caRefNo ?? "" },
    { no: 7, label: "หมายเลข PEA มิเตอร์ติดตั้งก่อน :", data: request?.peaNo ?? "" },
    { no: 8, label: "หมายเลข PEA มิเตอร์ติดตั้งหลัง :" },
    { no: 9, label: "สถานีจ่ายไฟระบบ             /เควี" },
    { no: 10, label: "หมายเลข PEA หม้อแปลง :" },
    {
      no: 11,
      label: "ติดตั้งมิเตอร์ขนาด ______ Amp เฟส A B C",
    },
    { no: 12, label: "ติดมิเตอร์ที่เสา ______ เมตร เครื่องที่ ______" },
    {
      no: 13,
      label: "วันที่สำรวจ :",
    },
    { no: 14, label: "ชื่อผู้สำรวจ และรหัสพนักงาน :" },
  ];

  // ── Section 2 items ──
  const section2Items = [
    {
      no: 15,
      label:
        "หมายเลข PEA มิเตอร์นำไปติดตั้ง/สับเปลี่ยน/ต่อกลับ :",
    },
    { no: 16, label: "หน่วยมิเตอร์ที่อ่านได้ (จากลำดับที่ 15) :" },
    { no: 17, label: "หมายเลข PEA มิเตอร์ที่รื้อถอน :" },
    { no: 18, label: "หน่วยมิเตอร์ที่อ่านได้ (จากลำดับ 17) :" },
    {
      no: 19,
      label:
        "วันที่ติดตั้ง/สับเปลี่ยน/รื้อถอน/ตัดฝาก/ต่อกลับ :",
      data: formatThaiDate(request?.targetDate),
    },
    { no: 20, label: "ระยะเวลาการปฏิบัติงาน :" },
    { no: 21, label: "ติดตั้งมิเตอร์ เฟส A B C" },
    { no: 22, label: "หมายเลข PEA หม้อแปลง :" },
    {
      no: 23,
      label:
        "ชื่อผู้ติดตั้ง / รหัสพนักงาน / ศูนย์งานผู้รับจ้าง :",
    },
  ];

  return (
    <>
      {/* ── Overlay backdrop (hidden on print) ── */}
      <div className="print-hide fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm" />

      {/* ── Modal container ── */}
      <div className="fixed inset-0 z-[9999] overflow-auto">
        {/* ── Action bar (hidden on print) ── */}
        <div className="print-hide sticky top-0 z-10 flex items-center justify-center gap-3 bg-slate-900/90 px-4 py-3 backdrop-blur">
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-400/50"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-4 w-4"
            >
              <path
                fillRule="evenodd"
                d="M5 2.75C5 1.784 5.784 1 6.75 1h6.5c.966 0 1.75.784 1.75 1.75v3.552c.377.046.752.097 1.126.153A2.212 2.212 0 0 1 18 8.653v4.097A2.25 2.25 0 0 1 15.75 15h-.75v.75c0 .966-.784 1.75-1.75 1.75h-6.5A1.75 1.75 0 0 1 5 15.75V15h-.75A2.25 2.25 0 0 1 2 12.75V8.653c0-1.082.775-2.034 1.874-2.198.374-.056.75-.107 1.126-.153V2.75ZM6.5 15v.75c0 .138.112.25.25.25h6.5a.25.25 0 0 0 .25-.25V15h-7Zm7-11.25v3.372a40.739 40.739 0 0 0-7 0V3.75h-.002V2.75a.25.25 0 0 1 .25-.25h6.5a.25.25 0 0 1 .25.25v1Zm.497 6a.75.75 0 0 1 .75-.75h.5a.75.75 0 0 1 0 1.5h-.5a.75.75 0 0 1-.75-.75Z"
                clipRule="evenodd"
              />
            </svg>
            พิมพ์ฟอร์ม / Print
          </button>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-500 bg-slate-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-400/50"
          >
            ปิด
          </button>
        </div>

        {/* ── A4 printable area ── */}
        <div className="flex justify-center py-8 print:py-0">
          <div
            ref={printAreaRef}
            id="wmsf01-print-area"
            className="wmsf01-page relative w-[210mm] min-h-[297mm] bg-white text-black px-[15mm] py-[10mm] shadow-2xl print:shadow-none print:px-0 print:py-0"
            style={{ fontFamily: "'TH Sarabun New', 'Sarabun', 'Tahoma', sans-serif" }}
          >
            <div className="absolute right-16 top-16 font-bold">
              วันที่รับคำร้อง: {formatThaiDate(request?.requestDate)}
            </div>
            {/* ─── HEADER ─── */}
            <div className="relative">
              {/* Form code top-right */}
              <div className="absolute right-0 top-0 text-sm font-bold">
                WMSF01
              </div>

              {/* Title */}
              <div className="text-center">
                <h1 className="text-xl font-bold leading-relaxed">
                  แบบฟอร์มการสำรวจการขอใช้ไฟใหม่ ติดตั้ง สับเปลี่ยน รื้อถอน ต่อกลับ ตัดฝาก รายย่อย
                </h1>
              </div>
            </div>

            {/* ─── Header data rows ─── */}
            <div className="mb-4 space-y-1.5 text-sm">
              {/* Row 1 */}
              <div className="flex items-end gap-1">
                <span className="shrink-0">ชื่อการไฟฟ้า</span>
                <span className="flex-1 border-b border-dotted border-black min-h-[1.2em] px-1">
                  {peaOfficeName}
                </span>
              </div>

              {/* Row 2 */}
              <div className="flex flex-wrap items-end gap-x-4 gap-y-1">
                <div className="flex flex-1 items-end gap-1">
                  <span className="shrink-0">เลขที่คำร้องระบบเดิม</span>
                  <span className="flex-1 border-b border-dotted border-black min-h-[1.2em] px-1">
                    {request?.requestNo ?? ""}
                  </span>
                </div>
                <div className="flex flex-1 items-end gap-1">
                  <span className="shrink-0">เลขที่คำร้องระบบ SAP</span>
                  <span className="flex-1 border-b border-dotted border-black min-h-[1.2em] px-1">
                  </span>
                </div>
              </div>

              {/* Row 3 */}
              <div className="flex flex-wrap items-end gap-x-4 gap-y-1">
                <div className="flex flex-1 items-end gap-1">
                  <span className="shrink-0">ชื่อผู้ใช้ไฟ</span>
                  <span className="text-xl flex-1 border-b border-dotted border-black min-h-[1.2em] px-1 font-bold">
                    {fullName}
                  </span>
                </div>
                {/* <div className="flex items-end gap-1" style={{ minWidth: "35%" }}>
                  <span className="shrink-0">ประเภทคำร้อง</span>
                  <span className="flex-1 border-b border-dotted border-black min-h-[1.2em] px-1">
                    {requestTypes}
                  </span>
                </div> */}
                <span className="shrink-0">ที่อยู่</span>
                <span className="text-lg flex-1 border-b border-dotted border-black min-h-[1.2em] px-1 font-bold">
                  {request
                    ? `${request.address} จ.${request.province} อ.${request.district} ต.${request.subDistrict}  `
                    : ""}
                </span>
              </div>

              {/* Row 4: Address */}
              {/* <div className="flex items-end gap-1"> */}
                {/* <span className="shrink-0">ที่อยู่</span>
                <span className="flex-1 border-b border-dotted border-black min-h-[1.2em] px-1">
                  {request
                    ? `${request.address} ต.${request.subDistrict} อ.${request.district} จ.${request.province}`
                    : ""}
                </span> */}
              {/* </div> */}

              {/* Row 5: Phone */}
              <div className="flex flex-wrap items-end gap-x-4 gap-y-1">
                <div className="flex flex-1 items-end gap-1">
                  <span className="shrink-0">เบอร์โทรสำรอง</span>
                  <span className="flex-1 border-b border-dotted border-black min-h-[1.2em] px-1 font-bold text-lg ">
                    {request?.phone2 ?? ""}
                  </span>
                </div>
                <div className="flex flex-1 items-end gap-1">
                  <span className="shrink-0">เบอร์โทร</span>
                  <span className="text-lg flex-1 border-b border-dotted border-black min-h-[1.2em] px-1 font-bold">
                    {request?.phone ?? ""}
                  </span>
                </div>
              </div>
            </div>

            {/* ─── SECTION 1 ─── */}
            <div className="mb-3">
              <h2 className="mb-1 text-3xl font-bold">
                ส่วนที่ 1 ของผู้สำรวจ (ผบค.)
              </h2>
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="w-[40px] border border-black bg-gray-50 px-2 py-1 text-center font-bold">
                      ลำดับ
                    </th>
                    <th className="border border-black bg-gray-50 px-2 py-1 text-left font-bold">
                      รายการ
                    </th>
                    <th className="w-[35%] border border-black bg-gray-50 px-2 py-1 text-left font-bold">
                      ข้อมูล
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {section1Items.map((item) => (
                    <tr key={item.no}>
                      <td className="border border-black text-center font-bold">
                        {item.no}
                      </td>
                      <td className="border border-black px-2 text-xl font-bold">
                        {item.label}
                      </td>
                      <td className="border border-black px-2 text-xl font-bold">
                        {item.data ?? ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ─── SECTION 2 ─── */}
            <div className="mt-4">
              <h2 className="mb-1 text-2xl font-bold">
                ส่วนที่ 2 ของผู้ติดตั้ง สับเปลี่ยน รื้อถอน ต่อกลับ ตัดฝาก (ผมต.)
              </h2>
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="w-[40px] border border-black bg-gray-50 px-2 text-center font-bold">
                      ลำดับ
                    </th>
                    <th className="border border-black bg-gray-50 px-2 py-1 text-left font-bold">
                      รายการ
                    </th>
                    <th className="w-[35%] border border-black bg-gray-50 px-2 py-1 text-left font-bold">
                      ข้อมูล
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {section2Items.map((item) => (
                    <tr key={item.no}>
                      <td className="border border-black px-2 text-center text-lg">
                        {item.no}
                      </td>
                      <td className="border border-black px-2 text-xl font-bold">
                        {item.label}
                      </td>
                      <td className="border border-black px-2 py-1 text-lg">
                        {item.data ?? ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ─── Footer signature area ─── */}
            <div className="mt-6 flex justify-between text-sm">
              <div></div>
              <div className="flex gap-4 font-bold text-2xl">
               <div className="text-center ">
                Lat {request?.lat}
                </div>
                <div className="text-center">
                Lon {request?.long}
                </div> 
              </div>
              
              {/* <div className="text-center">
                <div className="mb-8">ลงชื่อ .................................................</div>
                <div>(..................................................)</div>
                <div>ผู้สำรวจ</div>
              </div>
              <div className="text-center">
                <div className="mb-8">ลงชื่อ .................................................</div>
                <div>(..................................................)</div>
                <div>ผู้ติดตั้ง</div>
              </div> */}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
