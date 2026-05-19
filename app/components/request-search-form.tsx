"use client";

import { FormEvent } from "react";

type RequestSearchFormProps = {
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onClear: () => void;
};

export default function RequestSearchForm({
  value,
  placeholder = "ค้นหาชื่อ เบอร์โทร เลขคำร้อง ที่อยู่ ประเภท สถานะ หรือข้อมูลอื่นๆ",
  onChange,
  onSubmit,
  onClear,
}: RequestSearchFormProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-2 sm:flex-row">
      <label htmlFor="request-search" className="sr-only">
        ค้นหาคำร้อง
      </label>
      <input
        id="request-search"
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-11 min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 text-base text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
      />
      <div className="grid grid-cols-2 gap-2 sm:flex">
        <button
          type="submit"
          className="h-11 rounded-lg bg-teal-700 px-4 text-sm font-semibold text-white transition hover:bg-teal-800 focus:outline-none focus:ring-4 focus:ring-teal-100"
        >
          ค้นหา
        </button>
        <button
          type="button"
          onClick={onClear}
          disabled={!value}
          className="h-11 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-teal-600 hover:text-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          ล้าง
        </button>
      </div>
    </form>
  );
}
