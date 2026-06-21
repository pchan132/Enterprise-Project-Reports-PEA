"use client";

import { ChangeEvent, FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import WMSF01PrintForm from "@/app/components/wmsf01-print-form";
import { METER_OPTIONS } from "@/app/lib/data/meter-option";
import { REQUEST_TYPES } from "@/app/lib/data/request-types";
import { SUB_DISTRICTS } from "@/app/lib/data/subdistricts";
import {
  REQUEST_STATUSES,
  type ApiErrorResponse,
  type ElectricalRequestDto,
  type ElectricalRequestResponse,
} from "@/app/lib/electrical-request-types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RequestFormData {
  requestNo: string;
  firstName: string;
  lastName: string;
  phone: string;
  phone2: string;
  address: string;
  subDistrict: string;
  district: string;
  province: string;
  lat: string;
  long: string;
  description: string;
  link: string;
  requestDate: string;
  requestType: string[];
  meterOption: string;
  caRefNo: string;
  peaNo: string;
  status: string;
  isFollowUp: boolean;
  targetDate: string;
}

type RequestFormProps = {
  mode?: "create" | "edit";
  requestId?: string;
};

type FieldProps = {
  label: string;
  htmlFor: string;
  required?: boolean;
  children: ReactNode;
};

type SectionProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getTodayInputValue(): string {
  return new Date().toISOString().slice(0, 10);
}

const emptyFormData = (): RequestFormData => ({
  requestNo: "",
  firstName: "",
  lastName: "",
  phone: "",
  phone2: "",
  address: "",
  subDistrict: "",
  district: "",
  province: "ลพบุรี",
  lat: "",
  long: "",
  description: "",
  link: "",
  requestDate: getTodayInputValue(),
  requestType: [],
  meterOption: "",
  caRefNo: "",
  peaNo: "",
  status: "รับเรื่อง",
  isFollowUp: false,
  targetDate: "",
});

function toFormData(request: ElectricalRequestDto): RequestFormData {
  return {
    requestNo: request.requestNo ?? "",
    firstName: request.firstName,
    lastName: request.lastName,
    phone: request.phone,
    phone2: request.phone2 ?? "",
    address: request.address,
    subDistrict: request.subDistrict,
    district: request.district,
    province: request.province,
    lat: request.lat === null ? "" : String(request.lat),
    long: request.long === null ? "" : String(request.long),
    description: request.description ?? "",
    link: request.link ?? "",
    requestDate: request.requestDate,
    requestType: request.requestType,
    meterOption: request.meterOption ?? "",
    caRefNo: request.caRefNo ?? "",
    peaNo: request.peaNo ?? "",
    status: request.status,
    isFollowUp: request.isFollowUp,
    targetDate: request.targetDate ?? "",
  };
}

function compactPayload(formData: RequestFormData) {
  return {
    ...formData,
    requestNo: formData.requestNo || undefined,
    phone2: formData.phone2 || null,
    lat: formData.lat || null,
    long: formData.long || null,
    description: formData.description || null,
    link: formData.link || null,
    meterOption: formData.meterOption || null,
    caRefNo: formData.caRefNo || null,
    peaNo: formData.peaNo || null,
    targetDate: formData.targetDate || null,
    requestType: formData.requestType.length > 0 ? formData.requestType : undefined,
  };
}

/**
 * รวบรวม meter options จากทุกประเภทคำร้องที่เลือก (ไม่ซ้ำกัน)
 * เช่น เลือก "ขอใช้ไฟใหม่ถาวร" + "ขอไฟเกษตร" → รวม options ทั้งสองเข้าด้วยกัน
 */
function collectMeterOptions(selectedTypes: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const typeName of selectedTypes) {
    const options = METER_OPTIONS[typeName as keyof typeof METER_OPTIONS];
    if (!options) continue;

    for (const option of options) {
      if (!seen.has(option)) {
        seen.add(option);
        result.push(option);
      }
    }
  }

  return result;
}

/**
 * ตรวจว่าประเภทคำร้องนี้ต้องเลือก meter option หรือไม่
 */
function doesTypeNeedMeter(typeValue: string): boolean {
  return typeValue in METER_OPTIONS;
}

