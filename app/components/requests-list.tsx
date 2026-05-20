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

type RequestsListProps = {
  title?: string;
  description?: string;
  fixedStatus?: string;
  showAddButton?: boolean;
  emptyMessage?: string;
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

export default function RequestsList({
  title = "คำร้องทั้งหมด",
  description = "แสดงข้อมูลจาก backend โดยกดที่ชื่อหรือเลขคำร้องเพื่อดูรายละเอียดทั้งหมด",
  fixedStatus,
  showAddButton = true,
  emptyMessage = "ยังไม่มีข้อมูลคำร้อง",
}: RequestsListProps) {
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

        if (fixedStatus) {
          searchParams.set("status", fixedStatus);
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
  }, [currentPage, fixedStatus, filters]);

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
          .filter((item) => !fixedStatus || item.status === fixedStatus),
      );
      if (fixedStatus && status !== fixedStatus) {
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
    <div className="min-h-screen bg-slate-100 px-4 py-4 text-slate-950 sm:px-6 sm:py-8 lg:px-8">
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-5">
        <header className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white px-4 py-5 shadow-sm sm:flex-row sm:items-end sm:justify-between sm:px-6">
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
              className="inline-flex h-11 items-center justify-center rounded-lg bg-teal-700 px-4 text-sm font-semibold text-white transition hover:bg-teal-800 focus:outline-none focus:ring-4 focus:ring-teal-100"
            >
              เพิ่มคำร้องใหม่
            </Link>
          )}
        </header>

        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-2 border-b border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <h2 className="text-base font-semibold text-slate-950">รายการคำร้อง</h2>
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
                    {requests.map((request) => (
                      <tr key={request.id} className="align-top transition hover:bg-slate-50">
                        <td className="px-4 py-4 font-semibold text-slate-950">
                          <Link href={`/requests/${request.id}`} className="hover:text-teal-700">
                            {displayRequestNo(request)}
                          </Link>
                        </td>
                        <td className="px-4 py-4">
                          <Link
                            href={`/requests/${request.id}`}
                            className="font-medium text-slate-950 hover:text-teal-700"
                          >
                            {displayCustomerName(request)}
                          </Link>
                          <div className="mt-1 text-slate-500">{request.phone}</div>
                        </td>
                        <td className="px-4 py-4">
                          <div>{request.district}</div>
                          <div className="mt-1 text-slate-500">{request.subDistrict}</div>
                        </td>
                        <td className="px-4 py-4">
                          <div>{Array.isArray(request.requestType) ? request.requestType.join(", ") : request.requestType}</div>
                          <div className="mt-1 text-slate-500">{request.meterOption ?? "-"}</div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          {formatThaiDate(request.requestDate)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          {formatThaiDate(request.targetDate)}
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getStatusClass(request.status)}`}
                          >
                            {request.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="inline-flex items-center gap-2">
                            <Link
                              href={`/requests/${request.id}/edit`}
                              className="h-10 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-teal-600 hover:text-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-100"
                            >
                              แก้ไข
                            </Link>
                            <select
                              value={request.status}
                              onChange={(event) =>
                                updateStatus(request, event.target.value as RequestStatus)
                              }
                              className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition hover:border-teal-600 focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
                              aria-label={`เปลี่ยนสถานะ ${displayRequestNo(request)}`}
                            >
                              {getStatusOptions(request.status).map((status) => (
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

              <div className="divide-y divide-slate-200 lg:hidden">
                {requests.map((request) => (
                  <article key={request.id} className="px-4 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <Link
                          href={`/requests/${request.id}`}
                          className="font-semibold text-slate-950 hover:text-teal-700"
                        >
                          {displayRequestNo(request)}
                        </Link>
                        <Link
                          href={`/requests/${request.id}`}
                          className="mt-1 block text-sm text-slate-600 hover:text-teal-700"
                        >
                          {displayCustomerName(request)}
                        </Link>
                      </div>
                      <span
                        className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${getStatusClass(request.status)}`}
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
                        <dd className="font-medium text-slate-900">{Array.isArray(request.requestType) ? request.requestType.join(", ") : request.requestType}</dd>
                      </div>
                      <div>
                        <dt className="text-slate-500">มิเตอร์</dt>
                        <dd className="font-medium text-slate-900">
                          {request.meterOption ?? "-"}
                        </dd>
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

                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                      <Link
                        href={`/requests/${request.id}/edit`}
                        className="inline-flex h-10 flex-1 items-center justify-center rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:border-teal-600 hover:text-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-100"
                      >
                        แก้ไข
                      </Link>
                      <select
                        value={request.status}
                        onChange={(event) =>
                          updateStatus(request, event.target.value as RequestStatus)
                        }
                        className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition hover:border-teal-600 focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
                        aria-label={`เปลี่ยนสถานะ ${displayRequestNo(request)}`}
                      >
                        {getStatusOptions(request.status).map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}

          <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="text-sm text-slate-500">
              หน้า {currentPage} จาก {totalPages}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:border-teal-600 hover:text-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                ก่อนหน้า
              </button>
              {pageButtons.map((page) => (
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
