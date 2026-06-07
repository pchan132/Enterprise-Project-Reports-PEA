"use client";

import { useActionState } from "react";
import { login, type LoginState } from "@/app/actions/auth";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(
    login,
    undefined,
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-white to-teal-50 px-4">
      {/* Decorative blobs */}
      <div className="pointer-events-none fixed -left-32 -top-32 h-96 w-96 rounded-full bg-teal-200/30 blur-3xl" />
      <div className="pointer-events-none fixed -bottom-32 -right-32 h-96 w-96 rounded-full bg-emerald-200/20 blur-3xl" />

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="rounded-3xl border border-white/60 bg-white/80 px-8 py-10 shadow-2xl shadow-teal-900/10 backdrop-blur-xl sm:px-10 sm:py-12">
          {/* Logo / Icon */}
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 text-3xl text-white shadow-lg shadow-teal-600/30">
            ⚡
          </div>

          {/* Title */}
          <h1 className="mt-6 text-center text-2xl font-bold text-slate-900">
            เข้าสู่ระบบ
          </h1>
          <p className="mt-2 text-center text-sm text-slate-500">
            ระบบรับคำร้องไฟฟ้า — PEA
          </p>

          {/* Error */}
          {state?.error && (
            <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-center text-sm font-medium text-rose-700">
              {state.error}
            </div>
          )}

          {/* Form */}
          <form action={formAction} className="mt-8 flex flex-col gap-5">
            {/* Username */}
            <div>
              <label
                htmlFor="username"
                className="mb-1.5 block text-sm font-semibold text-slate-700"
              >
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                placeholder="กรอก Username"
                className="h-12 w-full rounded-xl border border-slate-200 bg-white/90 px-4 text-base text-slate-900 shadow-sm transition-all duration-200 placeholder:text-slate-400 focus:border-teal-400 focus:outline-none focus:ring-4 focus:ring-teal-100"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-sm font-semibold text-slate-700"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                placeholder="กรอก Password"
                className="h-12 w-full rounded-xl border border-slate-200 bg-white/90 px-4 text-base text-slate-900 shadow-sm transition-all duration-200 placeholder:text-slate-400 focus:border-teal-400 focus:outline-none focus:ring-4 focus:ring-teal-100"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={pending}
              className="mt-2 flex h-12 w-full items-center justify-center rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 text-base font-bold text-white shadow-lg shadow-teal-600/25 transition-all duration-200 hover:from-teal-700 hover:to-emerald-700 hover:shadow-xl hover:shadow-teal-600/30 focus:outline-none focus:ring-4 focus:ring-teal-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="h-5 w-5 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="3"
                      className="opacity-25"
                    />
                    <path
                      d="M4 12a8 8 0 018-8"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      className="opacity-75"
                    />
                  </svg>
                  กำลังเข้าสู่ระบบ…
                </span>
              ) : (
                "เข้าสู่ระบบ"
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} ระบบรับคำร้องไฟฟ้า
        </p>
      </div>
    </div>
  );
}
