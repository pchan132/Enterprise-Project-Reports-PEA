"use client";

import { ChangeEvent, FormEvent, ReactNode, useMemo, useState } from "react";

import { METER_OPTIONS } from "@/app/lib/data/meter-option";
import { REQUEST_TYPES } from "@/app/lib/data/request-types";
import { SUB_DISTRICTS } from "@/app/lib/data/subdistricts";

interface RequestFormData {
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
  requestDate: string;
  requestType: string;
  metrerOption: string;
  caRefNo : string; // หมายเลขผู้ใช้ไฟ (ถ้ามี) บัญชีแสดงสัญญา 
  peaNo : string; // หมายเลข เครื่องวัด (ถ้ามี)
  status: string;
  isFollowUp: boolean;
  targetDate: string;
}

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

function getTodayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

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
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-950">{title}</h2>
          {description && <p className="text-sm text-slate-500">{description}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

export default function RequestForm() {
  const [loading, setLoading] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");
  const [formData, setFormData] = useState<RequestFormData>({
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
    requestDate: getTodayInputValue(),
    requestType: "",
    metrerOption: "",
    caRefNo: "",
    peaNo: "",
    status: "รับเรื่อง",
    isFollowUp: false,
    targetDate: "",
  });

  const fieldClass =
    "h-12 w-full rounded-lg border border-slate-300 bg-white px-3 text-base text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-4 focus:ring-teal-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500";
  const textareaClass =
    "min-h-28 w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-base text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-4 focus:ring-teal-100";

  const availableMeterOptions = useMemo(() => {
    if (!(formData.requestType in METER_OPTIONS)) {
      return [];
    }

    return METER_OPTIONS[formData.requestType as keyof typeof METER_OPTIONS];
  }, [formData.requestType]);

  function handleChange(
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) {
    const { name, value, type } = e.target;
    const newValue =
      type === "checkbox" ? (e.target as HTMLInputElement).checked : value;

    setFormData((prev) => {
      const next = {
        ...prev,
        [name]: newValue,
      };

      if (name === "district") {
        next.subDistrict = "";
      }

      if (name === "requestType") {
        next.metrerOption = "";
      }

      return next;
    });

    setSavedMessage("");
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    window.setTimeout(() => {
      setLoading(false);
      setSavedMessage("เตรียมข้อมูลคำร้องเรียบร้อยแล้ว");
      console.log(formData);
    }, 350);
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-white px-4 py-5 sm:px-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-medium text-teal-700">ระบบรับคำร้อง</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-950 sm:text-3xl">
              เพิ่มคำร้องใหม่
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              กรอกข้อมูลผู้ใช้ไฟและรายละเอียดคำร้อง ช่องที่มีเครื่องหมาย * จำเป็นต้องกรอก
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
            สถานะ: <span className="font-semibold text-slate-950">{formData.status}</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 px-4 py-5 sm:px-6">
        <Section title="ข้อมูลผู้ใช้ไฟ" description="ข้อมูลติดต่อหลักของผู้ยื่นคำร้อง">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="ชื่อ" htmlFor="firstName" required>
              <input
                id="firstName"
                name="firstName"
                type="text"
                autoComplete="given-name"
                placeholder="เช่น สมชาย"
                required
                value={formData.firstName}
                onChange={handleChange}
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
                onChange={handleChange}
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
                onChange={handleChange}
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
                onChange={handleChange}
                className={fieldClass}
              />
            </Field>
          </div>
        </Section>

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
                onChange={handleChange}
                className={fieldClass}
              />
            </Field>

            <Field label="อำเภอ" htmlFor="district" required>
              <select
                id="district"
                name="district"
                required
                value={formData.district}
                onChange={handleChange}
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
                onChange={handleChange}
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
                onChange={handleChange}
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
                onChange={handleChange}
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
                onChange={handleChange}
                className={fieldClass}
              />
            </Field>
          </div>
        </Section>

        <Section title="รายละเอียดคำร้อง" description="เลือกประเภทคำร้องและวันนัดหมายที่เกี่ยวข้อง">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="วันที่รับคำร้อง" htmlFor="requestDate" required>
              <input
                id="requestDate"
                name="requestDate"
                type="date"
                required
                value={formData.requestDate}
                onChange={handleChange}
                className={fieldClass}
              />
            </Field>

            <Field label="ประเภทคำร้อง" htmlFor="requestType" required>
              <select
                id="requestType"
                name="requestType"
                required
                value={formData.requestType}
                onChange={handleChange}
                className={fieldClass}
              >
                <option value="">เลือกประเภทคำร้อง</option>
                {REQUEST_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="ขนาด/ตัวเลือกมิเตอร์" htmlFor="metrerOption">
              <select
                id="metrerOption"
                name="metrerOption"
                disabled={availableMeterOptions.length === 0}
                value={formData.metrerOption}
                onChange={handleChange}
                className={fieldClass}
              >
                <option value="">
                  {availableMeterOptions.length > 0
                    ? "เลือกตัวเลือกเกี่ยวกับมิเตอร์"
                    : "ไม่ต้องเลือกสำหรับประเภทนี้"}
                </option>
                {availableMeterOptions.map((meter) => (
                  <option key={meter} value={meter}>
                    {meter}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="หมายเลขผู้ใช้ไฟ (CA Ref No.)" htmlFor="caRefNo">
              <input
                id="caRefNo"
                name="caRefNo"
                type="text"
                placeholder="ถ้ามี"
                value={formData.caRefNo}
                onChange={handleChange}
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
                onChange={handleChange}
                className={fieldClass}
              />
            </Field>

            <Field label="วันที่จัดคิว" htmlFor="targetDate">
              <input
                id="targetDate"
                name="targetDate"
                type="date"
                value={formData.targetDate}
                onChange={handleChange}
                className={fieldClass}
              />
            </Field>

            <label className="flex h-12 items-center gap-3 self-end rounded-lg border border-slate-300 bg-slate-50 px-3 text-sm font-medium text-slate-700">
              <input
                name="isFollowUp"
                type="checkbox"
                checked={formData.isFollowUp}
                onChange={handleChange}
                className="h-5 w-5 rounded border-slate-300 text-teal-700 focus:ring-teal-600"
              />
              ติดตาม/ทวงคำร้องแล้ว
            </label>
          </div>

          <Field label="รายละเอียดเพิ่มเติม" htmlFor="description">
            <textarea
              id="description"
              name="description"
              rows={4}
              placeholder="ระบุจุดสังเกต รายละเอียดงาน หรือข้อมูลที่ต้องแจ้งทีมช่าง"
              value={formData.description}
              onChange={handleChange}
              className={textareaClass}
            />
          </Field>
        </Section>

        <div className="sticky bottom-0 -mx-4 border-t border-slate-200 bg-white/95 px-4 py-4 backdrop-blur sm:-mx-6 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="min-h-5 text-sm font-medium text-teal-700" aria-live="polite">
              {savedMessage}
            </p>
            <button
              type="submit"
              disabled={loading}
              className="h-12 w-full rounded-lg bg-teal-700 px-5 font-semibold text-white transition hover:bg-teal-800 focus:outline-none focus:ring-4 focus:ring-teal-100 disabled:cursor-wait disabled:opacity-60 sm:w-auto"
            >
              {loading ? "กำลังบันทึก..." : "บันทึกคำร้อง"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
