'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState, use } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { CheckCircle2, XCircle, Ticket as TicketIcon, Calendar, MapPin, Clock } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export default function TicketTransferPage({ params }: { params: Promise<{ ticketId: string }> }) {
  const { ticketId } = use(params);
  const { user, loading } = useAuth();
  const router = useRouter();
  
  const [ticketData, setTicketData] = useState<any>(null);
  const [eventData, setEventData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAccepting, setIsAccepting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      // User must be logged in to accept a ticket
      router.push(`/login?redirect=/my-tickets/transfer/${ticketId}`);
    }
  }, [user, loading, router, ticketId]);

  useEffect(() => {
    if (isSuccess) {
      const timer = setTimeout(() => {
        router.push('/my-tickets');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isSuccess, router]);

  useEffect(() => {
    async function fetchTransferDetails() {
      if (!user) return;
      setIsLoading(true);
      setError('');
      
      try {
        const ticketRef = doc(db, 'tickets', ticketId);
        const ticketSnap = await getDoc(ticketRef);
        
        if (!ticketSnap.exists()) {
          throw new Error('Ticket not found.');
        }
        
        const data = ticketSnap.data();
        
        // Validation checks
        if (data.status === 'scanned' || data.status === 'used') {
          throw new Error('This ticket has already been used and cannot be transferred.');
        }
        
        if (!data.transfer_pending_to) {
          throw new Error('This ticket is not currently pending transfer.');
        }

        // Verify the email matches if we want strict security:
        if (user.email && data.transfer_pending_to !== user.email.toLowerCase()) {
          throw new Error(`This ticket was transferred to ${data.transfer_pending_to}, but you are logged in as ${user.email}. Please log into the correct account.`);
        }

        setTicketData(data);

        if (data.eventId) {
          const eventRef = doc(db, 'events', data.eventId);
          const eventSnap = await getDoc(eventRef);
          if (eventSnap.exists()) {
            const eData = eventSnap.data();
            if (eData.status === 'cancelled') {
              throw new Error('This event has been cancelled. The ticket cannot be transferred.');
            }
            setEventData(eData);
          }
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load transfer details.');
      } finally {
        setIsLoading(false);
      }
    }

    if (user) {
      fetchTransferDetails();
    }
  }, [user, ticketId]);

  const handleAcceptTransfer = async () => {
    if (!user || !ticketData) return;
    setIsAccepting(true);
    setError('');

    try {
      const ticketRef = doc(db, 'tickets', ticketId);
      
      // Update owner and clear pending transfer
      await updateDoc(ticketRef, {
        owner_id: user.uid,
        transfer_pending_to: null, // Clear the transfer flag
      });

      setIsSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to accept the ticket transfer.');
      setIsAccepting(false);
    }
  };

  if (loading || (isLoading && user)) {
    return (
      <main className="min-h-screen pt-24 md:pt-32 pb-20 px-6 flex justify-center items-center">
        <div className="animate-pulse flex gap-2 items-center text-on-surface-variant">
          <div className="w-2 h-2 bg-primary rounded-full"></div>
          <div className="w-2 h-2 bg-secondary rounded-full delay-75"></div>
          <div className="w-2 h-2 bg-primary rounded-full delay-150"></div>
          <span className="ml-2 text-sm font-semibold tracking-widest uppercase">Loading Ticket...</span>
        </div>
      </main>
    );
  }

  if (!user) return null;

  return (
    <main className="min-h-screen pt-24 md:pt-32 pb-20 px-4 flex justify-center items-center">
      <div className="bg-surface-container border border-black/10 rounded-3xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden">
        {/* Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-primary/20 rounded-full blur-[100px] pointer-events-none" />

        {error ? (
          <div className="text-center relative z-10">
            <div className="w-20 h-20 bg-error/20 text-error rounded-full flex items-center justify-center mx-auto mb-6 border border-error/30 shadow-[0_0_30px_rgba(255,0,0,0.15)]">
              <XCircle size={40} />
            </div>
            <h1 className="font-display text-2xl font-bold mb-2">Transfer Invalid</h1>
            <p className="text-on-surface-variant mb-8 text-sm leading-relaxed">
              {error}
            </p>
            <button 
              onClick={() => router.push('/')}
              className="w-full py-3.5 bg-black/5 hover:bg-black/10 text-white font-bold rounded-xl border border-black/10 transition-colors text-sm"
            >
              Go to Homepage
            </button>
          </div>
        ) : isSuccess ? (
          <div className="text-center relative z-10">
            <div className="w-20 h-20 bg-success/20 text-success rounded-full flex items-center justify-center mx-auto mb-6 border border-success/30 shadow-[0_0_30px_rgba(0,255,0,0.2)]">
              <CheckCircle2 size={40} />
            </div>
            <h1 className="font-display text-3xl font-bold mb-2">Ticket Accepted!</h1>
            <p className="text-on-surface-variant mb-8">
              This ticket has been successfully transferred to your account.
            </p>
            <button 
              onClick={() => router.push('/my-tickets')}
              className="w-full py-4 bg-primary text-on-primary font-bold rounded-xl hover:bg-primary-container transition-colors shadow-lg"
            >
              View My Tickets
            </button>
          </div>
        ) : (
          <div className="relative z-10">
            <div className="flex items-center justify-center w-16 h-16 bg-primary/20 text-primary rounded-2xl mx-auto mb-6">
              <TicketIcon size={32} />
            </div>
            <h1 className="font-display text-2xl font-bold text-center mb-2">Ticket Transfer</h1>
            <p className="text-on-surface-variant text-center text-sm mb-8">
              Someone has sent you a ticket. Review the details below and accept to add it to your account.
            </p>

            {ticketData && eventData && (
              <div className="space-y-6">
                {/* Safe Preview (NO QR CODE) */}
                <div className="bg-surface-container-high border border-white/5 p-5 rounded-2xl">
                  <h3 className="font-bold text-xl mb-4 leading-tight">{eventData.title}</h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm text-on-surface-variant">
                      <Calendar size={16} className="text-primary" />
                      <span>{format(parseISO(eventData.date), 'EEEE, MMMM do, yyyy')}</span>
                    </div>
                    
                    <div className="flex items-center gap-3 text-sm text-on-surface-variant">
                      <Clock size={16} className="text-primary" />
                      <span>{eventData.time || (eventData.date ? format(parseISO(eventData.date), 'h:mm a') : 'TBA')}</span>
                    </div>
                    
                    <div className="flex items-center gap-3 text-sm text-on-surface-variant">
                      <MapPin size={16} className="text-primary" />
                      <span className="line-clamp-1">{eventData.location || 'TBA'}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center">
                    <div>
                      <span className="block text-[10px] uppercase tracking-wider text-on-surface-variant font-bold mb-1">Ticket Tier</span>
                      <span className="font-bold">{ticketData.name || 'General Admission'}</span>
                    </div>
                    <div className="text-right">
                      <span className="block text-[10px] uppercase tracking-wider text-on-surface-variant font-bold mb-1">Admit</span>
                      <span className="font-mono font-bold bg-black/5 px-2 py-1 rounded-md">1</span>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={handleAcceptTransfer}
                  disabled={isAccepting}
                  className="w-full py-4 bg-gradient-to-r from-primary to-secondary text-on-primary font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 shadow-lg shadow-primary/20"
                >
                  {isAccepting ? 'Accepting...' : 'Accept Ticket'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
