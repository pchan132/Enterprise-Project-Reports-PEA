"use client";

import { useRef, useState } from "react";
import type { ElectricalRequestDto } from "@/app/lib/electrical-request-types";

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

  const [savingPdf, setSavingPdf] = useState(false);

  function handlePrint() {
    const printArea = printAreaRef.current;
    if (!printArea) return;

    // รวบรวม <link rel="stylesheet"> จากหน้าปัจจุบัน
    const linkTags = Array.from(
      document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')
    )
      .map((l) => `<link rel="stylesheet" href="${l.href}" />`)
      .join("\n");

    // รวบรวม <style> inline จากหน้าปัจจุบัน (Next.js inject ไว้)
    const styleTags = Array.from(document.querySelectorAll("style"))
      .map((s) => `<style>${s.innerHTML}</style>`)
      .join("\n");

    const htmlContent = `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>WMSF01 Preview</title>
  ${linkTags}
  ${styleTags}
  <style>
    body {
      margin: 0;
      padding: 16px;
      background: #f1f5f9;
      font-family: 'TH Sarabun New', 'Sarabun', 'Tahoma', sans-serif;
    }
    @media print {
      body { background: white; padding: 0; }
      .print-hide { display: none !important; }
    }
  </style>
</head>
<body>
  ${printArea.outerHTML}
</body>
</html>`;

    const popup = window.open("", "_blank", "width=900,height=1050,scrollbars=yes,resizable=yes");
    if (!popup) {
      // fallback: print หน้าปัจจุบันถ้า popup ถูกบล็อก
      window.print();
      return;
    }
    popup.document.open();
    popup.document.write(htmlContent);
    popup.document.close();
    popup.focus();
    // รอ CSS โหลดแล้วค่อยเปิด print dialog
    popup.addEventListener("load", () => {
      setTimeout(() => popup.print(), 300);
    });
  }

  async function handleSavePdf() {
    if (!printAreaRef.current) return;
    setSavingPdf(true);
    try {
      const { toCanvas } = await import("html-to-image");
      const { jsPDF } = await import("jspdf");

      // ถ่ายภาพจาก DOM โดยตรง จะได้ฟอนต์ภาษาไทยและรูปแบบเหมือนที่เห็น 100%
      const canvas = await toCanvas(printAreaRef.current, {
        pixelRatio: 2, // เพิ่มความละเอียดภาพ
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageHeight = pdf.internal.pageSize.getHeight();
      let pdfWidth = pdf.internal.pageSize.getWidth();
      let pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      // ถ้าความสูงเกิน 1 หน้า (A4) ให้ย่อสเกลลงมาให้พอดี
      if (pdfHeight > pageHeight) {
        pdfHeight = pageHeight;
        pdfWidth = (canvas.width * pdfHeight) / canvas.height;
      }
      
      const xOffset = (pdf.internal.pageSize.getWidth() - pdfWidth) / 2;
      const yOffset = 0; // หรือถ้าจะให้อยู่ตรงกลางแนวตั้ง: (pageHeight - pdfHeight) / 2

      pdf.addImage(imgData, "PNG", xOffset, yOffset, pdfWidth, pdfHeight);

      const filename = request?.requestNo
        ? `WMSF01-${request.requestNo}.pdf`
        : request?.id
          ? `WMSF01-${request.id.slice(0, 8)}.pdf`
          : "WMSF01.pdf";
          
      pdf.save(filename);
    } catch (err) {
      console.error("PDF generation failed", err);
      alert("ไม่สามารถสร้าง PDF ได้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setSavingPdf(false);
    }
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
          {/* ── Print button ── */}
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-400/50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path fillRule="evenodd" d="M5 2.75C5 1.784 5.784 1 6.75 1h6.5c.966 0 1.75.784 1.75 1.75v3.552c.377.046.752.097 1.126.153A2.212 2.212 0 0 1 18 8.653v4.097A2.25 2.25 0 0 1 15.75 15h-.75v.75c0 .966-.784 1.75-1.75 1.75h-6.5A1.75 1.75 0 0 1 5 15.75V15h-.75A2.25 2.25 0 0 1 2 12.75V8.653c0-1.082.775-2.034 1.874-2.198.374-.056.75-.107 1.126-.153V2.75ZM6.5 15v.75c0 .138.112.25.25.25h6.5a.25.25 0 0 0 .25-.25V15h-7Zm7-11.25v3.372a40.739 40.739 0 0 0-7 0V3.75h-.002V2.75a.25.25 0 0 1 .25-.25h6.5a.25.25 0 0 1 .25.25v1Zm.497 6a.75.75 0 0 1 .75-.75h.5a.75.75 0 0 1 0 1.5h-.5a.75.75 0 0 1-.75-.75Z" clipRule="evenodd" />
            </svg>
            พิมพ์ฟอร์ม / Print
          </button>

          {/* ── Save PDF button ── */}
          <button
            type="button"
            onClick={handleSavePdf}
            disabled={savingPdf}
            className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-400/50 disabled:cursor-wait disabled:opacity-60"
          >
            {savingPdf ? (
              <>
                <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                กำลังสร้าง PDF...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                  <path d="M10.75 2.75a.75.75 0 0 0-1.5 0v8.614L6.295 8.235a.75.75 0 1 0-1.09 1.03l4.25 4.5a.75.75 0 0 0 1.09 0l4.25-4.5a.75.75 0 0 0-1.09-1.03l-2.955 3.129V2.75Z" />
                  <path d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z" />
                </svg>
                บันทึก PDF
              </>
            )}
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
            className="wmsf01-page relative w-[210mm] max-w-[210mm] min-h-[297mm] bg-white text-black px-[12mm] py-[8mm] shadow-2xl print:shadow-none print:px-0 print:py-0 overflow-hidden"
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
              </div>
              <div className="flex flex-wrap"> 
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
                  <span className="flex-1 border-b border-dotted border-black min-h-[1.2em] px-1 font-bold text-lg">
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
              <h2 className="mb-1 text-xl font-bold">
                ส่วนที่ 1 ของผู้สำรวจ (ผบค.)
              </h2>
              <table className="w-full border-collapse text-lg">
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
                      <td className="border border-black px-2 py-0.5 text-lg font-bold leading-tight">
                        {item.label}
                      </td>
                      <td className="border border-black px-2 py-0.5 text-lg font-bold leading-tight">
                        {item.data ?? ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ─── SECTION 2 ─── */}
            <div className="mt-4">
              <h2 className="mb-1 text-xl font-bold">
                ส่วนที่ 2 ของผู้ติดตั้ง สับเปลี่ยน รื้อถอน ต่อกลับ ตัดฝาก (ผมต.)
              </h2>
              <table className="w-full border-collapse text-lg">
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
                      <td className="border border-black px-2 py-0.5 text-center text-lg leading-tight">
                        {item.no}
                      </td>
                      <td className="border border-black px-2 py-0.5 text-lg font-bold leading-tight">
                        {item.label}
                      </td>
                      <td className="border border-black px-2 py-0.5 text-lg leading-tight">
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
              <div className="flex gap-4 font-bold text-lg">
               <div className="text-center">
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
