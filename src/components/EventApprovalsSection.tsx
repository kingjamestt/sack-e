'use client';

import { useState, useEffect } from 'react';
import { getRequestedReservations, approveReservation, rejectReservation } from '@/lib/events';
import { useAuth } from '@/contexts/AuthContext';
import { Check, X, Clock, AlertCircle } from 'lucide-react';
import { ReservationData } from '@/types';

export default function EventApprovalsSection({ eventId, isOrganizer }: { eventId: string, isOrganizer: boolean }) {
  const { user } = useAuth();
  const [requests, setRequests] = useState<ReservationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      if (!user) return;
      try {
        const data = await getRequestedReservations(eventId);
        setRequests(data);
      } catch (err) {
        console.error("Failed to load requests", err);
        setError('Failed to load requests.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [eventId, user]);

  const handleApprove = async (reservationId: string) => {
    try {
      await approveReservation(eventId, reservationId);
      setRequests(requests.filter(r => r.id !== reservationId));
    } catch (err) {
      console.error(err);
      alert('Failed to approve request.');
    }
  };

  const handleReject = async (reservationId: string) => {
    if (!confirm('Are you sure you want to reject this request?')) return;
    try {
      await rejectReservation(eventId, reservationId);
      setRequests(requests.filter(r => r.id !== reservationId));
    } catch (err) {
      console.error(err);
      alert('Failed to reject request.');
    }
  };

  if (loading) {
    return <div className="animate-pulse h-32 bg-surface-container rounded-3xl mt-6"></div>;
  }

  // Filter requests based on role
  // Organizers (and admins) can see all requests. Committee members only see requests assigned to them.
  const visibleRequests = isOrganizer 
    ? requests 
    : requests.filter(r => r.committeeMemberId === user?.uid || r.committeeMemberId === user?.email);

  return (
    <div className="space-y-6 mt-6" id="approvals">
      <div className="bg-surface-container border border-black/10 rounded-3xl p-6 shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-display text-2xl font-bold flex items-center gap-2">
            <Clock size={24} className="text-secondary" /> Ticket Requests
          </h2>
        </div>

        {error && (
          <div className="p-4 bg-error/10 border border-error/20 rounded-xl flex items-start gap-3 text-error text-sm mb-6">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-black/10 text-on-surface-variant text-sm tracking-wider uppercase">
                <th className="pb-3 font-semibold pl-4">Buyer ID</th>
                <th className="pb-3 font-semibold">Tickets</th>
                <th className="pb-3 font-semibold">Total</th>
                <th className="pb-3 font-semibold">Date</th>
                <th className="pb-3 font-semibold text-right pr-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {visibleRequests.map(req => (
                <tr key={req.id} className="group hover:bg-black/5 transition-colors">
                  <td className="py-4 pl-4">
                    <span className="font-mono text-xs text-on-surface-variant">{req.userId.substring(0, 8)}...</span>
                  </td>
                  <td className="py-4">
                    <div className="flex flex-col gap-1">
                      {req.items.map((item, i) => (
                        <span key={i} className="text-sm font-semibold">
                          {item.quantity}x {item.name}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-4">
                    <span className="text-primary font-semibold">${req.totalAmount.toFixed(2)}</span>
                  </td>
                  <td className="py-4">
                    <span className="text-sm text-on-surface-variant">
                      {new Date(req.createdAt).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="py-4 text-right pr-4">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleApprove(req.id!)}
                        className="text-xs px-3 py-1.5 bg-success/20 text-success hover:bg-success/30 font-bold rounded flex items-center gap-1 transition-colors"
                      >
                        <Check size={14} /> Approve
                      </button>
                      <button 
                        onClick={() => handleReject(req.id!)}
                        className="text-xs px-3 py-1.5 bg-error/10 text-error hover:bg-error/20 font-bold rounded flex items-center gap-1 transition-colors"
                      >
                        <X size={14} /> Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {visibleRequests.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-sm text-on-surface-variant">
                    No pending ticket requests found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
