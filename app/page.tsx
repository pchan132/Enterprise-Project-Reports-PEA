import RequestsList from "@/app/components/requests-list";

// สถานะที่ช่างสามารถเปลี่ยนได้จากหน้า Dashboard
const STATUS_รอติดตั้ง = "รอติดตั้งมิเตอร์ / ดำเนินการเพิ่ม / ย้าย";
const STATUS_รอดำเนินการยกเลิก = "รอดำเนินการยกเลิก";
const STATUS_กำลังดำเนินการ = "กำลังดำเนินการ หน้างาน";
const STATUS_เสร็จสิ้น = "เสร็จสิ้น";
const STATUS_ยกเลิก = "ยกเลิก";

/**
 * กฎการเปลี่ยนสถานะสำหรับ Dashboard ช่าง (plain data — ส่งผ่าน Server Component ได้)
 *
 * รอติดตั้ง          → เลือกได้: รอติดตั้ง, กำลังดำเนินการ
 * รอดำเนินการยกเลิก  → เลือกได้: รอดำเนินการยกเลิก, กำลังดำเนินการ
 * กำลังดำเนินการ     → เลือกได้: รอติดตั้ง, กำลังดำเนินการ, เสร็จสิ้น, ยกเลิก
 */
const TECHNICIAN_STATUS_TRANSITIONS = [
  {
    from: STATUS_รอติดตั้ง,
    choices: [STATUS_รอติดตั้ง, STATUS_กำลังดำเนินการ],
  },
  {
    from: STATUS_รอดำเนินการยกเลิก,
    choices: [STATUS_รอดำเนินการยกเลิก, STATUS_กำลังดำเนินการ],
  },
  {
    from: STATUS_กำลังดำเนินการ,
    choices: [STATUS_รอติดตั้ง, STATUS_กำลังดำเนินการ, STATUS_เสร็จสิ้น, STATUS_ยกเลิก],
  },
];

export default function Home() {
  return (
    <RequestsList
      title="Dashboard ช่าง"
      description="รายการคำร้องที่พร้อมลงพื้นที่ — รอติดตั้งมิเตอร์, กำลังดำเนินการ หน้างาน และรอดำเนินการยกเลิก"
      fixedStatuses={[STATUS_รอติดตั้ง, STATUS_กำลังดำเนินการ, STATUS_รอดำเนินการยกเลิก]}
      statusTransitions={TECHNICIAN_STATUS_TRANSITIONS}
      showAddButton={false}
      emptyMessage="ไม่มีคำร้องที่รอลงพื้นที่"
    />
  );
}

