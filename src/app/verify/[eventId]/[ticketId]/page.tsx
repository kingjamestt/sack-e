'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState, use } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { CheckCircle2, XCircle, ShieldAlert, ScanLine } from 'lucide-react';

export default function TicketVerificationPage({ params }: { params: Promise<{ eventId: string, ticketId: string }> }) {
  const { eventId, ticketId } = use(params);
  const { user, loading } = useAuth();
  const router = useRouter();
  
  const [ticketData, setTicketData] = useState<any>(null);
  const [eventData, setEventData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      // User must be logged in to verify a ticket
      router.push(`/login?redirect=/verify/${eventId}/${ticketId}`);
    }
  }, [user, loading, router, eventId, ticketId]);

  useEffect(() => {
    async function fetchVerificationDetails() {
      if (!user) return;
      setIsLoading(true);
      setError('');
      
      try {
        // 1. Fetch Event to check authorization
        const eventRef = doc(db, 'events', eventId);
        const eventSnap = await getDoc(eventRef);
        
        if (!eventSnap.exists()) {
          throw new Error('Event not found.');
        }
        const eData = eventSnap.data();
        setEventData(eData);

        // AUTHORIZATION CHECK: Only the event creator can verify tickets
        if (eData.owner_id !== user.uid) {
          throw new Error('UNAUTHORIZED: You do not have permission to scan tickets for this event.');
        }

        // 2. Fetch Ticket
        const ticketRef = doc(db, 'tickets', ticketId);
        const ticketSnap = await getDoc(ticketRef);
        
        if (!ticketSnap.exists()) {
          throw new Error('Ticket not found in database.');
        }
        
        const tData = ticketSnap.data();
        
        // Ensure ticket belongs to this event
        if (tData.eventId !== eventId) {
          throw new Error('Ticket does not match this event.');
        }

        // Block scanning if ticket is pending a transfer
        if (tData.transfer_pending_to) {
          throw new Error('This ticket is currently locked pending a transfer. It cannot be scanned.');
        }

        setTicketData(tData);

      } catch (err: any) {
        setError(err.message || 'Failed to verify ticket.');
      } finally {
        setIsLoading(false);
      }
    }

    if (user) {
      fetchVerificationDetails();
    }
  }, [user, eventId, ticketId]);

  const handleMarkAsScanned = async () => {
    if (!user || !ticketData) return;
    setIsScanning(true);
    setError('');

    try {
      if (ticketData.status === 'scanned' || ticketData.status === 'used') {
        throw new Error('This ticket has ALREADY BEEN SCANNED.');
      }

      const ticketRef = doc(db, 'tickets', ticketId);
      await updateDoc(ticketRef, {
        status: 'scanned',
        scannedAt: new Date().toISOString(),
        scannedBy: user.uid
      });

      setTicketData({ ...ticketData, status: 'scanned' });
      setIsSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to update ticket status.');
    } finally {
      setIsScanning(false);
    }
  };

  if (loading || (isLoading && user)) {
    return (
      <main className="min-h-screen pt-8 md:pt-24 pb-20 px-6 flex justify-center items-center">
        <div className="animate-pulse flex gap-2 items-center text-on-surface-variant">
          <ScanLine size={24} className="animate-bounce text-primary" />
          <span className="ml-2 text-sm font-semibold tracking-widest uppercase">Checking Ticket...</span>
        </div>
      </main>
    );
  }

  if (!user) return null;

  // Render Authorization Error
  if (error && error.includes('UNAUTHORIZED')) {
    return (
      <main className="min-h-screen pt-8 md:pt-24 pb-20 px-4 flex justify-center items-center">
        <div className="bg-error/10 border border-error/20 rounded-3xl p-8 max-w-md w-full text-center">
          <ShieldAlert size={48} className="text-error mx-auto mb-4" />
          <h1 className="text-xl font-bold text-error mb-2">Access Denied</h1>
          <p className="text-error/80 text-sm mb-6">{error}</p>
          <button onClick={() => router.push('/')} className="px-6 py-3 bg-error text-white font-bold rounded-xl w-full">
            Return Home
          </button>
        </div>
      </main>
    );
  }

  // Render Already Scanned Error directly from data load
  const isAlreadyScanned = ticketData?.status === 'scanned' || ticketData?.status === 'used';

  return (
    <main className="min-h-screen pt-8 md:pt-24 pb-20 px-4 flex justify-center items-center">
      <div className="bg-surface-container border border-black/10 rounded-3xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden">
        
        {isSuccess ? (
          <div className="text-center relative z-10">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-success/20 rounded-full blur-[100px] pointer-events-none" />
            <div className="w-24 h-24 bg-success/20 text-success rounded-full flex items-center justify-center mx-auto mb-6 border border-success/30 shadow-[0_0_30px_rgba(0,255,0,0.3)]">
              <CheckCircle2 size={48} />
            </div>
            <h1 className="font-display text-4xl font-bold mb-2 text-success">VALID!</h1>
            <p className="text-on-surface-variant font-bold mb-2 text-lg">
              Ticket successfully scanned.
            </p>
            <div className="bg-black/20 p-4 rounded-xl mb-8 border border-white/5">
              <p className="text-xs uppercase text-on-surface-variant font-bold mb-1">Tier</p>
              <p className="font-bold text-xl">{ticketData.name || 'General Admission'}</p>
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-4 bg-surface-container-high border border-black/10 text-white font-bold rounded-xl hover:bg-black/5 transition-colors"
            >
              Scan Next Ticket
            </button>
          </div>
        ) : isAlreadyScanned ? (
           <div className="text-center relative z-10">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-error/20 rounded-full blur-[100px] pointer-events-none" />
            <div className="w-24 h-24 bg-error/20 text-error rounded-full flex items-center justify-center mx-auto mb-6 border border-error/30 shadow-[0_0_30px_rgba(255,0,0,0.3)]">
              <XCircle size={48} />
            </div>
            <h1 className="font-display text-4xl font-bold mb-2 text-error">STOP</h1>
            <p className="text-white font-bold mb-2 text-xl">
              TICKET ALREADY SCANNED
            </p>
            <p className="text-error mb-8 text-sm">
              This ticket is invalid because it was already used. Do not grant entry.
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-4 bg-surface-container-high border border-black/10 text-white font-bold rounded-xl hover:bg-black/5 transition-colors"
            >
              Scan Next Ticket
            </button>
          </div>
        ) : (
          <div className="relative z-10">
            <h1 className="font-display text-2xl font-bold text-center mb-6">Verify Ticket</h1>
            
            {error && (
              <div className="bg-error/10 border border-error/20 p-4 rounded-xl text-error text-sm mb-6 text-center font-bold">
                {error}
              </div>
            )}

            {ticketData && eventData && (
              <div className="space-y-6">
                <div className="bg-surface-container-high border border-white/5 p-5 rounded-2xl">
                  <h3 className="font-bold text-xl mb-4 leading-tight text-center">{eventData.title}</h3>
                  
                  <div className="p-4 bg-black/20 rounded-xl border border-white/5 text-center mb-4">
                    <span className="block text-[10px] uppercase tracking-wider text-on-surface-variant font-bold mb-1">Ticket Tier</span>
                    <span className="font-bold text-2xl text-primary">{ticketData.name || 'General Admission'}</span>
                  </div>

                  <p className="text-center text-xs text-on-surface-variant font-mono uppercase tracking-widest mb-4">
                    ID: {ticketData.id}
                  </p>
                </div>

                <button 
                  onClick={handleMarkAsScanned}
                  disabled={isScanning}
                  className="w-full py-6 bg-gradient-to-r from-primary to-secondary text-on-primary font-bold text-xl rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 shadow-[0_0_40px_rgba(var(--primary-rgb),0.3)]"
                >
                  {isScanning ? 'Marking...' : 'MARK AS SCANNED'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
