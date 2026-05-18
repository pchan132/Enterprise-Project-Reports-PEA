"use client";
import { useState, ChangeEvent } from "react";

// Data
import { REQUEST_TYPES } from "@/app/lib/data/request-types";
import { SUB_DISTRICTS } from "@/app/lib/data/subdistricts";

type Props = {
  onSuccess: () => void;
};

interface RequestFormData {
  firstName: string;
  lastName: string;
  phone: string;
  phone2: string;
  address: string;
  subDistrict: string;
  district: string;
  province: string;
  lat: number;
  long: number;
  description: string;
  requestDate: string;
  requestType: string;
  status: string;
  isFollowUp: boolean;
  targetDate: string;
}

export default function RequestForm({ onSuccess }: Props) {
  const [loading, setLoading] = useState(false);

  // คลาสสำหรับ input, select, textarea เพื่อให้ดูสวยงามและเป็นระเบียบ
  const fieldClass =
    "rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-purple-700";

  const [formData, setFormData] = useState<RequestFormData>({
    firstName: "", // ชื่อ
    lastName: "", // นามสกุล
    phone: "", // เบอร์โทร
    phone2: "", // เบอร์โทร 2
    address: "", // ที่อยู่

    subDistrict: "", // ตำบล
    district: "", // อำเภอ
    province: "", // จังหวัด

    lat: 0, // ตำแหน่งใน GPS
    long: 0, // ตำแหน่งใน GPS ข้องหลัง

    description: "", // คำอธิบายเพิ่มเติม

    requestDate: "", // วันที่ทำคำร้อง

    requestType: "", // เรื่องหรือ ประเภทของคำร้อง

    status: "รับเรื่อง", // สถานะคำร้อง

    isFollowUp: false, // โดน ทวงคำร้อง

    targetDate: "", // วันที่จัดคิวให้

    // ไม่ต้องในใน Form
    // createdAt : "",   // วันที่สร้าง
    // updatedAt: ""    // วันที่อัพเดท
  });

  //   จัดการกับ input
  function handleChange(
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ): void {
    const { name, value, type } = e.target;

    // ถ้าเป็น checkbox ให้ใช้ checked แทน value
    const newValue =
      type === "checkbox" ? (e.target as HTMLInputElement).checked : value;

    // Logic เมื่อเลือกอำเภอ จะต้องรีเซ็ตตำบลด้วย
    if (name === "district") {
      setFormData((prev) => ({
        ...prev,
        district: value, // อัพเดทอำเภอ
        subDistrict: "", // รีเซ็ตตำบลเมื่อเปลี่ยนอำเภอ
      }));
    }

    setFormData((prev) => ({
      ...prev,
      [name]: newValue,
    }));
  }

  // จัดการกับ submit
  function handleSubmit(e: React.FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    setLoading(true);
    console.log(formData);
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-2xl bg-purple-100 p-3">
          {/* <PlusCircle className="h-6 w-6 text-purple-700" /> */}
        </div>

        <div>
          <h2 className="text-xl font-bold text-slate-800">เพิ่มคำร้องใหม่</h2>

          <p className="text-sm text-slate-500">กรอกข้อมูลคำร้องของผู้ใช้ไฟ</p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 gap-4 md:grid-cols-2"
      >
        <input
          placeholder="ชื่อ"
          required
          value={formData.firstName}
          onChange={(e) =>
            setFormData({
              ...formData,
              firstName: e.target.value,
            })
          }
          className={fieldClass}
        />

        <input
          placeholder="นามสกุล"
          required
          value={formData.lastName}
          onChange={(e) =>
            setFormData({
              ...formData,
              lastName: e.target.value,
            })
          }
          className={fieldClass}
        />

        <input
          placeholder="เบอร์โทร"
          required
          value={formData.phone}
          onChange={(e) =>
            setFormData({
              ...formData,
              phone: e.target.value,
            })
          }
          className={fieldClass}
        />

        <input
          placeholder="เบอร์โทร 2"
          value={formData.phone2}
          onChange={(e) =>
            setFormData({
              ...formData,
              phone2: e.target.value,
            })
          }
          className={fieldClass}
        />

        <section></section>

        {/* เรื่องหรือประเภทของคำร้อง */}
        <select
          value={formData.requestType}
          onChange={handleChange}
          name="requestType"
          className={fieldClass}
        >
          <option value="">เลือกประเภทคำร้อง</option>
          {REQUEST_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>

        {/* อำเภอ */}
        <select
          value={formData.district}
          onChange={handleChange}
          name="district"
          className={fieldClass}
        >
          <option value="">เลือกอำเภอ</option>
          {Object.keys(SUB_DISTRICTS).map((district) => (
            <option key={district} value={district}>
              {district}
            </option>
          ))}
        </select>

        {/* ตำบล */}
        <select
          value={formData.subDistrict}
          onChange={handleChange}
          name="subDistrict"
          className={fieldClass}
          disabled={!formData.district}
        >
          <option value="">เลือกตำบล</option>
          {formData.district &&
            SUB_DISTRICTS[formData.district]?.map((subDistrict) => (
              <option key={subDistrict} value={subDistrict}>
                {subDistrict}
              </option>
            ))}
        </select>

        <textarea
          placeholder="รายละเอียดเพิ่มเติม"
          rows={4}
          value={formData.description}
          onChange={(e) =>
            setFormData({
              ...formData,
              description: e.target.value,
            })
          }
          className={`${fieldClass} md:col-span-2`}
        />

        <button
          disabled={loading}
          className="md:col-span-2 rounded-2xl bg-purple-700 px-5 py-4 font-semibold text-white transition hover:bg-purple-800 disabled:opacity-50"
        >
          {loading ? "กำลังบันทึก..." : "บันทึกคำร้อง"}
        </button>
      </form>
    </div>
  );
}
