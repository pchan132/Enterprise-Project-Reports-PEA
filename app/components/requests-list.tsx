"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import RequestSearchForm from "@/app/components/request-search-form";
import {
  REQUEST_STATUSES,
  type ApiErrorResponse,
  type ElectricalRequestDto,
  type ElectricalRequestsListResponse,
  type RequestStatus,
} from "@/app/lib/electrical-request-types";

const PAGE_SIZE = 10;

type FilterValues = {
  firstName: string;
  lastName: string;
  phone: string;
  status: string;
  address: string;
  subDistrict: string;
  district: string;
  province: string;
  lat: string;
  long: string;
  requestDate: string;
  requestType: string[];
  meterOption: string;
  caRefNo: string;
  peaNo: string;
  targetDate: string;
  isFollowUp: string;
  description: string;
};

type StatusTransition = {
  /** สถานะปัจจุบันของแถว */
  from: string;
  /** สถานะที่เลือกได้ใน dropdown ของแถวนั้น */
  choices: string[];
};

type RequestsListProps = {
  title?: string;
  description?: string;
  /** กรองเฉพาะสถานะเหล่านี้ (ถ้าไม่ระบุ = แสดงทุกสถานะ) */
  fixedStatuses?: string[];
  /** กรองเฉพาะประเภทคำร้องเหล่านี้ (ถ้าไม่ระบุ = แสดงทุกประเภท) */
  fixedRequestTypes?: string[];
  showAddButton?: boolean;
  emptyMessage?: string;
  /**
   * กฎการเปลี่ยนสถานะ — ส่งเป็น plain data เพื่อรองรับ Server Component
   * แต่ละรายการระบุว่าเมื่อสถานะปัจจุบันเป็น `from` ให้แสดงตัวเลือก `choices`
   * ถ้าไม่ระบุ = แสดงสถานะทั้งหมดตามค่าเริ่มต้น
   */
  statusTransitions?: StatusTransition[];
};

const statusStyles: Record<RequestStatus, string> = {
  รับเรื่อง: "border-sky-200 bg-sky-50 text-sky-700",
  หาเอกสารเพิ่มเติม: "border-cyan-200 bg-cyan-50 text-cyan-700",
  รอตรวจสอบคำร้อง: "border-amber-200 bg-amber-50 text-amber-700",
  ตรวจไม่ผ่าน: "border-rose-200 bg-rose-50 text-rose-700",
  รอโทรแจ้ง: "border-orange-200 bg-orange-50 text-orange-700",
  รอทำชำระเงิน: "border-yellow-200 bg-yellow-50 text-yellow-700",
  "รอติดตั้งมิเตอร์ / ดำเนินการเพิ่ม / ย้าย": "border-violet-200 bg-violet-50 text-violet-700",
  "กำลังดำเนินการ หน้างาน": "border-blue-200 bg-blue-50 text-blue-700",
  เสร็จสิ้น: "border-emerald-200 bg-emerald-50 text-emerald-700",
  ยกเลิก: "border-slate-200 bg-slate-50 text-slate-700",
};

function getStatusClass(status: string) {
  return REQUEST_STATUSES.includes(status as RequestStatus)
    ? statusStyles[status as RequestStatus]
    : "border-slate-200 bg-slate-50 text-slate-700";
}

