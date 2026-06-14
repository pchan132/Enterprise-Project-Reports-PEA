import RequestForm from "@/app/components/request-form";

export default function Page() {
  return (
    <div className="flex flex-1 flex-col bg-slate-100 px-2 py-3 text-slate-950 sm:px-4 sm:py-6 lg:px-6">
      <div className="w-full">
        <RequestForm />
      </div>
    </div>
  );
}
