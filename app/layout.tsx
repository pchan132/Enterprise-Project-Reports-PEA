import type { Metadata } from "next";
import "./globals.css";
import TopNav from "@/app/components/top-navigation";

export const metadata: Metadata = {
  title: "ระบบรับคำร้องไฟฟ้า",
  description: "แบบฟอร์มรับคำร้องงานไฟฟ้า",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <TopNav />
        {children}</body>
    </html>
  );
}
