"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

const PAGE_SIZE = 10;

const REQUEST_STATUSES = [
  "รับเรื่อง",
  "ตรวจสอบข้อมูล",
  "รอนัดหมาย",
  "กำลังดำเนินการ",
  "เสร็จสิ้น",
  "ยกเลิก",
] as const;

type RequestStatus = (typeof REQUEST_STATUSES)[number];

type ElectricalRequest = {
  id: string;
  customerName: string;
  phone: string;
  district: string;
  subDistrict: string;
  requestType: string;
  meterOption: string;
  requestDate: string;
  targetDate: string;
  status: RequestStatus;
};

const INITIAL_REQUESTS: ElectricalRequest[] = [
  {
    id: "REQ-260519-001",
    customerName: "สมชาย ใจดี",
    phone: "081-234-5678",
    district: "เมืองลพบุรี",
    subDistrict: "ทะเลชุบศร",
    requestType: "ขอใช้ไฟใหม่ถาวร",
    meterOption: "15(45)A",
    requestDate: "2026-05-19",
    targetDate: "2026-05-22",
    status: "รับเรื่อง",
  },
  {
    id: "REQ-260519-002",
    customerName: "วรรณา แก้วใส",
    phone: "089-555-1188",
    district: "พัฒนานิคม",
    subDistrict: "ช่องสาริกา",
    requestType: "เพิ่มขนาด",
    meterOption: "5(15)A > 15(45)A",
    requestDate: "2026-05-19",
    targetDate: "2026-05-23",
    status: "ตรวจสอบข้อมูล",
  },
  {
    id: "REQ-260519-003",
    customerName: "อาทิตย์ มีสุข",
    phone: "086-432-1009",
    district: "โคกสำโรง",
    subDistrict: "โคกสำโรง",
    requestType: "ย้าย",
    meterOption: "-",
    requestDate: "2026-05-18",
    targetDate: "2026-05-24",
    status: "รอนัดหมาย",
  },
  {
    id: "REQ-260519-004",
    customerName: "ภัทรา วงศ์ทอง",
    phone: "082-112-6620",
    district: "ชัยบาดาล",
    subDistrict: "ลำนารายณ์",
    requestType: "ขอไฟเกษตร",
    meterOption: "30(100)A",
    requestDate: "2026-05-18",
    targetDate: "2026-05-25",
    status: "กำลังดำเนินการ",
  },
  {
    id: "REQ-260519-005",
    customerName: "ไพโรจน์ ทองดี",
    phone: "080-219-4477",
    district: "บ้านหมี่",
    subDistrict: "สนามแจง",
    requestType: "เปลี่ยนชื่อผู้ใช้ไฟฟ้า",
    meterOption: "-",
    requestDate: "2026-05-17",
    targetDate: "2026-05-21",
    status: "เสร็จสิ้น",
  },
  {
    id: "REQ-260519-006",
    customerName: "กมลชนก พุ่มพวง",
    phone: "087-345-9090",
    district: "ท่าวุ้ง",
    subDistrict: "บางคู้",
    requestType: "คำร้องตรวจสอบ",
    meterOption: "-",
    requestDate: "2026-05-17",
    targetDate: "2026-05-22",
    status: "รับเรื่อง",
  },
  {
    id: "REQ-260519-007",
    customerName: "ณัฐพล จันทร์เพ็ญ",
    phone: "084-678-2210",
    district: "สระโบสถ์",
    subDistrict: "นิยมชัย",
    requestType: "ขอขยายเขต",
    meterOption: "-",
    requestDate: "2026-05-16",
    targetDate: "2026-05-26",
    status: "ตรวจสอบข้อมูล",
  },
  {
    id: "REQ-260519-008",
    customerName: "ศิริพร นาคเกิด",
    phone: "099-101-4567",
    district: "ลำสนธิ",
    subDistrict: "เขารวก",
    requestType: "ขอใช้ไฟชั่วคราว",
    meterOption: "15(45)A",
    requestDate: "2026-05-16",
    targetDate: "2026-05-20",
    status: "รอนัดหมาย",
  },
  {
    id: "REQ-260519-009",
    customerName: "พิชัย กลิ่นหอม",
    phone: "091-334-7788",
    district: "หนองม่วง",
    subDistrict: "หนองม่วง",
    requestType: "เปลี่ยนเป็น TOU",
    meterOption: "TOU 30(100)A",
    requestDate: "2026-05-15",
    targetDate: "2026-05-21",
    status: "กำลังดำเนินการ",
  },
  {
    id: "REQ-260519-010",
    customerName: "รัตนา บุญมี",
    phone: "085-762-3400",
    district: "โคกเจริญ",
    subDistrict: "โคกเจริญ",
    requestType: "คำร้องอื่นๆ",
    meterOption: "-",
    requestDate: "2026-05-15",
    targetDate: "2026-05-19",
    status: "ยกเลิก",
  },
  {
    id: "REQ-260519-011",
    customerName: "สุเมธ แสงทอง",
    phone: "088-267-1919",
    district: "เมืองลพบุรี",
    subDistrict: "กกโก",
    requestType: "ไฟชั่วคราว > ถาวร",
    meterOption: "-",
    requestDate: "2026-05-14",
    targetDate: "2026-05-24",
    status: "รับเรื่อง",
  },
  {
    id: "REQ-260519-012",
    customerName: "ชุติมา รุ่งเรือง",
    phone: "083-444-7821",
    district: "พัฒนานิคม",
    subDistrict: "ดีลัง",
    requestType: "ขอใช้ไฟใหม่ถาวร",
    meterOption: "30(100)A",
    requestDate: "2026-05-14",
    targetDate: "2026-05-27",
    status: "ตรวจสอบข้อมูล",
  },
  {
    id: "REQ-260519-013",
    customerName: "มานพ เจริญผล",
    phone: "081-222-3920",
    district: "ชัยบาดาล",
    subDistrict: "ชัยบาดาล",
    requestType: "ยกเลิก",
    meterOption: "-",
    requestDate: "2026-05-13",
    targetDate: "2026-05-20",
    status: "รอนัดหมาย",
  },
  {
    id: "REQ-260519-014",
    customerName: "ปรียา ชื่นชม",
    phone: "092-718-8801",
    district: "บ้านหมี่",
    subDistrict: "โพนทอง",
    requestType: "ขอไฟเกษตร",
    meterOption: "15A 3P",
    requestDate: "2026-05-13",
    targetDate: "2026-05-28",
    status: "กำลังดำเนินการ",
  },
  {
    id: "REQ-260519-015",
    customerName: "ธนากร ศรีสุข",
    phone: "096-111-7500",
    district: "ท่าวุ้ง",
    subDistrict: "ท่าวุ้ง",
    requestType: "เพิ่มขนาด",
    meterOption: "15(45)A > 30(100)A",
    requestDate: "2026-05-12",
    targetDate: "2026-05-18",
    status: "เสร็จสิ้น",
  },
  {
    id: "REQ-260519-016",
    customerName: "อรทัย บุญช่วย",
    phone: "082-774-5066",
    district: "สระโบสถ์",
    subDistrict: "มหาโพธิ",
    requestType: "คำร้องตรวจสอบ",
    meterOption: "-",
    requestDate: "2026-05-12",
    targetDate: "2026-05-23",
    status: "รับเรื่อง",
  },
  {
    id: "REQ-260519-017",
    customerName: "เกรียงไกร พร้อมใจ",
    phone: "090-555-6688",
    district: "ลำสนธิ",
    subDistrict: "ลำสนธิ",
    requestType: "ขอขยายเขต",
    meterOption: "-",
    requestDate: "2026-05-11",
    targetDate: "2026-05-30",
    status: "ตรวจสอบข้อมูล",
  },
  {
    id: "REQ-260519-018",
    customerName: "มยุรี สีมา",
    phone: "098-442-3100",
    district: "หนองม่วง",
    subDistrict: "ชอนสารเดช",
    requestType: "ขอใช้ไฟชั่วคราว",
    meterOption: "30A 3P",
    requestDate: "2026-05-11",
    targetDate: "2026-05-19",
    status: "รอนัดหมาย",
  },
  {
    id: "REQ-260519-019",
    customerName: "พงศ์เทพ อินทร์แก้ว",
    phone: "081-945-0021",
    district: "โคกสำโรง",
    subDistrict: "เพนียด",
    requestType: "เปลี่ยนเป็น TOU",
    meterOption: "TOU15A 3P",
    requestDate: "2026-05-10",
    targetDate: "2026-05-22",
    status: "กำลังดำเนินการ",
  },
  {
    id: "REQ-260519-020",
    customerName: "วราภรณ์ พิทักษ์",
    phone: "086-210-4545",
    district: "เมืองลพบุรี",
    subDistrict: "เขาสามยอด",
    requestType: "เปลี่ยนชื่อผู้ใช้ไฟฟ้า",
    meterOption: "-",
    requestDate: "2026-05-10",
    targetDate: "2026-05-17",
    status: "เสร็จสิ้น",
  },
  {
    id: "REQ-260519-021",
    customerName: "ชาญชัย แก้วมณี",
    phone: "087-300-9122",
    district: "พัฒนานิคม",
    subDistrict: "มะนาวหวาน",
    requestType: "ขอใช้ไฟใหม่ถาวร",
    meterOption: "15A 3P",
    requestDate: "2026-05-09",
    targetDate: "2026-05-26",
    status: "รับเรื่อง",
  },
  {
    id: "REQ-260519-022",
    customerName: "กาญจนา ปานทอง",
    phone: "093-630-4040",
    district: "ชัยบาดาล",
    subDistrict: "บัวชุม",
    requestType: "คำร้องอื่นๆ",
    meterOption: "-",
    requestDate: "2026-05-09",
    targetDate: "2026-05-19",
    status: "ยกเลิก",
  },
  {
    id: "REQ-260519-023",
    customerName: "ไกรสร ชูศรี",
    phone: "080-654-8899",
    district: "บ้านหมี่",
    subDistrict: "บางกะพี้",
    requestType: "ไฟชั่วคราว > ถาวร",
    meterOption: "-",
    requestDate: "2026-05-08",
    targetDate: "2026-05-21",
    status: "ตรวจสอบข้อมูล",
  },
  {
    id: "REQ-260519-024",
    customerName: "ลลิตา สายทอง",
    phone: "085-120-3211",
    district: "ท่าวุ้ง",
    subDistrict: "บ้านเบิก",
    requestType: "ขอใช้ไฟใหม่ถาวร",
    meterOption: "TOU 15A",
    requestDate: "2026-05-08",
    targetDate: "2026-05-29",
    status: "รอนัดหมาย",
  },
];

