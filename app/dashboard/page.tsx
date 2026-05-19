import RequestsList from "@/app/components/requests-list";

export default function Page() {
  return (
    <RequestsList
      title="Dashboard ช่าง"
      description="รายการผู้ขอคำร้องที่อยู่ในสถานะรอนัดหมาย พร้อมค้นหาได้จากทุกข้อมูล"
      fixedStatus="รอนัดหมาย"
      showAddButton={false}
      emptyMessage="ยังไม่มีคำร้องที่รอนัดหมาย"
    />
  );
}
