import React from 'react';
import { Badge } from '@/components/ui/Badge';
import type { Booking } from '@/types/booking';

const statusConfig: Record<Booking['status'], { label: string; variant: 'success' | 'warning' | 'error' | 'gold' | 'burgundy' | 'default' }> = {
  pending:   { label: 'Pending',   variant: 'warning' },
  accepted:  { label: 'Accepted',  variant: 'success' },
  cancelled: { label: 'Cancelled', variant: 'error'   },
  rejected:  { label: 'Rejected',  variant: 'error'   },
};

export function BookingStatusBadge({ status }: { status: Booking['status'] }) {
  const config = statusConfig[status] ?? { label: status, variant: 'default' as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
