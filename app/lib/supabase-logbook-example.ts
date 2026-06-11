/**
 * Supabase JS client example for fetching Daily Logbook data.
 *
 * This file shows how you would query the same data using the
 * Supabase JS client instead of Prisma. The current project uses Prisma
 * (see app/api/logbook/route.ts), so this file is for reference only.
 *
 * Usage:
 *   import { createClient } from "@supabase/supabase-js";
 *   import { fetchLogbookData } from "@/app/lib/supabase-logbook-example";
 *   const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
 *   const data = await fetchLogbookData(supabase, "2026-06-12");
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClient = { from: (table: string) => any };

type LogbookSummary = {
  total: number;
  completed: number;
  attentionNeeded: number;
};

type LogbookRequest = {
  id: string;
  request_no: string | null;
  first_name: string;
  last_name: string;
  phone: string;
  description: string | null;
  request_type: string[];
  status: string;
  created_at: string;
};

type LogbookResponse = {
  summary: LogbookSummary;
  requests: LogbookRequest[];
};

/**
 * Fetch logbook data for a given date using the Supabase JS client.
 *
 * @param supabase - An initialised Supabase client instance
 * @param dateStr  - Date in "YYYY-MM-DD" format
 */
export async function fetchLogbookData(
  supabase: SupabaseClient,
  dateStr: string,
): Promise<LogbookResponse> {
  const dayStart = `${dateStr}T00:00:00.000Z`;
  const dayEnd = `${dateStr}T23:59:59.999Z`;

  const { data: requests, error } = await supabase
    .from("electrical_requests")
    .select(
      "id, request_no, first_name, last_name, phone, description, request_type, status, created_at",
    )
    .gte("created_at", dayStart)
    .lte("created_at", dayEnd)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Supabase query failed: ${error.message}`);
  }

  const rows: LogbookRequest[] = (requests as LogbookRequest[]) ?? [];

  const COMPLETED_STATUSES = [
    "เสร็จสิ้น",
    "รอติดตั้งมิเตอร์ / ดำเนินการเพิ่ม / ย้าย",
    "กำลังดำเนินการ หน้างาน",
  ];

  const total = rows.length;
  const completed = rows.filter((r) =>
    COMPLETED_STATUSES.includes(r.status),
  ).length;
  const attentionNeeded = rows.filter((r) =>
    (r.request_type as string[]).includes("คำร้องอื่นๆ"),
  ).length;

  return {
    summary: { total, completed, attentionNeeded },
    requests: rows,
  };
}
