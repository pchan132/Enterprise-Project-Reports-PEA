"use client";
import RequestForm from "./components/request-form"
export default function Home() {
  return (
    <div>
      <RequestForm onSuccess={() => alert("บันทึกข้อมูลสำเร็จ")} />
    </div>
  );
}
