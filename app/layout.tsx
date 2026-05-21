import type { Metadata } from "next";
import "./globals.css";
import TopNavigation from "./components/top-nav";

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
      <body className="flex min-h-full flex-col bg-gradient-to-br from-slate-50 via-white to-slate-100 text-slate-900 selection:bg-teal-200 selection:text-teal-900">
        <TopNavigation />
        {children}
      </body>
    </html>
  );
}
