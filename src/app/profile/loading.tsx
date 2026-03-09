import { Skeleton } from '@/components/ui/Skeleton';

export default function ProfileLoading() {
  return (
    <div className="max-w-lg mx-auto px-4 md:px-6 py-6">
      <div className="flex flex-col items-center mb-8">
        <Skeleton className="w-24 h-24 rounded-full mb-3" />
        <Skeleton className="h-6 w-40 mb-2 rounded-lg" />
        <Skeleton className="h-4 w-24 rounded-lg" />
      </div>
      <div className="grid grid-cols-3 gap-3 mb-6">
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
      </div>
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}
      </div>
    </div>
  );
}
