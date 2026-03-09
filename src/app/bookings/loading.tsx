import { Skeleton } from '@/components/ui/Skeleton';

export default function BookingsLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 md:px-6 py-6">
      <Skeleton className="h-8 w-36 mb-6 rounded-xl" />
      <div className="flex gap-2 mb-4">
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-8 w-20 rounded-full" />)}
      </div>
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
      </div>
    </div>
  );
}
