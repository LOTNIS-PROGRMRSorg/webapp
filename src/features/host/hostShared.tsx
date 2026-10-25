import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { Booking } from '@/types';

// ── Shared loaders ────────────────────────────────────────────────────────────

export function useHostBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const reload = () => api.getHostBookings().then((r) => { setBookings(r.data || []); setError(''); }).catch((e) => setError(e.message)).finally(() => setLoading(false));
  useEffect(() => { reload(); }, []);
  return { bookings, error, loading, reload };
}

export const guestName = (b: Booking) => [b.renter?.first_name, b.renter?.last_name].filter(Boolean).join(' ') || b.renter?.email || 'Guest';
