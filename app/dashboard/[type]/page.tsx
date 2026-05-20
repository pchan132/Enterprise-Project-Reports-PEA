import RequestsList from "@/app/components/requests-list";
import { REQUEST_TYPES } from "@/app/lib/data/request-types";

type PageProps = {
  params: Promise<{ type: string }>;
};

/**
 * หน้ารายการคำร้องตามประเภท
 *
 * URL: /dashboard/:type
 * เช่น /dashboard/ขอใช้ไฟใหม่ถาวร
 *
 * ใช้ RequestsList component เดิม โดยส่ง fixedRequestTypes prop
 * เพื่อกรองเฉพาะประเภทที่เลือก
 */
export default async function DashboardTypePage({ params }: PageProps) {
  const { type } = await params;
  const decodedType = decodeURIComponent(type);

  // หา label ของประเภท (ถ้ามี)
  const typeInfo = REQUEST_TYPES.find((rt) => rt.value === decodedType);
  const label = typeInfo?.label ?? decodedType;

  return (
    <RequestsList
      title={`คำร้อง — ${label}`}
      description={`แสดงรายการคำร้องประเภท "${label}" ทั้งหมด`}
      fixedRequestTypes={[decodedType]}
      showAddButton={false}
      emptyMessage={`ยังไม่มีคำร้องประเภท "${label}"`}
    />
  );
}
