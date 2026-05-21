"use client";

import { FormEvent, useState } from "react";
import { SUB_DISTRICTS } from "@/app/lib/data/subdistricts";
import { METER_OPTIONS } from "@/app/lib/data/meter-option";
import { REQUEST_TYPES } from "@/app/lib/data/request-types";
import { REQUEST_STATUSES } from "@/app/lib/electrical-request-types";

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

type RequestSearchFormProps = {
  onApplyFilters: (filters: FilterValues) => void;
  onRealtimeSearch: (firstName: string, lastName: string, district: string, subDistrict: string) => void;
  onClear: () => void;
};

const DISTRICTS = Object.keys(SUB_DISTRICTS);

// Get all unique meter options from the data
const METER_OPTIONS_LIST = Array.from(
  new Set(
    Object.values(METER_OPTIONS).flatMap((options) => options)
  )
).sort();



export default function RequestSearchForm({ onApplyFilters, onRealtimeSearch, onClear }: RequestSearchFormProps) {
  const [showFilters, setShowFilters] = useState(false);
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

  const subDistricts = filters.district
    ? SUB_DISTRICTS[filters.district as keyof typeof SUB_DISTRICTS] || []
    : [];

  function handleFilterChange(field: keyof FilterValues, value: string) {
    if (field === "district") {
      // เมื่อเปลี่ยนอำเภอ ให้ล้างตำบลด้วย
      const newFilters = { ...filters, district: value, subDistrict: "" };
      setFilters(newFilters);
      onRealtimeSearch(newFilters.firstName, newFilters.lastName, value, "");
    } else if (field === "subDistrict") {
      // ตำบลมาจาก select ดังนั้นค่าถูกต้องเสมอ — ส่ง real-time ได้ทันที
      setFilters((prev) => ({ ...prev, subDistrict: value }));
      onRealtimeSearch(filters.firstName, filters.lastName, filters.district, value);
    } else {
      setFilters((prev) => ({ ...prev, [field]: value }));

      // ค้นหา real-time สำหรับชื่อและนามสกุล
      if (field === "firstName" || field === "lastName") {
        const newFilters = { ...filters, [field]: value };
        onRealtimeSearch(
          newFilters.firstName,
          newFilters.lastName,
          newFilters.district,
          newFilters.subDistrict,
        );
      }
    }
  }

  /** สลับเปิด/ปิดประเภทคำร้องในตัวกรอง (checkbox toggle) */
  function toggleRequestType(typeValue: string) {
    setFilters((prev) => {
      const alreadySelected = prev.requestType.includes(typeValue);
      const updatedTypes = alreadySelected
        ? prev.requestType.filter((t) => t !== typeValue)
        : [...prev.requestType, typeValue];
      return { ...prev, requestType: updatedTypes };
    });
  }

  function handleApplyFilters(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    onApplyFilters(filters);
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
    onClear();
  }

  const hasActiveFilters =
    filters.requestType.length > 0 ||
    Object.entries(filters).some(
      ([key, v]) => key !== "requestType" && v && v !== "ลพบุรี",
    );

  return (
    <div className="space-y-6 rounded-3xl border border-white/60 bg-white/50 p-6 shadow-sm backdrop-blur-md">
      {/* ค้นหาชื่อ-นามสกุล (Real Time) */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="firstName" className="block text-base font-bold text-slate-800">
            ชื่อ
          </label>
          <input
            id="firstName"
            type="text"
            value={filters.firstName}
            onChange={(e) => handleFilterChange("firstName", e.target.value)}
            placeholder="กรอกชื่อ"
            className="mt-2 h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base font-medium text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
          />
        </div>
        <div>
          <label htmlFor="lastName" className="block text-base font-bold text-slate-800">
            นามสกุล
          </label>
          <input
            id="lastName"
            type="text"
            value={filters.lastName}
            onChange={(e) => handleFilterChange("lastName", e.target.value)}
            placeholder="กรอกนามสกุล"
            className="mt-2 h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base font-medium text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
          />
        </div>
      </div>

      {/* ค้นหา ตำบล และ อำเภอ */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* อำเภอ: ใช้ select เลือกได้ทันที */}
        <div>
          <label htmlFor="district" className="block text-base font-bold text-slate-800">
            อำเภอ
          </label>
          <select
            id="district"
            value={filters.district}
            onChange={(e) => handleFilterChange("district", e.target.value)}
            className="mt-2 h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base font-medium text-slate-900 shadow-sm outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
          >
            <option value="">-- ทั้งหมด --</option>
            {DISTRICTS.map((district) => (
              <option key={district} value={district}>
                {district}
              </option>
            ))}
          </select>
        </div>

        {/* ตำบล: dropdown ตามอำเภอที่เลือก */}
        <div>
          <label htmlFor="subDistrict" className="block text-base font-bold text-slate-800">
            ตำบล
          </label>
          <select
            id="subDistrict"
            value={filters.subDistrict}
            onChange={(e) => handleFilterChange("subDistrict", e.target.value)}
            disabled={!filters.district}
            className="mt-2 h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base font-medium text-slate-900 shadow-sm outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-100 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
          >
            <option value="">-- ทั้งหมด --</option>
            {subDistricts.map((sub) => (
              <option key={sub} value={sub}>
                {sub}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ฟิลเตอร์เพิ่มเติม */}
      <button
        type="button"
        onClick={() => setShowFilters(!showFilters)}
        className="flex items-center gap-2 text-sm font-semibold text-teal-700 transition hover:text-teal-800"
      >
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M3 3a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-.293.707L13 10.414V16a1 1 0 01-.553.894l-3 1.5a1 1 0 01-1.894-.894V10.414L3.293 5.707A1 1 0 013 5V3z"
            clipRule="evenodd"
          />
        </svg>
        {showFilters ? "ซ่อนตัวกรอง" : "แสดงตัวกรอง"}
      </button>

      {showFilters && (
        <form onSubmit={handleApplyFilters} className="space-y-4 border-t border-slate-200 pt-4">
          {/* Row 1: เบอร์โทร, สถานะ */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="phone" className="block text-base font-bold text-slate-800">
                เบอร์โทร
              </label>
              <input
                id="phone"
                type="tel"
                value={filters.phone}
                onChange={(e) => handleFilterChange("phone", e.target.value)}
                placeholder="เบอร์โทร"
                className="mt-2 h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base font-medium text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
              />
            </div>
            <div>
              <label htmlFor="status" className="block text-base font-bold text-slate-800">
                สถานะ
              </label>
              <select
                id="status"
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                className="mt-2 h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base font-medium text-slate-900 shadow-sm outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
              >
                <option value="">-- ทั้งหมด --</option>
                {REQUEST_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* ประเภทคำร้อง (Checkbox เลือกได้หลายรายการ) */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-slate-800">ประเภทคำร้อง</span>
              {filters.requestType.length > 0 && (
                <span className="rounded-full bg-teal-100 px-3 py-1 text-sm font-bold text-teal-800">
                  เลือกแล้ว {filters.requestType.length} รายการ
                </span>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {REQUEST_TYPES.map((type) => {
                const isSelected = filters.requestType.includes(type.value);

                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => toggleRequestType(type.value)}
                    className={[
                      "flex min-h-[3rem] items-center gap-3 rounded-xl border px-4 py-3 text-left text-base font-medium transition shadow-sm",
                      isSelected
                        ? "border-teal-500 bg-teal-50 text-teal-900 ring-2 ring-teal-200"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
                    ].join(" ")}
                  >
                    {/* Checkbox indicator */}
                    <span
                      className={[
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 text-xs font-bold transition",
                        isSelected
                          ? "border-teal-600 bg-teal-600 text-white"
                          : "border-slate-300 bg-white",
                      ].join(" ")}
                    >
                      {isSelected && "✓"}
                    </span>

                    <span className="flex-1 leading-snug">{type.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Row 2: ที่อยู่ */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="address" className="block text-base font-bold text-slate-800">
                ที่อยู่
              </label>
              <input
                id="address"
                type="text"
                value={filters.address}
                onChange={(e) => handleFilterChange("address", e.target.value)}
                placeholder="ที่อยู่"
                className="mt-2 h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base font-medium text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
              />
            </div>
          </div>

          {/* Row 3: จังหวัด, ละติจูด, ลองจิจูด */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="province" className="block text-base font-bold text-slate-800">
                จังหวัด
              </label>
              <input
                id="province"
                type="text"
                value={filters.province}
                onChange={(e) => handleFilterChange("province", e.target.value)}
                placeholder="จังหวัด"
                className="mt-2 h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base font-medium text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
              />
            </div>
            <div>
              <label htmlFor="lat" className="block text-base font-bold text-slate-800">
                ละติจูด
              </label>
              <input
                id="lat"
                type="number"
                step="0.000001"
                value={filters.lat}
                onChange={(e) => handleFilterChange("lat", e.target.value)}
                placeholder="ละติจูด"
                className="mt-2 h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base font-medium text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
              />
            </div>
            <div>
              <label htmlFor="long" className="block text-base font-bold text-slate-800">
                ลองจิจูด
              </label>
              <input
                id="long"
                type="number"
                step="0.000001"
                value={filters.long}
                onChange={(e) => handleFilterChange("long", e.target.value)}
                placeholder="ลองจิจูด"
                className="mt-2 h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base font-medium text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
              />
            </div>
          </div>

          {/* Row 4: วันที่รับคำร้อง, วันที่จัดคิว, ติดตาม */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="requestDate" className="block text-base font-bold text-slate-800">
                วันที่รับคำร้อง
              </label>
              <input
                id="requestDate"
                type="date"
                value={filters.requestDate}
                onChange={(e) => handleFilterChange("requestDate", e.target.value)}
                className="mt-2 h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base font-medium text-slate-900 shadow-sm outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
              />
            </div>
            <div>
              <label htmlFor="targetDate" className="block text-base font-bold text-slate-800">
                วันที่จัดคิว
              </label>
              <input
                id="targetDate"
                type="date"
                value={filters.targetDate}
                onChange={(e) => handleFilterChange("targetDate", e.target.value)}
                className="mt-2 h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base font-medium text-slate-900 shadow-sm outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
              />
            </div>
            <div>
              <label htmlFor="isFollowUp" className="block text-base font-bold text-slate-800">
                ติดตาม/ทวงคำร้อง
              </label>
              <select
                id="isFollowUp"
                value={filters.isFollowUp}
                onChange={(e) => handleFilterChange("isFollowUp", e.target.value)}
                className="mt-2 h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base font-medium text-slate-900 shadow-sm outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
              >
                <option value="">-- ทั้งหมด --</option>
                <option value="true">ติดตามแล้ว</option>
                <option value="false">ยังไม่ติดตาม</option>
              </select>
            </div>
          </div>

          {/* Row 5: ขนาด/ตัวเลือกมิเตอร์, หมายเลขผู้ใช้ไฟ, หมายเลขเครื่องวัด */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="meterOption" className="block text-base font-bold text-slate-800">
                ขนาด/ตัวเลือกมิเตอร์
              </label>
              <select
                id="meterOption"
                value={filters.meterOption}
                onChange={(e) => handleFilterChange("meterOption", e.target.value)}
                className="mt-2 h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base font-medium text-slate-900 shadow-sm outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
              >
                <option value="">-- ทั้งหมด --</option>
                {METER_OPTIONS_LIST.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="caRefNo" className="block text-base font-bold text-slate-800">
                หมายเลขผู้ใช้ไฟ (CA Ref)
              </label>
              <input
                id="caRefNo"
                type="text"
                value={filters.caRefNo}
                onChange={(e) => handleFilterChange("caRefNo", e.target.value)}
                placeholder="CA Ref No"
                className="mt-2 h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base font-medium text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
              />
            </div>
            <div>
              <label htmlFor="peaNo" className="block text-base font-bold text-slate-800">
                หมายเลขเครื่องวัด (PEA No)
              </label>
              <input
                id="peaNo"
                type="text"
                value={filters.peaNo}
                onChange={(e) => handleFilterChange("peaNo", e.target.value)}
                placeholder="PEA No"
                className="mt-2 h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base font-medium text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
              />
            </div>
          </div>

          {/* Row 6: รายละเอียดเพิ่มเติม */}
          <div>
            <label htmlFor="description" className="block text-base font-bold text-slate-800">
              รายละเอียดเพิ่มเติม
            </label>
            <textarea
              id="description"
              value={filters.description}
              onChange={(e) => handleFilterChange("description", e.target.value)}
              placeholder="ค้นหาในรายละเอียดเพิ่มเติม"
              rows={3}
              className="mt-2 h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base font-medium text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
            />
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-6">
            <button
              type="submit"
              className="flex-1 rounded-2xl bg-gradient-to-r from-teal-500 to-teal-700 px-6 py-4 text-base font-bold text-white shadow-lg shadow-teal-900/20 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-teal-900/30 focus:outline-none focus:ring-4 focus:ring-teal-100"
            >
              🔍 ค้นหา
            </button>
            <button
              type="button"
              onClick={handleClearFilters}
              disabled={!hasActiveFilters}
              className="flex-1 rounded-2xl border border-white bg-white/80 px-6 py-4 text-base font-bold text-slate-700 shadow-sm transition-all duration-300 hover:border-teal-300 hover:bg-white hover:text-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              ❌ ล้างตัวกรอง
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
