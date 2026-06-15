import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "./components/top-nav";
import { getSession } from "@/app/lib/session";

export const metadata: Metadata = {
  title: "ระบบรับคำร้องไฟฟ้า",
  description: "แบบฟอร์มรับคำร้องงานไฟฟ้า",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const username = await getSession();

  return (
    <html lang="th" className="h-full antialiased">
      <body className="min-h-full bg-gradient-to-br from-slate-50 via-white to-slate-100 text-slate-900 selection:bg-teal-200 selection:text-teal-900">
        {username ? (
          <>
            {/* Desktop: sidebar fixed left — content shifted right via margin */}
            <Sidebar username={username} />
            {/* Content area: pt-14 on mobile offsets the fixed top bar height (h-14) */}
            <div className="flex min-h-screen flex-col pt-14 lg:ml-60 lg:pt-0">
              <main className="flex flex-1 flex-col">{children}</main>
            </div>
          </>
        ) : (
          <div className="flex min-h-screen flex-col">
            <main className="flex flex-1 flex-col">{children}</main>
          </div>
        )}
      </body>
    </html>
  );
}
