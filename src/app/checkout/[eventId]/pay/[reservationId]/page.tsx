'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import { getEvent, getEventLink, finalizeReservation } from '@/lib/events';
import { EventData, ReservationData } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { CreditCard, AlertCircle, CheckCircle2, Ticket } from 'lucide-react';
import Link from 'next/link';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function PayReservationPage() {
  const params = useParams();
  const eventId = params.eventId as string;
  const reservationId = params.reservationId as string;
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  const [event, setEvent] = useState<EventData | null>(null);
  const [reservation, setReservation] = useState<ReservationData | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (authLoading) return;
      try {
        const eventData = await getEvent(eventId);
        setEvent(eventData);

        const resRef = doc(db, `events/${eventId}/reservations/${reservationId}`);
        const resSnap = await getDoc(resRef);
        if (resSnap.exists()) {
          setReservation({ id: resSnap.id, ...resSnap.data() } as ReservationData);
        }
      } catch (error) {
        console.error("Error loading payment data", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [eventId, reservationId, authLoading]);

  const totalAmount = reservation?.totalAmount || 0;

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (authLoading) return;
    
    if (!user) {
      setError("Please log in to purchase tickets.");
      return;
    }
    if (!event) {
      setError("Event data not loaded.");
      return;
    }
    if (reservation?.status !== 'approved') {
      setError("This request is not approved for payment yet.");
      return;
    }
    if (!cardNumber || !expiry || !cvc) {
      setError("Please fill out all payment fields.");
      return;
    }
    
    setIsProcessing(true);
    setError('');
    
    try {
      // Simulate payment delay
      await new Promise(r => setTimeout(r, 2000));
      
      // Finalize the reservation
      await finalizeReservation(eventId, reservationId);
      
      // Send the email receipt
      try {
        const ticketCount = reservation?.items.reduce((acc, item) => acc + item.quantity, 0) || 1;
        await fetch('/api/emails/send-receipt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: user.email,
            customerName: user.displayName || 'Customer',
            eventName: event.title,
            eventDate: event.date ? format(parseISO(event.date), 'MMM do, yyyy') : 'TBA',
            orderId: reservationId,
            totalAmount: `$${totalAmount.toFixed(2)}`,
            ticketCount: ticketCount
          })
        });
      } catch (emailErr) {
        console.error("Failed to send receipt email:", emailErr);
      }
      
      setSuccess(true);
      setTimeout(() => {
        router.push('/my-tickets');
      }, 2000);
      
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Payment failed. Please try again.');
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse flex gap-2 items-center text-on-surface-variant">
          <div className="w-3 h-3 bg-primary rounded-full"></div>
          <div className="w-3 h-3 bg-secondary rounded-full delay-75"></div>
          <div className="w-3 h-3 bg-primary rounded-full delay-150"></div>
        </div>
      </div>
    );
  }

  if (!event || !reservation) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-4">
        <h1 className="text-2xl font-bold">Request not found</h1>
        <Link href="/my-tickets" className="text-primary hover:underline">Go back to tickets</Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
        <CheckCircle2 size={64} className="text-green-500 mb-6" />
        <h1 className="text-3xl font-bold mb-4">Payment Successful!</h1>
        <p className="text-on-surface-variant mb-8 max-w-md">
          Your tickets have been issued. Redirecting you to your tickets...
        </p>
      </div>
    );
  }

  if (reservation.status !== 'approved') {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-4 text-center px-4">
        <AlertCircle size={64} className="text-yellow-500 mb-4" />
        <h1 className="text-2xl font-bold">Payment Not Available</h1>
        <p className="text-on-surface-variant max-w-md">
          This ticket request is currently <span className="font-bold text-white capitalize">{reservation.status}</span>. You can only pay for requests that have been approved by the committee.
        </p>
        <Link href="/my-tickets" className="text-primary hover:underline mt-4">Go back to tickets</Link>
      </div>
    );
  }

  return (
    <main className="min-h-screen pt-24 md:pt-28 pb-24 relative px-4">
      <div className="max-w-3xl mx-auto flex flex-col gap-8">
        
        <div className="w-full">
          <div className="bg-surface-container rounded-3xl p-6 border border-black/10">
            <h2 className="text-2xl font-bold mb-6">Complete Your Purchase</h2>

            {/* Order Summary */}
            <div className="mb-8">
              <h3 className="font-semibold text-sm text-on-surface-variant mb-4 uppercase tracking-wider">Approved Tickets for {event.title}</h3>
              <div className="space-y-3">
                {reservation.items.map((item, i) => (
                  <div key={i} className="flex justify-between items-center text-sm">
                    <span>{item.quantity}x {item.name}</span>
                    <span className="font-semibold">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center text-lg font-bold pt-4 border-t border-black/10">
                  <span>Total</span>
                  <span className="text-primary">${totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <form onSubmit={handlePayment} className="space-y-4">
              <h3 className="font-semibold text-sm text-on-surface-variant mb-4 uppercase tracking-wider flex items-center gap-2">
                <CreditCard size={16} /> Mock WiPay
              </h3>
              
              <div>
                <label className="block text-xs font-medium text-on-surface-variant mb-1">Card Number</label>
                <input 
                  type="text" 
                  required
                  placeholder="0000 0000 0000 0000" 
                  maxLength={19}
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value.replace(/[^0-9 ]/g, ''))}
                  className="w-full bg-surface px-4 py-3 rounded-xl border border-black/10 focus:border-primary outline-none transition-colors"
                />
              </div>
              
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-on-surface-variant mb-1">Expiry Date</label>
                  <input 
                    type="text" 
                    required
                    placeholder="MM/YY" 
                    maxLength={5}
                    value={expiry}
                    onChange={(e) => setExpiry(e.target.value)}
                    className="w-full bg-surface px-4 py-3 rounded-xl border border-black/10 focus:border-primary outline-none transition-colors"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-on-surface-variant mb-1">CVC</label>
                  <input 
                    type="text" 
                    required
                    placeholder="123" 
                    maxLength={4}
                    value={cvc}
                    onChange={(e) => setCvc(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full bg-surface px-4 py-3 rounded-xl border border-black/10 focus:border-primary outline-none transition-colors"
                  />
                </div>
              </div>
              
              {error && (
                <div className="p-4 bg-error/10 border border-error/20 rounded-xl flex items-start gap-3 text-error text-sm mt-4">
                  <AlertCircle size={18} className="shrink-0 mt-0.5" />
                  <p>{error}</p>
                </div>
              )}
              
              <button 
                type="submit" 
                disabled={isProcessing || totalAmount <= 0 || !user}
                className="w-full mt-6 py-4 px-6 rounded-xl bg-primary text-on-primary font-bold hover:bg-primary-container disabled:opacity-50 disabled:hover:bg-primary transition-all flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
                    Processing Payment...
                  </>
                ) : (
                  <>
                    <Ticket size={20} />
                    Pay ${totalAmount.toFixed(2)}
                  </>
                )}
              </button>
            </form>
            
            <p className="text-xs text-center text-on-surface-variant mt-4">
              This is a Mock WiPay form for demonstration purposes. No real charges will be made.
            </p>
          </div>
        </div>

      </div>
    </main>
  );
}
