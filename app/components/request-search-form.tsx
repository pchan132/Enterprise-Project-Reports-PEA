"use client";

import { FormEvent, useState } from "react";
import { SUB_DISTRICTS } from "@/app/lib/data/subdistricts";
import { METER_OPTIONS } from "@/app/lib/data/meter-option";
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
  requestType: string;
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

const REQUEST_TYPES = [
  "ขอใช้ไฟใหม่ถาวร",
  "ขอใช้ไฟชั่วคราว",
  "ขอไฟเกษตร",
  "เปลี่ยนเป็น TOU",
  "เพิ่มขนาด",
  "ติดตั้งไฟ",
] as const;

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
    requestType: "",
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
      requestType: "",
      meterOption: "",
      caRefNo: "",
      peaNo: "",
      targetDate: "",
      isFollowUp: "",
      description: "",
    });
    onClear();
  }

  const hasActiveFilters = Object.values(filters).some((v) => v && v !== "ลพบุรี");

  return (
    <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-4">
      {/* ค้นหาชื่อ-นามสกุล (Real Time) */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="firstName" className="block text-sm font-semibold text-slate-700">
            ชื่อ
          </label>
          <input
            id="firstName"
            type="text"
            value={filters.firstName}
            onChange={(e) => handleFilterChange("firstName", e.target.value)}
            placeholder="กรอกชื่อ"
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
          />
        </div>
        <div>
          <label htmlFor="lastName" className="block text-sm font-semibold text-slate-700">
            นามสกุล
          </label>
          <input
            id="lastName"
            type="text"
            value={filters.lastName}
            onChange={(e) => handleFilterChange("lastName", e.target.value)}
            placeholder="กรอกนามสกุล"
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
          />
        </div>
      </div>

      {/* ค้นหา ตำบล และ อำเภอ */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* อำเภอ: ใช้ select เลือกได้ทันที */}
        <div>
          <label htmlFor="district" className="block text-sm font-semibold text-slate-700">
            อำเภอ
          </label>
          <select
            id="district"
            value={filters.district}
            onChange={(e) => handleFilterChange("district", e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
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
          <label htmlFor="subDistrict" className="block text-sm font-semibold text-slate-700">
            ตำบล
          </label>
          <select
            id="subDistrict"
            value={filters.subDistrict}
            onChange={(e) => handleFilterChange("subDistrict", e.target.value)}
            disabled={!filters.district}
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-100 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
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
          {/* Row 1: เบอร์โทร, สถานะ, ประเภทคำร้อง */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="phone" className="block text-sm font-semibold text-slate-700">
                เบอร์โทร
              </label>
              <input
                id="phone"
                type="tel"
                value={filters.phone}
                onChange={(e) => handleFilterChange("phone", e.target.value)}
                placeholder="เบอร์โทร"
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
              />
            </div>
            <div>
              <label htmlFor="status" className="block text-sm font-semibold text-slate-700">
                สถานะ
              </label>
              <select
                id="status"
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
              >
                <option value="">-- ทั้งหมด --</option>
                {REQUEST_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="requestType" className="block text-sm font-semibold text-slate-700">
                ประเภทคำร้อง
              </label>
              <select
                id="requestType"
                value={filters.requestType}
                onChange={(e) => handleFilterChange("requestType", e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
              >
                <option value="">-- ทั้งหมด --</option>
                {REQUEST_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: ที่อยู่ */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="address" className="block text-sm font-semibold text-slate-700">
                ที่อยู่
              </label>
              <input
                id="address"
                type="text"
                value={filters.address}
                onChange={(e) => handleFilterChange("address", e.target.value)}
                placeholder="ที่อยู่"
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
              />
            </div>
          </div>

          {/* Row 3: จังหวัด, ละติจูด, ลองจิจูด */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="province" className="block text-sm font-semibold text-slate-700">
                จังหวัด
              </label>
              <input
                id="province"
                type="text"
                value={filters.province}
                onChange={(e) => handleFilterChange("province", e.target.value)}
                placeholder="จังหวัด"
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
              />
            </div>
            <div>
              <label htmlFor="lat" className="block text-sm font-semibold text-slate-700">
                ละติจูด
              </label>
              <input
                id="lat"
                type="number"
                step="0.000001"
                value={filters.lat}
                onChange={(e) => handleFilterChange("lat", e.target.value)}
                placeholder="ละติจูด"
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
              />
            </div>
            <div>
              <label htmlFor="long" className="block text-sm font-semibold text-slate-700">
                ลองจิจูด
              </label>
              <input
                id="long"
                type="number"
                step="0.000001"
                value={filters.long}
                onChange={(e) => handleFilterChange("long", e.target.value)}
                placeholder="ลองจิจูด"
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
              />
            </div>
          </div>

          {/* Row 4: วันที่รับคำร้อง, วันที่จัดคิว, ติดตาม */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="requestDate" className="block text-sm font-semibold text-slate-700">
                วันที่รับคำร้อง
              </label>
              <input
                id="requestDate"
                type="date"
                value={filters.requestDate}
                onChange={(e) => handleFilterChange("requestDate", e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
              />
            </div>
            <div>
              <label htmlFor="targetDate" className="block text-sm font-semibold text-slate-700">
                วันที่จัดคิว
              </label>
              <input
                id="targetDate"
                type="date"
                value={filters.targetDate}
                onChange={(e) => handleFilterChange("targetDate", e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
              />
            </div>
            <div>
              <label htmlFor="isFollowUp" className="block text-sm font-semibold text-slate-700">
                ติดตาม/ทวงคำร้อง
              </label>
              <select
                id="isFollowUp"
                value={filters.isFollowUp}
                onChange={(e) => handleFilterChange("isFollowUp", e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
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
              <label htmlFor="meterOption" className="block text-sm font-semibold text-slate-700">
                ขนาด/ตัวเลือกมิเตอร์
              </label>
              <select
                id="meterOption"
                value={filters.meterOption}
                onChange={(e) => handleFilterChange("meterOption", e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
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
              <label htmlFor="caRefNo" className="block text-sm font-semibold text-slate-700">
                หมายเลขผู้ใช้ไฟ (CA Ref)
              </label>
              <input
                id="caRefNo"
                type="text"
                value={filters.caRefNo}
                onChange={(e) => handleFilterChange("caRefNo", e.target.value)}
                placeholder="CA Ref No"
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
              />
            </div>
            <div>
              <label htmlFor="peaNo" className="block text-sm font-semibold text-slate-700">
                หมายเลขเครื่องวัด (PEA No)
              </label>
              <input
                id="peaNo"
                type="text"
                value={filters.peaNo}
                onChange={(e) => handleFilterChange("peaNo", e.target.value)}
                placeholder="PEA No"
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
              />
            </div>
          </div>

          {/* Row 6: รายละเอียดเพิ่มเติม */}
          <div>
            <label htmlFor="description" className="block text-sm font-semibold text-slate-700">
              รายละเอียดเพิ่มเติม
            </label>
            <textarea
              id="description"
              value={filters.description}
              onChange={(e) => handleFilterChange("description", e.target.value)}
              placeholder="ค้นหาในรายละเอียดเพิ่มเติม"
              rows={3}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              className="flex-1 rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-800 focus:outline-none focus:ring-4 focus:ring-teal-100"
            >
              ค้นหา
            </button>
            <button
              type="button"
              onClick={handleClearFilters}
              disabled={!hasActiveFilters}
              className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-teal-600 hover:text-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              ล้างตัวกรอง
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
