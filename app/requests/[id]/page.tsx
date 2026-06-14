import RequestDetail from "@/app/components/request-detail";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function Page({ params }: PageProps) {
  const { id } = await params;

  return (
    <div className="flex flex-1 flex-col bg-slate-100 px-2 py-3 text-slate-950 sm:px-4 sm:py-6 lg:px-6">
      <div className="w-full">
        <RequestDetail requestId={id} />
      </div>
    </div>
  );
}
