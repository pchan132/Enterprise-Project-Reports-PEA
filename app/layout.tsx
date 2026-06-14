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
      <body className="flex min-h-full bg-gradient-to-br from-slate-50 via-white to-slate-100 text-slate-900 selection:bg-teal-200 selection:text-teal-900">
        {username && <Sidebar username={username} />}
        <div className={`flex min-h-screen flex-1 flex-col ${username ? "lg:ml-60" : ""}`}>
          <main className="flex flex-1 flex-col">{children}</main>
        </div>
      </body>
    </html>
  );
}
