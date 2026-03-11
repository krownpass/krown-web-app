'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Smartphone, Monitor, Tablet, Trash2 } from 'lucide-react';
import { ProtectedRoute } from '@/components/shared/ProtectedRoute';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { useDevices, useRemoveDevice } from '@/queries/useUser';
import { formatRelativeTime } from '@/lib/utils';
import { toast } from 'sonner';

function DeviceIcon({ type }: { type?: string }) {
  if (!type) return <Smartphone size={18} className="text-white/60" />;
  if (type.includes('tablet')) return <Tablet size={18} className="text-white/60" />;
  if (type.includes('desktop') || type.includes('laptop')) return <Monitor size={18} className="text-white/60" />;
  return <Smartphone size={18} className="text-white/60" />;
}

export default function DevicesPage() {
  const router = useRouter();
  const { data: devices = [], isLoading } = useDevices();
  const removeDevice = useRemoveDevice();

  const handleRemove = async (deviceId: string) => {
    try {
      await removeDevice.mutateAsync(deviceId);
      toast.success('Session removed');
    } catch {
      toast.error('Failed to remove session');
    }
  };

  return (
    <ProtectedRoute>
      <div className="max-w-lg mx-auto px-4 md:px-6 py-6">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} className="p-2 rounded-xl bg-[#1E1E1E] border border-[#2A2A2A] text-white/60">
            <ArrowLeft size={18} />
          </button>
          <h1 className="font-playfair text-xl font-bold text-white">Active Sessions</h1>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
          </div>
        ) : devices.length === 0 ? (
          <EmptyState icon="Smartphone" title="No active sessions" subtitle="Your logged-in devices will appear here" />
        ) : (
          <div className="space-y-3">
            {devices.map((device, i) => (
              <motion.div
                key={device.device_id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="flex items-center gap-4 p-4 bg-[#1E1E1E] border border-[#2A2A2A] rounded-xl"
              >
                <DeviceIcon type={device.device_type} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-white font-medium text-sm truncate">{device.device_name}</p>
                    {device.is_current && <Badge variant="success">Current</Badge>}
                  </div>
                  <p className="text-white/40 text-xs">Last active {formatRelativeTime(device.last_active)}</p>
                  {device.ip_address && <p className="text-white/30 text-xs font-mono">{device.ip_address}</p>}
                </div>
                {!device.is_current && (
                  <button
                    onClick={() => handleRemove(device.device_id)}
                    disabled={removeDevice.isPending}
                    className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
