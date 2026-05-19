"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

type NavLink = {
  href: string;
  label: string;
  isActive: (pathname: string) => boolean;
};

const navLinks: NavLink[] = [
  {
    href: "/",
    label: "หน้าแรก",
    isActive: (pathname) => pathname === "/" || pathname === "/dashboard",
  },
  {
    href: "/dashboard",
    label: "Dashboard",
    isActive: (pathname) => pathname === "/dashboard",
  },
  {
    href: "/requests",
    label: "รายการคำร้อง",
    isActive: (pathname) => pathname === "/requests",
  },
  {
    href: "/requests/new",
    label: "เพิ่มคำร้อง",
    isActive: (pathname) => pathname === "/requests/new",
  },
];

export default function TopNavigation() {
  const pathname = usePathname();
  const router = useRouter();

  function handleBack() {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push("/requests");
  }

  return (
    <nav className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm sm:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {navLinks.map((link) => {
            const active = link.isActive(pathname);

            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`inline-flex h-10 items-center justify-center rounded-lg border px-3 text-sm font-semibold transition focus:outline-none focus:ring-4 focus:ring-teal-100 ${
                  active
                    ? "border-teal-700 bg-teal-700 text-white"
                    : "border-slate-300 bg-white text-slate-700 hover:border-teal-600 hover:text-teal-700"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:border-teal-600 hover:text-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-100"
        >
          ย้อนกลับ
        </button>
      </div>
    </nav>
  );
}
