import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "เข้าสู่ระบบ — ระบบรับคำร้องไฟฟ้า",
  description: "เข้าสู่ระบบเพื่อใช้งานระบบรับคำร้องไฟฟ้า",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // ไม่แสดง TopNavigation ในหน้า login
  return <>{children}</>;
}
