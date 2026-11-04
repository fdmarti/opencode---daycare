import { Skeleton } from "@/components/common/ui/Skeleton";

export function KidProfileSkeleton() {
  return (
    <div className="max-w-205 w-full mx-auto px-10 pt-8.5 pb-20">
      <Skeleton className="h-4 w-24 mb-5" />
      <div className="flex gap-6.5 items-start flex-wrap">
        <div className="flex-[1_1_300px] min-w-0 flex flex-col gap-4.5">
          <div className="flex items-center gap-4.5">
            <Skeleton className="w-21 h-21 rounded-full" />
            <div className="flex-1 min-w-0 flex flex-col gap-2">
              <Skeleton className="h-7 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
        </div>
        <div className="w-75 max-w-full flex-none flex flex-col gap-3.5">
          <Skeleton className="h-12 w-full rounded-[14px]" />
          <Skeleton className="h-32 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}