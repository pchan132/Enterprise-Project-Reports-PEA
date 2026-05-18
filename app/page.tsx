import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-100 px-4 py-4 text-slate-950 sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto w-full max-w-6xl">
          <Link href="/requests/new" className="inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
            เพิ่มคำร้องใหม่
          </Link>
          <div className="mt-6">
            <Link href="/requests" className="inline-block bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
              ดูคำร้องทั้งหมด
            </Link>
          </div>
      </div>
    </main>
  );
}
