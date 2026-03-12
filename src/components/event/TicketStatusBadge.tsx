import React from 'react';
import { Badge } from '@/components/ui/Badge';

/** Maps DB registration_status enum → human-readable label + badge variant */
const ticketStatusConfig: Record<string, { label: string; variant: 'success' | 'warning' | 'error' | 'gold' | 'default' }> = {
  // DB enum values (uppercase)
  PENDING:    { label: 'Pending',    variant: 'warning' },
  CONFIRMED:  { label: 'Confirmed',  variant: 'success' },
  CHECKED_IN: { label: 'Checked In', variant: 'gold'    },
  REJECTED:   { label: 'Rejected',   variant: 'error'   },
  CANCELLED:  { label: 'Cancelled',  variant: 'default' },
  // Legacy fallback values
  active:     { label: 'Active',     variant: 'success' },
  used:       { label: 'Used',       variant: 'gold'    },
  cancelled:  { label: 'Cancelled',  variant: 'default' },
  refunded:   { label: 'Refunded',   variant: 'default' },
};

export function TicketStatusBadge({ status }: { status: string }) {
  const config = ticketStatusConfig[status] ?? { label: status, variant: 'default' as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
