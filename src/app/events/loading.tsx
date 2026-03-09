import { Skeleton } from '@/components/ui/Skeleton';

export default function EventsLoading() {
  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-6">
      <Skeleton className="h-10 w-48 mb-6 rounded-xl" />
      <Skeleton className="h-48 w-full rounded-2xl mb-6" />
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-8 w-24 rounded-full flex-shrink-0" />)}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-64 rounded-2xl" />)}
      </div>
    </div>
  );
}
