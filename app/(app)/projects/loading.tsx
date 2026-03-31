import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="grid gap-6 xl:grid-cols-[310px_minmax(0,1fr)_360px]">
      <div className="space-y-4">
        <Skeleton className="h-[720px] rounded-3xl" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-52 rounded-3xl" />
        <Skeleton className="h-20 rounded-3xl" />
        <Skeleton className="h-[520px] rounded-3xl" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-[720px] rounded-3xl" />
      </div>
    </div>
  );
}