function formatThaiDate(value: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("th-TH", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00+07:00`));
}

function displayRequestNo(request: ElectricalRequestDto) {
  return request.requestNo ?? request.id;
}

function displayCustomerName(request: ElectricalRequestDto) {
  return `${request.firstName} ${request.lastName}`;
}

function getStatusOptions(currentStatus: string) {
  return REQUEST_STATUSES.includes(currentStatus as RequestStatus)
    ? REQUEST_STATUSES
    : [currentStatus, ...REQUEST_STATUSES];
}

/** ตัดข้อความให้ไม่เกิน maxWords คำ — ถ้ายาวกว่าจะต่อท้ายด้วย "…" */
function truncateWords(text: string | null | undefined, maxWords = 10): string {
  if (!text) return "-";
  const words = text.split(/\s+/);
  if (words.length <= maxWords) return text;
  return words.slice(0, maxWords).join(" ") + "…";
}

export default function RequestsList({
  title = "คำร้องทั้งหมด",
  description = "แสดงข้อมูลจาก backend โดยกดที่ชื่อหรือเลขคำร้องเพื่อดูรายละเอียดทั้งหมด",
  fixedStatuses,
  fixedRequestTypes,
  showAddButton = true,
  emptyMessage = "ยังไม่มีข้อมูลคำร้อง",
  statusTransitions,
}: RequestsListProps) {
  // สร้าง Map { สถานะปัจจุบัน → ตัวเลือกที่แสดง } จาก statusTransitions prop
  const transitionMap = new Map(
    statusTransitions?.map(({ from, choices }) => [from, choices]),
  );

  // ฟังก์ชันที่ใช้จริงใน dropdown — ใช้ transitionMap ถ้ามี, ไม่งั้นใช้ default
  function resolveStatusChoices(currentStatus: string) {
    return transitionMap.get(currentStatus) ?? getStatusOptions(currentStatus);
  }
  const [requests, setRequests] = useState<ElectricalRequestDto[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState<FilterValues>({
    firstName: "",
    lastName: "",
    phone: "",
    status: "",
    address: "",
    subDistrict: "",
    district: "",
    province: "ลพบุรี",
    lat: "",
    long: "",
    requestDate: "",
    requestType: [],
    meterOption: "",
    caRefNo: "",
    peaNo: "",
    targetDate: "",
    isFollowUp: "",
    description: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const endItem = Math.min(currentPage * PAGE_SIZE, totalItems);

  const pageButtons = useMemo(
    () => Array.from({ length: totalPages }, (_, index) => index + 1),
    [totalPages],
  );

  // Real-time search สำหรับ ชื่อ, นามสกุล, อำเภอ, ตำบล พร้อม debounce 300ms
  function handleRealtimeSearch(
    firstName: string,
    lastName: string,
    district: string,
    subDistrict: string,
  ) {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      setFilters((prev) => ({
        ...prev,
        firstName,
        lastName,
        district,
        subDistrict,
      }));
      setCurrentPage(1);
    }, 300);
  }

  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    let ignore = false;

    async function loadRequests() {
      setLoading(true);
      setError("");

      try {
        const searchParams = new URLSearchParams({
          page: String(currentPage),
          pageSize: String(PAGE_SIZE),
        });

        // Add all non-empty filters to search params
        if (filters.firstName) searchParams.set("firstName", filters.firstName);
        if (filters.lastName) searchParams.set("lastName", filters.lastName);
        if (filters.phone) searchParams.set("phone", filters.phone);
        if (filters.status) searchParams.set("status", filters.status);
        if (filters.address) searchParams.set("address", filters.address);
        if (filters.subDistrict) searchParams.set("subDistrict", filters.subDistrict);
        if (filters.district) searchParams.set("district", filters.district);
        if (filters.province) searchParams.set("province", filters.province);
        if (filters.lat) searchParams.set("lat", filters.lat);
        if (filters.long) searchParams.set("long", filters.long);
        if (filters.requestDate) searchParams.set("requestDate", filters.requestDate);
        // ส่ง requestType หลายค่า (ถ้าเลือกไว้)
        for (const rt of filters.requestType) {
          searchParams.append("requestType", rt);
        }
        if (filters.meterOption) searchParams.set("meterOption", filters.meterOption);
        if (filters.caRefNo) searchParams.set("caRefNo", filters.caRefNo);
        if (filters.peaNo) searchParams.set("peaNo", filters.peaNo);
        if (filters.targetDate) searchParams.set("targetDate", filters.targetDate);
        if (filters.isFollowUp) searchParams.set("isFollowUp", filters.isFollowUp);
        if (filters.description) searchParams.set("description", filters.description);

        if (fixedStatuses && fixedStatuses.length > 0) {
          // ส่งหลาย status (backend รองรับ ?status=A&status=B)
          for (const s of fixedStatuses) {
            searchParams.append("status", s);
          }
        }

        if (fixedRequestTypes && fixedRequestTypes.length > 0) {
          // ส่งหลาย requestType (backend รองรับ ?requestType=A&requestType=B)
          for (const rt of fixedRequestTypes) {
            searchParams.append("requestType", rt);
          }
        }

        const response = await fetch(`/api?${searchParams.toString()}`, {
          cache: "no-store",
        });
        const payload = (await response.json()) as ElectricalRequestsListResponse &
          ApiErrorResponse;

        if (!response.ok) {
          throw new Error(payload.error ?? "โหลดรายการคำร้องไม่สำเร็จ");
        }

        if (!ignore) {
          setRequests(payload.data);
          setTotalItems(payload.meta.total);
          setTotalPages(payload.meta.totalPages);
        }
      } catch (err) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : "โหลดรายการคำร้องไม่สำเร็จ");
          setRequests([]);
          setTotalItems(0);
          setTotalPages(1);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadRequests();

    return () => {
      ignore = true;
    };
  }, [currentPage, fixedStatuses, fixedRequestTypes, filters]);

  async function updateStatus(request: ElectricalRequestDto, status: RequestStatus) {
    setMessage("");
    setError("");

    try {
      const response = await fetch(`/api/${encodeURIComponent(request.id)}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });
      const payload = (await response.json()) as { data?: ElectricalRequestDto } &
        ApiErrorResponse;

      if (!response.ok || !payload.data) {
        throw new Error(payload.errors?.join(", ") ?? payload.error ?? "เปลี่ยนสถานะไม่สำเร็จ");
      }

      setRequests((prevRequests) =>
        prevRequests
          .map((item) => (item.id === request.id ? payload.data! : item))
          .filter(
            (item) =>
              !fixedStatuses ||
              fixedStatuses.length === 0 ||
              fixedStatuses.includes(item.status),
          ),
      );
      if (
        fixedStatuses &&
        fixedStatuses.length > 0 &&
        !fixedStatuses.includes(status)
      ) {
        setTotalItems((current) => Math.max(0, current - 1));
      }
      setMessage(`เปลี่ยนสถานะ ${displayRequestNo(request)} เป็น "${status}" แล้ว`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "เปลี่ยนสถานะไม่สำเร็จ");
    }
  }

  function goToPage(page: number) {
    setCurrentPage(Math.min(Math.max(page, 1), totalPages));
    setMessage("");
  }

  function handleApplyFilters(newFilters: FilterValues) {
    setFilters(newFilters);
    setCurrentPage(1);
    setMessage("");
  }

  function handleClearFilters() {
    setFilters({
      firstName: "",
      lastName: "",
      phone: "",
      status: "",
      address: "",
      subDistrict: "",
      district: "",
      province: "ลพบุรี",
      lat: "",
      long: "",
      requestDate: "",
      requestType: [],
      meterOption: "",
      caRefNo: "",
      peaNo: "",
      targetDate: "",
      isFollowUp: "",
      description: "",
    });
    setCurrentPage(1);
    setMessage("");
  }

  return (
    <div className="min-h-screen bg-transparent px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header className="flex flex-col gap-4 rounded-3xl border border-white/60 bg-white/70 px-6 py-8 shadow-xl shadow-teal-900/5 backdrop-blur-xl sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-teal-700">ระบบรับคำร้อง</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-950 sm:text-3xl">
              {title}
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              {description}
            </p>
          </div>
          {showAddButton && (
            <Link
              href="/requests/new"
              className="inline-flex h-12 items-center justify-center rounded-xl bg-teal-700 px-6 text-base font-bold text-white shadow-sm transition hover:bg-teal-800 focus:outline-none focus:ring-4 focus:ring-teal-100"
            >
              + เพิ่มคำร้องใหม่
            </Link>
          )}
        </header>

        <section className="overflow-hidden rounded-3xl border border-white/60 bg-white/80 shadow-xl shadow-teal-900/5 backdrop-blur-xl">
          <div className="flex flex-col gap-2 border-b border-slate-200/60 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">รายการคำร้อง</h2>
              <p className="text-sm text-slate-500">
                รายการที่ {startItem}-{endItem} จากทั้งหมด {totalItems} รายการ
              </p>
            </div>
            <p className="min-h-5 text-sm font-medium text-teal-700" aria-live="polite">
              {message}
            </p>
          </div>

          <div className="border-b border-slate-200 px-4 py-4 sm:px-6">
            <RequestSearchForm
              onApplyFilters={handleApplyFilters}
              onRealtimeSearch={handleRealtimeSearch}
              onClear={handleClearFilters}
            />
            {(filters.requestType.length > 0 || Object.entries(filters).some(([key, v]) => key !== "requestType" && v && v !== "ลพบุรี")) && (
              <p className="mt-4 text-sm text-slate-500">
                มีการใช้ตัวกรอง{" "}
                {filters.requestType.length +
                  Object.entries(filters).filter(
                    ([key, v]) => key !== "requestType" && v && v !== "ลพบุรี",
                  ).length}{" "}
                รายการ
              </p>
            )}
          </div>

          {error && (
            <div className="border-b border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 sm:px-6">
              {error}
            </div>
          )}

          {loading ? (
            <div className="px-4 py-10 text-center text-sm text-slate-500">
              กำลังโหลดรายการคำร้อง...
            </div>
          ) : requests.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-slate-500">
              {(filters.requestType.length > 0 || Object.entries(filters).some(([key, v]) => key !== "requestType" && v && v !== "ลพบุรี"))
                ? "ไม่พบข้อมูลที่ตรงกับตัวกรอง"
                : emptyMessage}
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full border-collapse text-left text-sm">
                  <thead className="bg-slate-100 text-sm uppercase tracking-wider text-slate-600">
                    <tr>
                      <th className="px-5 py-4 font-bold">เลขคำร้อง</th>
                      <th className="px-5 py-4 font-bold">ผู้ยื่นคำร้อง</th>
                      <th className="px-5 py-4 font-bold">พื้นที่</th>
                      <th className="px-5 py-4 font-bold">ประเภท</th>
                      <th className="px-5 py-4 font-bold">รายละเอียด</th>
                      <th className="px-5 py-4 font-bold">วันที่รับ</th>
                      <th className="px-5 py-4 font-bold">วันนัด</th>
                      <th className="px-5 py-4 font-bold">สถานะ</th>
                      <th className="px-5 py-4 text-right font-bold">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {requests.map((request) => (
                      <tr key={request.id} className="align-top text-base transition hover:bg-slate-50/80">
                        <td className="px-5 py-5 font-bold text-teal-800">
                          <Link href={`/requests/${request.id}`} className="hover:text-teal-600 underline-offset-4 hover:underline">
                            {displayRequestNo(request)}
                          </Link>
                        </td>
                        <td className="px-5 py-5">
                          <Link
                            href={`/requests/${request.id}`}
                            className="font-bold text-slate-900 hover:text-teal-700"
                          >
                            {displayCustomerName(request)}
                          </Link>
                          <div className="mt-1 text-sm text-slate-500">{request.phone}</div>
                        </td>
                        <td className="px-5 py-5">
                          <div className="font-medium text-slate-800">{request.district}</div>
                          <div className="mt-1 text-sm text-slate-500">{request.subDistrict}</div>
                        </td>
                        <td className="px-5 py-5">
                          <div className="font-medium text-slate-800">{Array.isArray(request.requestType) ? request.requestType.join(", ") : request.requestType}</div>
                          <div className="mt-1 text-sm text-slate-500">{request.meterOption ?? "-"}</div>
                        </td>
                        <td className="px-5 py-5 max-w-[240px]">
                          <div className="text-slate-600 text-sm leading-relaxed" title={request.description ?? ""}>
                            {truncateWords(request.description, 10)}
                          </div>
                        </td>
                        <td className="px-5 py-5 whitespace-nowrap font-medium text-slate-700">
                          {formatThaiDate(request.requestDate)}
                        </td>
                        <td className="px-5 py-5 whitespace-nowrap font-medium text-slate-700">
                          {formatThaiDate(request.targetDate)}
                        </td>
                        <td className="px-5 py-5">
                          <span
                            className={`inline-flex rounded-full border px-3 py-1.5 text-sm font-bold shadow-sm ${getStatusClass(request.status)}`}
                          >
                            {request.status}
                          </span>
                        </td>
                        <td className="px-5 py-5 text-right">
                          <div className="inline-flex items-center gap-2">
                            <Link
                              href={`/requests/${request.id}/edit`}
                              className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm transition hover:border-teal-600 hover:text-teal-700 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-teal-100"
                            >
                              แก้ไข
                            </Link>
                            <select
                              value={request.status}
                              onChange={(event) =>
                                updateStatus(request, event.target.value as RequestStatus)
                              }
                              className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm font-bold text-slate-700 shadow-sm outline-none transition hover:border-teal-600 focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
                              aria-label={`เปลี่ยนสถานะ ${displayRequestNo(request)}`}
                            >
                              {resolveStatusChoices(request.status).map((status) => (
                                <option key={status} value={status}>
                                  {status}
                                </option>
                              ))}
                            </select>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col gap-5 bg-transparent p-4 sm:p-6 lg:hidden">
                {requests.map((request) => (
                  <article key={request.id} className="rounded-3xl border border-white bg-white p-6 shadow-lg shadow-teal-900/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-teal-900/10">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <Link
                          href={`/requests/${request.id}`}
                          className="text-lg font-bold text-teal-800 hover:text-teal-600 underline-offset-4 hover:underline"
                        >
                          {displayRequestNo(request)}
                        </Link>
                        <Link
                          href={`/requests/${request.id}`}
                          className="mt-1 block text-base font-semibold text-slate-900 hover:text-teal-700"
                        >
                          {displayCustomerName(request)}
                        </Link>
                      </div>
                      <span
                        className={`inline-flex w-fit items-center rounded-full border px-4 py-1.5 text-sm font-bold shadow-sm ${getStatusClass(request.status)}`}
                      >
                        {request.status}
                      </span>
                    </div>

                    <dl className="mt-5 grid gap-4 text-base sm:grid-cols-2">
                      <div className="rounded-lg bg-slate-50 p-3">
                        <dt className="text-sm font-medium text-slate-500">เบอร์โทร</dt>
                        <dd className="mt-1 text-lg font-bold text-blue-600">
                          <a href={`tel:${request.phone}`} className="flex items-center gap-2">
                            📞 {request.phone}
                          </a>
                        </dd>
                      </div>
                      <div className="rounded-lg bg-slate-50 p-3">
                        <dt className="text-sm font-medium text-slate-500">พื้นที่</dt>
                        <dd className="mt-1 font-semibold text-slate-900">
                          {request.subDistrict}, {request.district}
                        </dd>
                      </div>
                      <div className="rounded-lg bg-slate-50 p-3">
                        <dt className="text-sm font-medium text-slate-500">ประเภท</dt>
                        <dd className="mt-1 font-semibold text-slate-900">{Array.isArray(request.requestType) ? request.requestType.join(", ") : request.requestType}</dd>
                      </div>
                      <div className="rounded-lg bg-slate-50 p-3">
                        <dt className="text-sm font-medium text-slate-500">มิเตอร์</dt>
                        <dd className="mt-1 font-semibold text-slate-900">
                          {request.meterOption ?? "-"}
                        </dd>
                      </div>
                      <div className="rounded-lg bg-slate-50 p-3 sm:col-span-2">
                        <dt className="text-sm font-medium text-slate-500">รายละเอียด</dt>
                        <dd className="mt-1 font-medium text-slate-700">
                          {truncateWords(request.description, 15)}
                        </dd>
                      </div>
                      <div className="flex gap-4 sm:col-span-2">
                        <div className="flex-1 rounded-lg bg-slate-50 p-3">
                          <dt className="text-sm font-medium text-slate-500">วันที่รับ</dt>
                          <dd className="mt-1 font-semibold text-slate-900">
                            {formatThaiDate(request.requestDate)}
                          </dd>
                        </div>
                        <div className="flex-1 rounded-lg bg-slate-50 p-3">
                          <dt className="text-sm font-medium text-slate-500">วันนัด</dt>
                          <dd className="mt-1 font-semibold text-slate-900">
                            {formatThaiDate(request.targetDate)}
                          </dd>
                        </div>
                      </div>
                    </dl>

                    <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                      <select
                        value={request.status}
                        onChange={(event) =>
                          updateStatus(request, event.target.value as RequestStatus)
                        }
                        className="h-12 w-full flex-1 rounded-xl border border-slate-300 bg-white px-4 text-base font-bold text-slate-800 shadow-sm outline-none transition hover:border-teal-600 focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
                        aria-label={`เปลี่ยนสถานะ ${displayRequestNo(request)}`}
                      >
                        {resolveStatusChoices(request.status).map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                      <Link
                        href={`/requests/${request.id}/edit`}
                        className="inline-flex h-12 flex-1 items-center justify-center rounded-xl border border-slate-300 bg-slate-100 px-4 text-base font-bold text-slate-700 shadow-sm transition hover:border-teal-600 hover:bg-white hover:text-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-100"
                      >
                        ✏️ แก้ไข
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}

          <div className="flex flex-col gap-4 border-t border-slate-200/60 px-6 py-6 sm:flex-row sm:items-center sm:justify-between bg-white/50">
            <p className="text-base font-medium text-slate-600">
              หน้า {currentPage} จาก {totalPages}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="h-12 rounded-xl border border-slate-300 bg-white px-4 text-base font-bold text-slate-700 shadow-sm transition hover:border-teal-600 hover:text-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                ก่อนหน้า
              </button>
              {pageButtons.map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => goToPage(page)}
                  aria-current={currentPage === page ? "page" : undefined}
                  className={`h-12 min-w-[3rem] rounded-xl border px-3 text-base font-bold shadow-sm transition focus:outline-none focus:ring-4 focus:ring-teal-100 ${currentPage === page
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
                className="h-12 rounded-xl border border-slate-300 bg-white px-4 text-base font-bold text-slate-700 shadow-sm transition hover:border-teal-600 hover:text-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-100 disabled:cursor-not-allowed disabled:opacity-50"
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