const statusStyles: Record<RequestStatus, string> = {
  รับเรื่อง: "border-sky-200 bg-sky-50 text-sky-700",
  ตรวจสอบข้อมูล: "border-amber-200 bg-amber-50 text-amber-700",
  รอนัดหมาย: "border-violet-200 bg-violet-50 text-violet-700",
  กำลังดำเนินการ: "border-blue-200 bg-blue-50 text-blue-700",
  เสร็จสิ้น: "border-emerald-200 bg-emerald-50 text-emerald-700",
  ยกเลิก: "border-rose-200 bg-rose-50 text-rose-700",
};

function formatThaiDate(value: string) {
  return new Intl.DateTimeFormat("th-TH", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00+07:00`));
}

export default function RequestsList() {
  const [requests, setRequests] = useState(INITIAL_REQUESTS);
  const [currentPage, setCurrentPage] = useState(1);
  const [openRequestId, setOpenRequestId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const totalPages = Math.max(1, Math.ceil(requests.length / PAGE_SIZE));
  const startItem = (currentPage - 1) * PAGE_SIZE + 1;
  const endItem = Math.min(currentPage * PAGE_SIZE, requests.length);

  const currentRequests = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return requests.slice(start, start + PAGE_SIZE);
  }, [currentPage, requests]);

  function updateStatus(requestId: string, status: RequestStatus) {
    setRequests((prevRequests) =>
      prevRequests.map((request) =>
        request.id === requestId ? { ...request, status } : request,
      ),
    );
    setOpenRequestId(null);
    setMessage(`เปลี่ยนสถานะ ${requestId} เป็น "${status}" แล้ว`);
  }

  function goToPage(page: number) {
    setCurrentPage(Math.min(Math.max(page, 1), totalPages));
    setOpenRequestId(null);
  }

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-4 text-slate-950 sm:px-6 sm:py-8 lg:px-8">
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-5">
        <header className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white px-4 py-5 shadow-sm sm:flex-row sm:items-end sm:justify-between sm:px-6">
          <div>
            <p className="text-sm font-medium text-teal-700">ระบบรับคำร้อง</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-950 sm:text-3xl">
              คำร้องทั้งหมด
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              แสดงครั้งละ {PAGE_SIZE} รายการ พร้อมปุ่มเปลี่ยนสถานะของแต่ละคำร้อง
            </p>
          </div>
          <Link
            href="/requests/new"
            className="inline-flex h-11 items-center justify-center rounded-lg bg-teal-700 px-4 text-sm font-semibold text-white transition hover:bg-teal-800 focus:outline-none focus:ring-4 focus:ring-teal-100"
          >
            เพิ่มคำร้องใหม่
          </Link>
        </header>

        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-2 border-b border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <h2 className="text-base font-semibold text-slate-950">รายการคำร้อง</h2>
              <p className="text-sm text-slate-500">
                รายการที่ {startItem}-{endItem} จากทั้งหมด {requests.length} รายการ
              </p>
            </div>
            <p className="min-h-5 text-sm font-medium text-teal-700" aria-live="polite">
              {message}
            </p>
          </div>

          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[1080px] border-collapse text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">เลขคำร้อง</th>
                  <th className="px-4 py-3 font-semibold">ผู้ยื่นคำร้อง</th>
                  <th className="px-4 py-3 font-semibold">พื้นที่</th>
                  <th className="px-4 py-3 font-semibold">ประเภท</th>
                  <th className="px-4 py-3 font-semibold">วันที่รับ</th>
                  <th className="px-4 py-3 font-semibold">วันนัด</th>
                  <th className="px-4 py-3 font-semibold">สถานะ</th>
                  <th className="px-4 py-3 text-right font-semibold">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {currentRequests.map((request) => (
                  <tr key={request.id} className="align-top transition hover:bg-slate-50">
                    <td className="px-4 py-4 font-semibold text-slate-950">{request.id}</td>
                    <td className="px-4 py-4">
                      <div className="font-medium text-slate-950">{request.customerName}</div>
                      <div className="mt-1 text-slate-500">{request.phone}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div>{request.district}</div>
                      <div className="mt-1 text-slate-500">{request.subDistrict}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div>{request.requestType}</div>
                      <div className="mt-1 text-slate-500">{request.meterOption}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {formatThaiDate(request.requestDate)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {formatThaiDate(request.targetDate)}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusStyles[request.status]}`}
                      >
                        {request.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="relative inline-block">
                        <button
                          type="button"
                          onClick={() =>
                            setOpenRequestId((currentId) =>
                              currentId === request.id ? null : request.id,
                            )
                          }
                          className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:border-teal-600 hover:text-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-100"
                        >
                          เปลี่ยนสถานะ
                        </button>
                        {openRequestId === request.id && (
                          <div className="absolute right-0 z-10 mt-2 w-48 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 text-left shadow-lg">
                            {REQUEST_STATUSES.map((status) => (
                              <button
                                key={status}
                                type="button"
                                onClick={() => updateStatus(request.id, status)}
                                className="block w-full px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-100 disabled:cursor-default disabled:bg-white disabled:font-semibold disabled:text-teal-700"
                                disabled={request.status === status}
                              >
                                {status}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="divide-y divide-slate-200 lg:hidden">
            {currentRequests.map((request) => (
              <article key={request.id} className="px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold text-slate-950">{request.id}</h2>
                    <p className="mt-1 text-sm text-slate-600">{request.customerName}</p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${statusStyles[request.status]}`}
                  >
                    {request.status}
                  </span>
                </div>

                <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-slate-500">เบอร์โทร</dt>
                    <dd className="font-medium text-slate-900">{request.phone}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">พื้นที่</dt>
                    <dd className="font-medium text-slate-900">
                      {request.subDistrict}, {request.district}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">ประเภท</dt>
                    <dd className="font-medium text-slate-900">{request.requestType}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">มิเตอร์</dt>
                    <dd className="font-medium text-slate-900">{request.meterOption}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">วันที่รับ</dt>
                    <dd className="font-medium text-slate-900">
                      {formatThaiDate(request.requestDate)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">วันนัด</dt>
                    <dd className="font-medium text-slate-900">
                      {formatThaiDate(request.targetDate)}
                    </dd>
                  </div>
                </dl>

                <div className="relative mt-4">
                  <button
                    type="button"
                    onClick={() =>
                      setOpenRequestId((currentId) =>
                        currentId === request.id ? null : request.id,
                      )
                    }
                    className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:border-teal-600 hover:text-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-100"
                  >
                    เปลี่ยนสถานะ
                  </button>
                  {openRequestId === request.id && (
                    <div className="absolute left-0 right-0 z-10 mt-2 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                      {REQUEST_STATUSES.map((status) => (
                        <button
                          key={status}
                          type="button"
                          onClick={() => updateStatus(request.id, status)}
                          className="block w-full px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-100 disabled:cursor-default disabled:bg-white disabled:font-semibold disabled:text-teal-700"
                          disabled={request.status === status}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="text-sm text-slate-500">
              หน้า {currentPage} จาก {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:border-teal-600 hover:text-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                ก่อนหน้า
              </button>
              {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => goToPage(page)}
                  aria-current={currentPage === page ? "page" : undefined}
                  className={`h-10 min-w-10 rounded-lg border px-3 text-sm font-semibold transition focus:outline-none focus:ring-4 focus:ring-teal-100 ${
                    currentPage === page
                      ? "border-teal-700 bg-teal-700 text-white"
                      : "border-slate-300 bg-white text-slate-700 hover:border-teal-600 hover:text-teal-700"
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                type="button"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:border-teal-600 hover:text-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                ถัดไป
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
