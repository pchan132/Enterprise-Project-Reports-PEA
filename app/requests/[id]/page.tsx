import RequestDetail from "@/app/components/request-detail";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function Page({ params }: PageProps) {
  const { id } = await params;

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-4 text-slate-950 sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <RequestDetail requestId={id} />
      </div>
    </div>
  );
}
