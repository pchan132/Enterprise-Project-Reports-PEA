import RequestForm from "@/app/components/request-form";

export default function page() {
  return (
    <div className="min-h-screen bg-slate-100 px-4 py-4 text-slate-950 sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <RequestForm />
      </div>
    </div>
  );
}
