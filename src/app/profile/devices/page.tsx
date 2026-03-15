'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Smartphone, Monitor, Tablet, Trash2 } from 'lucide-react';
import { ProtectedRoute } from '@/components/shared/ProtectedRoute';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useDevices, useRemoveDevice } from '@/queries/useUser';
import { formatRelativeTime } from '@/lib/utils';
import { toast } from 'sonner';
import { getDeviceMetadata } from '@/services/auth.service';
import { useAuthStore } from '@/stores/authStore';

function DeviceIcon({ type, isCurrent }: { type?: string; isCurrent?: boolean }) {
  if (isCurrent) return <Monitor size={18} className="text-white/60" />;
  if (!type) return <Smartphone size={18} className="text-white/60" />;
  if (type.toLowerCase().includes('tablet')) return <Tablet size={18} className="text-white/60" />;
  if (type.toLowerCase().includes('desktop') || type.toLowerCase().includes('laptop') || type.toLowerCase().includes('web')) return <Monitor size={18} className="text-white/60" />;
  return <Smartphone size={18} className="text-white/60" />;
}

export default function DevicesPage() {
  const router = useRouter();
  const { data: devices = [], isLoading } = useDevices();
  const removeDevice = useRemoveDevice();
  const { logout } = useAuthStore();

  const [currentDeviceId, setCurrentDeviceId] = React.useState<string | null>(null);
  const [deviceToRemove, setDeviceToRemove] = React.useState<{ id: string; isCurrent: boolean } | null>(null);

  React.useEffect(() => {
    getDeviceMetadata().then((meta) => {
      if (meta?.device_id) {
        setCurrentDeviceId(meta.device_id);
      }
    }).catch(console.error);
  }, []);

  const handleRemoveConfirm = async () => {
    if (!deviceToRemove) return;

    try {
      await removeDevice.mutateAsync(deviceToRemove.id);
      toast.success('Session removed');
      if (deviceToRemove.isCurrent) {
        await logout();
        router.push('/login');
      }
    } catch {
      toast.error('Failed to remove session');
    } finally {
      setDeviceToRemove(null);
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
            {devices.map((device, i) => {
              const isCurrent = device.is_current || device.device_id === currentDeviceId;
              
              return (
              <motion.div
                key={device.device_id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="flex items-center gap-4 p-4 bg-[#1E1E1E] border border-[#2A2A2A] rounded-xl"
              >
                <DeviceIcon type={device.device_type} isCurrent={isCurrent} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-white font-medium text-sm truncate">{device.device_name}</p>
                    {isCurrent && <Badge variant="success">Active</Badge>}
                  </div>
                  <p className="text-white/40 text-xs">Last active {formatRelativeTime(device.last_active)}</p>
                  {device.ip_address && <p className="text-white/30 text-xs font-mono">{device.ip_address}</p>}
                </div>
                <button
                  onClick={() => setDeviceToRemove({ id: device.device_id, isCurrent })}
                  disabled={removeDevice.isPending}
                  className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </motion.div>
            )})}
          </div>
        )}

        <Modal
          isOpen={!!deviceToRemove}
          onClose={() => setDeviceToRemove(null)}
          title="Remove Session"
          size="sm"
        >
          <p className="text-white/80 text-sm mb-6">
            {deviceToRemove?.isCurrent
              ? 'Removing the active device will log you out from this session. Are you sure?'
              : 'Are you sure you want to remove this session?'}
          </p>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              fullWidth
              onClick={() => setDeviceToRemove(null)}
              disabled={removeDevice.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              fullWidth
              onClick={handleRemoveConfirm}
              loading={removeDevice.isPending}
            >
              Remove
            </Button>
          </div>
        </Modal>
      </div>
    </ProtectedRoute>
  );
}
