import { Skeleton } from "../common/ui/Skeleton";

/** Placeholder con la forma de una tarjeta, mientras carga la consulta. */
export function KidCardSkeleton() {
    return (
        <div className="flex items-center gap-3.5 min-w-0 bg-card border border-borde rounded-[18px] p-4">
            <Skeleton circle className="w-12 h-12" />
            <div className="flex-1 min-w-0 flex flex-col gap-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-6 w-16 rounded-full" />
        </div>
    );
}