// ---------------------------------------------------------------------------
// Reusable sub-components
// ---------------------------------------------------------------------------

function Field({ label, htmlFor, required, children }: FieldProps) {
  return (
    <label htmlFor={htmlFor} className="flex min-w-0 flex-col gap-2">
      <span className="text-sm font-medium text-slate-700">
        {label}
        {required && <span className="ml-1 text-rose-600">*</span>}
      </span>
      {children}
    </label>
  );
}

function Section({ title, description, children }: SectionProps) {
  return (
    <section className="space-y-4 border-t border-slate-200 pt-5 first:border-t-0 first:pt-0">
      <div>
        <h2 className="text-base font-semibold text-slate-950">{title}</h2>
        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      </div>
      {children}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function RequestForm({ mode = "create", requestId }: RequestFormProps) {
  const router = useRouter();
  const isEdit = mode === "edit";

  // --- State ----------------------------------------------------------------
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEdit);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [formData, setFormData] = useState<RequestFormData>(() => emptyFormData());
  const [showPrintForm, setShowPrintForm] = useState(false);

  // --- Shared CSS -----------------------------------------------------------
  const fieldClass =
    "h-12 w-full rounded-lg border border-slate-300 bg-white px-3 text-base text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-4 focus:ring-teal-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500";
  const textareaClass =
    "min-h-28 w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-base text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-4 focus:ring-teal-100";

  // --- Load existing data (edit mode) ---------------------------------------
  useEffect(() => {
    if (!isEdit || !requestId) return;

    let ignore = false;

    async function loadRequest() {
      setInitialLoading(true);
      setError("");

      try {
        const response = await fetch(`/api/${encodeURIComponent(requestId!)}`, {
          cache: "no-store",
        });
        const payload = (await response.json()) as ElectricalRequestResponse & ApiErrorResponse;

        if (!response.ok) {
          throw new Error(payload.error ?? "โหลดข้อมูลคำร้องไม่สำเร็จ");
        }

        if (!ignore) {
          setFormData(toFormData(payload.data));
        }
      } catch (err) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : "โหลดข้อมูลคำร้องไม่สำเร็จ");
        }
      } finally {
        if (!ignore) {
          setInitialLoading(false);
        }
      }
    }

    loadRequest();
    return () => { ignore = true; };
  }, [isEdit, requestId]);

  // --- Meter options (รวมจากทุกประเภทที่เลือก) -------------------------------
  const availableMeterOptions = useMemo(
    () => collectMeterOptions(formData.requestType),
    [formData.requestType],
  );

  // เมื่อ meter options เปลี่ยน → clear ค่าที่เลือกไว้ ถ้ามันไม่อยู่ในรายการใหม่
  useEffect(() => {
    if (formData.meterOption && !availableMeterOptions.includes(formData.meterOption)) {
      setFormData((prev) => ({ ...prev, meterOption: "" }));
    }
  }, [availableMeterOptions, formData.meterOption]);

  // ตรวจว่ามีประเภทที่ต้องเลือก meter option อย่างน้อย 1 ตัวหรือไม่
  const needsMeterOption = formData.requestType.some(doesTypeNeedMeter);

  // --- Event handlers -------------------------------------------------------

  /** จัดการ input ทั่วไป (text / select / textarea / checkbox) */
  function handleFieldChange(
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) {
    const { name, value, type } = e.target;
    const newValue = type === "checkbox" ? (e.target as HTMLInputElement).checked : value;

    setFormData((prev) => {
      const next = { ...prev, [name]: newValue };

      // เมื่อเปลี่ยนอำเภอ → reset ตำบล
      if (name === "district") {
        next.subDistrict = "";
      }

      return next;
    });

    clearMessages();
  }

  /** สลับเปิด/ปิดประเภทคำร้อง (checkbox toggle) */
  function toggleRequestType(typeValue: string) {
    setFormData((prev) => {
      const alreadySelected = prev.requestType.includes(typeValue);

      const updatedTypes = alreadySelected
        ? prev.requestType.filter((t) => t !== typeValue) // ลบออก
        : [...prev.requestType, typeValue];               // เพิ่มเข้า

      return { ...prev, requestType: updatedTypes };
    });

    clearMessages();
  }

  function clearMessages() {
    setMessage("");
    setError("");
  }

  // --- Submit & Delete ------------------------------------------------------

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    clearMessages();

    try {
      const url = isEdit ? `/api/${encodeURIComponent(requestId ?? "")}` : "/api";
      const method = isEdit ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(compactPayload(formData)),
      });
      const payload = (await response.json()) as ElectricalRequestResponse & ApiErrorResponse;

      if (!response.ok) {
        throw new Error(payload.errors?.join(", ") ?? payload.error ?? "บันทึกข้อมูลไม่สำเร็จ");
      }

      setMessage(isEdit ? "บันทึกการแก้ไขเรียบร้อยแล้ว" : "เพิ่มคำร้องเรียบร้อยแล้ว");
      router.refresh();
      router.push(`/requests/${payload.data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "บันทึกข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!isEdit || !requestId) return;

    const requestLabel = formData.requestNo || `${formData.firstName} ${formData.lastName}`.trim();
    const confirmed = window.confirm(
      `ต้องการลบคำร้อง ${requestLabel || "นี้"} ใช่หรือไม่? การลบแล้วไม่สามารถย้อนกลับได้`,
    );
    if (!confirmed) return;

    setDeleting(true);
    clearMessages();

    try {
      const response = await fetch(`/api/${encodeURIComponent(requestId)}`, { method: "DELETE" });
      const payload = (await response.json()) as ApiErrorResponse;

      if (!response.ok) {
        throw new Error(payload.error ?? "ลบข้อมูลไม่สำเร็จ");
      }

      router.refresh();
      router.push("/requests");
    } catch (err) {
      setError(err instanceof Error ? err.message : "ลบข้อมูลไม่สำเร็จ");
    } finally {
      setDeleting(false);
    }
  }

  // --- Loading state --------------------------------------------------------

  if (initialLoading) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white px-6 py-10 text-center text-slate-600 shadow-sm">
        กำลังโหลดข้อมูลคำร้อง...
      </div>
    );
  }

  // --- Render ---------------------------------------------------------------

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm sm:rounded-lg">
      {/* ── Header ── */}
      <div className="border-b border-slate-200 bg-white px-3 py-4 sm:px-6 sm:py-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-medium text-teal-700">ระบบรับคำร้อง</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-950 sm:text-3xl">
              {isEdit ? "แก้ไขคำร้อง" : "เพิ่มคำร้องใหม่"}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              กรอกข้อมูลผู้ใช้ไฟและรายละเอียดคำร้อง ช่องที่มีเครื่องหมาย * จำเป็นต้องกรอก
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:items-end">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setShowPrintForm(true)}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 text-sm font-semibold text-amber-800 transition hover:border-amber-500 hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-400/40"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                  <path fillRule="evenodd" d="M5 2.75C5 1.784 5.784 1 6.75 1h6.5c.966 0 1.75.784 1.75 1.75v3.552c.377.046.752.097 1.126.153A2.212 2.212 0 0 1 18 8.653v4.097A2.25 2.25 0 0 1 15.75 15h-.75v.75c0 .966-.784 1.75-1.75 1.75h-6.5A1.75 1.75 0 0 1 5 15.75V15h-.75A2.25 2.25 0 0 1 2 12.75V8.653c0-1.082.775-2.034 1.874-2.198.374-.056.75-.107 1.126-.153V2.75ZM6.5 15v.75c0 .138.112.25.25.25h6.5a.25.25 0 0 0 .25-.25V15h-7Zm7-11.25v3.372a40.739 40.739 0 0 0-7 0V3.75h-.002V2.75a.25.25 0 0 1 .25-.25h6.5a.25.25 0 0 1 .25.25v1Zm.497 6a.75.75 0 0 1 .75-.75h.5a.75.75 0 0 1 0 1.5h-.5a.75.75 0 0 1-.75-.75Z" clipRule="evenodd" />
                </svg>
                พิมพ์ฟอร์ม WMSF01
              </button>
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                สถานะ: <span className="font-semibold text-slate-950">{formData.status}</span>
              </div>
            </div>
            <Link href="/requests" className="text-sm font-semibold text-teal-700 hover:text-teal-900">
              กลับไปรายการคำร้อง
            </Link>
          </div>
        </div>
      </div>

      {/* ── Form ── */}
      <form onSubmit={handleSubmit} className="space-y-4 px-3 py-4 sm:space-y-6 sm:px-6 sm:py-5">
        {/* Error banner */}
        {error && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {error}
          </div>
        )}

        {/* ── Section 1: ข้อมูลผู้ใช้ไฟ ── */}
        <Section title="ข้อมูลผู้ใช้ไฟ" description="ข้อมูลติดต่อหลักของผู้ยื่นคำร้อง">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="เลขคำร้อง" htmlFor="requestNo">
              <input
                id="requestNo"
                name="requestNo"
                type="text"
                placeholder="ระบบจะสร้างให้อัตโนมัติ"
                value={formData.requestNo}
                onChange={handleFieldChange}
                className={fieldClass}
              />
            </Field>

            <Field label="ชื่อ" htmlFor="firstName" required>
              <input
                id="firstName"
                name="firstName"
                type="text"
                autoComplete="given-name"
                placeholder="เช่น สมชาย"
                required
                value={formData.firstName}
                onChange={handleFieldChange}
                className={fieldClass}
              />
            </Field>

            <Field label="นามสกุล" htmlFor="lastName" required>
              <input
                id="lastName"
                name="lastName"
                type="text"
                autoComplete="family-name"
                placeholder="เช่น ใจดี"
                required
                value={formData.lastName}
                onChange={handleFieldChange}
                className={fieldClass}
              />
            </Field>

            <Field label="เบอร์โทรหลัก" htmlFor="phone" required>
              <input
                id="phone"
                name="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="08x-xxx-xxxx"
                required
                value={formData.phone}
                onChange={handleFieldChange}
                className={fieldClass}
              />
            </Field>

            <Field label="เบอร์โทรสำรอง" htmlFor="phone2">
              <input
                id="phone2"
                name="phone2"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="ถ้ามี"
                value={formData.phone2}
                onChange={handleFieldChange}
                className={fieldClass}
              />
            </Field>
          </div>
        </Section>

        {/* ── Section 2: สถานที่ขอใช้ไฟ ── */}
        <Section title="สถานที่ขอใช้ไฟ" description="เลือกอำเภอก่อน แล้วระบบจะแสดงตำบลให้เลือก">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="ที่อยู่" htmlFor="address" required>
              <input
                id="address"
                name="address"
                type="text"
                autoComplete="street-address"
                placeholder="บ้านเลขที่ หมู่ ถนน"
                required
                value={formData.address}
                onChange={handleFieldChange}
                className={fieldClass}
              />
            </Field>

            <Field label="อำเภอ" htmlFor="district" required>
              <select
                id="district"
                name="district"
                required
                value={formData.district}
                onChange={handleFieldChange}
                className={fieldClass}
              >
                <option value="">เลือกอำเภอ</option>
                {Object.keys(SUB_DISTRICTS).map((district) => (
                  <option key={district} value={district}>
                    {district}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="ตำบล" htmlFor="subDistrict" required>
              <select
                id="subDistrict"
                name="subDistrict"
                required
                disabled={!formData.district}
                value={formData.subDistrict}
                onChange={handleFieldChange}
                className={fieldClass}
              >
                <option value="">
                  {formData.district ? "เลือกตำบล" : "เลือกอำเภอก่อน"}
                </option>
                {formData.district &&
                  SUB_DISTRICTS[formData.district]?.map((subDistrict) => (
                    <option key={subDistrict} value={subDistrict}>
                      {subDistrict}
                    </option>
                  ))}
              </select>
            </Field>

            <Field label="จังหวัด" htmlFor="province" required>
              <input
                id="province"
                name="province"
                type="text"
                required
                value={formData.province}
                onChange={handleFieldChange}
                className={fieldClass}
              />
            </Field>

            <Field label="ละติจูด" htmlFor="lat">
              <input
                id="lat"
                name="lat"
                type="number"
                inputMode="decimal"
                step="any"
                placeholder="เช่น 14.7990"
                value={formData.lat}
                onChange={handleFieldChange}
                className={fieldClass}
              />
            </Field>

            <Field label="ลองจิจูด" htmlFor="long">
              <input
                id="long"
                name="long"
                type="number"
                inputMode="decimal"
                step="any"
                placeholder="เช่น 100.6530"
                value={formData.long}
                onChange={handleFieldChange}
                className={fieldClass}
              />
            </Field>
          </div>
        </Section>

        {/* ── Section 3: รายละเอียดคำร้อง ── */}
        <Section title="รายละเอียดคำร้อง" description="เลือกประเภทคำร้อง — เลือกได้หลายรายการ ถ้าประเภทที่เลือกต้องระบุขนาดมิเตอร์ ระบบจะแสดงช่องให้เลือกอัตโนมัติ">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="วันที่รับคำร้อง" htmlFor="requestDate" required>
              <input
                id="requestDate"
                name="requestDate"
                type="date"
                required
                value={formData.requestDate}
                onChange={handleFieldChange}
                className={fieldClass}
              />
            </Field>
          </div>

          {/* ── ประเภทคำร้อง (Checkbox list) ── */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-700">
                ประเภทคำร้อง <span className="text-rose-600">*</span>
              </span>
              {formData.requestType.length > 0 && (
                <span className="rounded-full bg-teal-100 px-2.5 py-0.5 text-xs font-semibold text-teal-800">
                  เลือกแล้ว {formData.requestType.length} รายการ
                </span>
              )}
            </div>

            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {REQUEST_TYPES.map((type) => {
                const isSelected = formData.requestType.includes(type.value);
                const hasMeter = doesTypeNeedMeter(type.value);

                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => toggleRequestType(type.value)}
                    className={[
                      "flex items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm font-medium transition",
                      isSelected
                        ? "border-teal-500 bg-teal-50 text-teal-900 ring-2 ring-teal-200"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
                    ].join(" ")}
                  >
                    {/* Checkbox indicator */}
                    <span
                      className={[
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 text-xs transition",
                        isSelected
                          ? "border-teal-600 bg-teal-600 text-white"
                          : "border-slate-300 bg-white",
                      ].join(" ")}
                    >
                      {isSelected && "✓"}
                    </span>

                    <span className="flex-1">{type.label}</span>

                    {/* ป้ายบอกว่าต้องเลือกขนาดมิเตอร์ */}
                    {hasMeter && (
                      <span className="shrink-0 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                        เลือกมิเตอร์
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {formData.requestType.length === 0 && (
              <p className="rounded-lg bg-rose-50 p-2.5 text-sm text-rose-600">
                กรุณาเลือกประเภทคำร้องอย่างน้อยหนึ่งรายการ
              </p>
            )}
          </div>

          {/* ── ขนาด/ตัวเลือกมิเตอร์ (แสดงเฉพาะเมื่อมีประเภทที่ต้องเลือก) ── */}
          {needsMeterOption && (
            <div className="rounded-lg border border-teal-100 bg-teal-50/50 p-4">
              <Field label="ขนาด/ตัวเลือกมิเตอร์" htmlFor="meterOption" required>
                <select
                  id="meterOption"
                  name="meterOption"
                  value={formData.meterOption}
                  onChange={handleFieldChange}
                  className={fieldClass}
                >
                  <option value="">— เลือกขนาดมิเตอร์ —</option>
                  {availableMeterOptions.map((meter) => (
                    <option key={meter} value={meter}>
                      {meter}
                    </option>
                  ))}
                </select>
              </Field>

              <p className="mt-2 text-xs text-teal-700">
                💡 ตัวเลือกด้านบนรวมมาจากประเภทคำร้องที่เลือกไว้ทั้งหมด
              </p>
            </div>
          )}

          {/* ── ช่องข้อมูลเพิ่มเติม ── */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="หมายเลขผู้ใช้ไฟ (CA Ref No.)" htmlFor="caRefNo">
              <input
                id="caRefNo"
                name="caRefNo"
                type="text"
                placeholder="ถ้ามี"
                value={formData.caRefNo}
                onChange={handleFieldChange}
                className={fieldClass}
              />
            </Field>

            <Field label="หมายเลขเครื่องวัด (PEA No.)" htmlFor="peaNo">
              <input
                id="peaNo"
                name="peaNo"
                type="text"
                placeholder="ถ้ามี"
                value={formData.peaNo}
                onChange={handleFieldChange}
                className={fieldClass}
              />
            </Field>

            <Field label="วันที่จัดคิว" htmlFor="targetDate">
              <input
                id="targetDate"
                name="targetDate"
                type="date"
                value={formData.targetDate}
                onChange={handleFieldChange}
                className={fieldClass}
              />
            </Field>

            <Field label="สถานะ" htmlFor="status">
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleFieldChange}
                className={fieldClass}
              >
                {REQUEST_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </Field>

            <label className="flex h-12 items-center gap-3 self-end rounded-lg border border-slate-300 bg-slate-50 px-3 text-sm font-medium text-slate-700">
              <input
                name="isFollowUp"
                type="checkbox"
                checked={formData.isFollowUp}
                onChange={handleFieldChange}
                className="h-5 w-5 rounded border-slate-300 text-teal-700 focus:ring-teal-600"
              />
              ติดตาม/ทวงคำร้องแล้ว
            </label>
          </div>

          <Field label="ลิงก์เอกสาร" htmlFor="link">
            <input
              id="link"
              name="link"
              type="url"
              placeholder="https://example.com/document.pdf"
              value={formData.link}
              onChange={handleFieldChange}
              className={fieldClass}
            />
          </Field>

          <Field label="รายละเอียดเพิ่มเติม" htmlFor="description">
            <textarea
              id="description"
              name="description"
              rows={4}
              placeholder="ระบุจุดสังเกต รายละเอียดงาน หรือข้อมูลที่ต้องแจ้งทีมช่าง"
              value={formData.description}
              onChange={handleFieldChange}
              className={textareaClass}
            />
          </Field>
        </Section>

        {/* ── Sticky footer ── */}
        <div className="sticky bottom-0 -mx-3 border-t border-slate-200 bg-white/95 px-3 py-3 backdrop-blur sm:-mx-6 sm:px-6 sm:py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="min-h-5 text-sm font-medium text-teal-700" aria-live="polite">
              {message}
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              {isEdit && (
                <button
                  type="button"
                  disabled={loading || deleting}
                  onClick={handleDelete}
                  className="h-11 w-full rounded-lg border border-rose-300 bg-white px-4 text-sm font-semibold text-rose-700 transition hover:border-rose-500 hover:bg-rose-50 focus:outline-none focus:ring-2 focus:ring-rose-500/40 disabled:cursor-wait disabled:opacity-60 sm:h-12 sm:w-auto sm:px-5 sm:text-base"
                >
                  {deleting ? "กำลังลบ..." : "ลบคำร้อง"}
                </button>
              )}
              <button
                type="submit"
                disabled={loading || deleting}
                className="h-11 w-full rounded-lg bg-teal-700 px-4 text-sm font-semibold text-white transition hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-500/40 disabled:cursor-wait disabled:opacity-60 sm:h-12 sm:w-auto sm:px-5 sm:text-base"
              >
                {loading ? "กำลังบันทึก..." : isEdit ? "บันทึกการแก้ไข" : "บันทึกคำร้อง"}
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* ── WMSF01 Print Form Modal ── */}
      {showPrintForm && (
        <WMSF01PrintForm
          request={{
            id: requestId ?? "",
            requestNo: formData.requestNo || null,
            firstName: formData.firstName,
            lastName: formData.lastName,
            phone: formData.phone,
            phone2: formData.phone2 || null,
            address: formData.address,
            subDistrict: formData.subDistrict,
            district: formData.district,
            province: formData.province,
            lat: formData.lat ? Number(formData.lat) : null,
            long: formData.long ? Number(formData.long) : null,
            description: formData.description || null,
            link: formData.link || null,
            requestDate: formData.requestDate,
            requestType: formData.requestType,
            meterOption: formData.meterOption || null,
            caRefNo: formData.caRefNo || null,
            peaNo: formData.peaNo || null,
            status: formData.status,
            isFollowUp: formData.isFollowUp,
            targetDate: formData.targetDate || null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }}
          onClose={() => setShowPrintForm(false)}
        />
      )}
    </div>
  );
}

