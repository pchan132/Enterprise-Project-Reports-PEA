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
    <div className="sticky top-4 z-50 px-4 sm:px-6 lg:px-8">
      <nav className="mx-auto flex w-full max-w-7xl flex-col gap-3 rounded-2xl border border-white/60 bg-white/70 px-4 py-3 shadow-lg shadow-teal-900/5 backdrop-blur-xl backdrop-saturate-150 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex flex-wrap gap-2">
          {navLinks.map((link) => {
            const active = link.isActive(pathname);

            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`inline-flex h-11 items-center justify-center rounded-xl px-4 text-base font-bold transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-teal-100 ${
                  active
                    ? "bg-teal-700 text-white shadow-md shadow-teal-900/20"
                    : "text-slate-600 hover:bg-white/80 hover:text-teal-700 hover:shadow-sm"
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
          className="inline-flex h-11 w-full sm:w-auto items-center justify-center rounded-xl border border-slate-200/60 bg-white/80 px-5 text-base font-bold text-slate-700 shadow-sm transition-all duration-200 hover:border-teal-300 hover:text-teal-700 hover:shadow-md hover:bg-white focus:outline-none focus:ring-4 focus:ring-teal-100"
        >
          ⬅️ ย้อนกลับ
        </button>
      </nav>
    </div>
  );
}
