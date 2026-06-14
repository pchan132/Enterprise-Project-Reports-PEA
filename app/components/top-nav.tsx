"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useCallback, useRef } from "react";
import { logout } from "@/app/actions/auth";

type NavLink = {
  href: string;
  label: string;
  icon: React.ReactNode;
  isActive: (pathname: string) => boolean;
};

const navLinks: NavLink[] = [
  {
    href: "/",
    label: "หน้าแรก",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
    isActive: (pathname) => pathname === "/",
  },
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="7" height="9" x="3" y="3" rx="1" />
        <rect width="7" height="5" x="14" y="3" rx="1" />
        <rect width="7" height="9" x="14" y="12" rx="1" />
        <rect width="7" height="5" x="3" y="16" rx="1" />
      </svg>
    ),
    isActive: (pathname) => pathname === "/dashboard" || pathname.startsWith("/dashboard/"),
  },
  {
    href: "/requests",
    label: "รายการคำร้อง",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
        <path d="M15 2H9a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1z" />
        <path d="M12 11h4" /><path d="M12 16h4" />
        <path d="M8 11h.01" /><path d="M8 16h.01" />
      </svg>
    ),
    isActive: (pathname) => pathname === "/requests",
  },
  {
    href: "/requests/new",
    label: "เพิ่มคำร้อง",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12h14" />
        <path d="M12 5v14" />
      </svg>
    ),
    isActive: (pathname) => pathname === "/requests/new",
  },
  {
    href: "/logbook",
    label: "📒 สมุดบันทึก",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20" />
      </svg>
    ),
    isActive: (pathname) => pathname === "/logbook",
  },
];

type SidebarProps = {
  username: string;
};

// ─── Mobile top bar (hamburger) ───
function MobileHeader({ onToggle }: { onToggle: () => void }) {
  return (
    <div className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-slate-200/80 bg-white/90 px-3 backdrop-blur-lg lg:hidden">
      <span className="text-base font-bold text-teal-700">⚡ PEA คำร้อง</span>
      <button
        type="button"
        onClick={onToggle}
        aria-label="เปิดเมนู"
        className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/40"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="4" x2="20" y1="12" y2="12" />
          <line x1="4" x2="20" y1="6" y2="6" />
          <line x1="4" x2="20" y1="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}

// ─── Sidebar content (shared by desktop & mobile drawer) ───
function SidebarContent({
  username,
  pathname,
  onNavigate,
}: {
  username: string;
  pathname: string;
  onNavigate?: () => void;
}) {
  const router = useRouter();

  function handleBack() {
    if (onNavigate) onNavigate();
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/requests");
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* ── Brand ── */}
      <div className="flex h-16 shrink-0 items-center gap-2.5 border-b border-slate-200/60 px-5">
        <span className="text-2xl">⚡</span>
        <div>
          <p className="text-sm font-bold text-slate-900 leading-tight">PEA</p>
          <p className="text-[11px] font-medium text-slate-500 leading-tight">ระบบรับคำร้องไฟฟ้า</p>
        </div>
      </div>

      {/* ── Nav links ── */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="flex flex-col gap-1">
          {navLinks.map((link) => {
            const active = link.isActive(pathname);

            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={`group flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-all duration-200 ${
                    active
                      ? "bg-teal-700 text-white shadow-sm shadow-teal-800/20"
                      : "text-slate-600 hover:bg-slate-100 hover:text-teal-700"
                  }`}
                >
                  <span className={`shrink-0 ${active ? "text-white/90" : "text-slate-400 group-hover:text-teal-600"}`}>
                    {link.icon}
                  </span>
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* ── Quick action: back ── */}
        <div className="mt-6 border-t border-slate-200/60 pt-4">
          <button
            type="button"
            onClick={handleBack}
            className="flex h-10 w-full items-center gap-3 rounded-xl px-3 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-teal-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m12 19-7-7 7-7" />
              <path d="M19 12H5" />
            </svg>
            ย้อนกลับ
          </button>
        </div>
      </nav>

      {/* ── User info + logout ── */}
      <div className="shrink-0 border-t border-slate-200/60 px-3 py-4">
        <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-100 text-teal-700">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-800">{username}</p>
            <p className="text-[11px] text-slate-500">ผู้ใช้งาน</p>
          </div>
        </div>
        <form action={logout} className="mt-2">
          <button
            type="submit"
            className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white text-sm font-semibold text-rose-600 transition hover:bg-rose-50 hover:border-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-500/40"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" x2="9" y1="12" y2="12" />
            </svg>
            ออกจากระบบ
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Main export ───
export default function Sidebar({ username }: SidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  // ปิด drawer เมื่อเปลี่ยนหน้า
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // ปิด drawer เมื่อ resize ไป desktop
  useEffect(() => {
    function handleResize() {
      if (window.innerWidth >= 1024) {
        setMobileOpen(false);
      }
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Lock body scroll เมื่อ drawer เปิด
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [mobileOpen]);

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  return (
    <>
      {/* ── Desktop sidebar (fixed left) ── */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 border-r border-slate-200/60 bg-white lg:block">
        <SidebarContent username={username} pathname={pathname} />
      </aside>

      {/* ── Mobile header bar ── */}
      <MobileHeader onToggle={() => setMobileOpen(true)} />

      {/* ── Mobile drawer overlay ── */}
      {mobileOpen && (
        <div
          ref={overlayRef}
          className="fixed inset-0 z-50 lg:hidden"
          onClick={(e) => {
            if (e.target === overlayRef.current) closeMobile();
          }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

          {/* Drawer */}
          <aside className="relative h-full w-72 max-w-[85vw] bg-white shadow-2xl shadow-slate-900/20 animate-slide-in">
            {/* Close button */}
            <button
              type="button"
              onClick={closeMobile}
              aria-label="ปิดเมนู"
              className="absolute right-3 top-4 z-10 inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>

            <SidebarContent
              username={username}
              pathname={pathname}
              onNavigate={closeMobile}
            />
          </aside>
        </div>
      )}
    </>
  );
}
