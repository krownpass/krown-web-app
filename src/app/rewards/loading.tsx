import { Skeleton } from '@/components/ui/Skeleton';

export default function RewardsLoading() {
  return (
    <div className="max-w-lg mx-auto px-4 md:px-6 py-6">
      <Skeleton className="h-8 w-36 mb-6 rounded-xl" />
      <Skeleton className="h-40 w-full rounded-2xl mb-6" />
      <Skeleton className="h-6 w-32 mb-3 rounded-lg" />
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
      </div>
    </div>
  );
}
