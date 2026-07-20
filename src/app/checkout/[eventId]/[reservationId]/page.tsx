'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getEvent, releaseTickets, CartItem } from '@/lib/events';
import { EventData } from '@/types';
import { Loader2, CheckCircle, CreditCard, Lock, ArrowLeft, Timer, Wallet } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface ReservationData {
  items: CartItem[];
  total: number;
  status: string;
  expiresAt: string;
}

export default function CheckoutPage() {
  const params = useParams();
  const eventId = params.eventId as string;
  const reservationId = params.reservationId as string;
  const router = useRouter();
  
  const [event, setEvent] = useState<EventData | null>(null);
  const [reservation, setReservation] = useState<ReservationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [expired, setExpired] = useState(false);
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    async function loadData() {
      try {
        const eventData = await getEvent(eventId);
        setEvent(eventData);
      } catch (error) {
        console.error("Error loading checkout data", error);
      }
    }
    loadData();
  }, [eventId]);

  const handleExpire = async () => {
    setExpired(true);
    try {
      await releaseTickets(eventId, reservationId);
    } catch (error) {
      console.error("Error releasing tickets", error);
    }
  };

  // Listen to reservation document to set initial time and handle expiration
  useEffect(() => {
    const reservationRef = doc(db, `events/${eventId}/reservations/${reservationId}`);
    
    const unsubscribe = onSnapshot(reservationRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as ReservationData;
        setReservation(data);
        if (data.status === 'expired') {
          setExpired(true);
          setTimeLeft(0);
        } else if (data.status === 'pending') {
          // Calculate time left based on expiresAt
          const expires = new Date(data.expiresAt).getTime();
          const now = Date.now();
          const diffSeconds = Math.max(0, Math.floor((expires - now) / 1000));
          
          if (diffSeconds === 0) {
            handleExpire();
          } else if (timeLeft === null) {
            setTimeLeft(diffSeconds);
          }
        }
      } else {
        // Doc deleted or doesn't exist
        setExpired(true);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [eventId, reservationId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Countdown timer
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || expired) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev !== null && prev <= 1) {
          clearInterval(timer);
          handleExpire();
          return 0;
        }
        return prev ? prev - 1 : 0;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, expired]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCancel = async () => {
    await handleExpire();
    router.push(`/events/${eventId}`);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
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

  if (expired) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center text-center px-4">
        <Timer size={48} className="text-error mb-4" />
        <h1 className="text-3xl font-bold mb-4">Reservation Expired</h1>
        <p className="text-on-surface-variant mb-8 max-w-md">
          Your 15-minute hold on these tickets has expired. The tickets have been released back into the pool.
        </p>
        <Link href={`/events/${eventId}`} className="px-6 py-3 bg-primary text-on-primary rounded-xl font-bold hover:bg-primary-container transition-colors">
          Return to Event
        </Link>
      </main>
    );
  }

  if (!event || !reservation) return null;

  return (
    <main className="min-h-screen pt-24 md:pt-28 pb-24 relative px-4">
      <div className="max-w-4xl mx-auto flex flex-col lg:flex-row gap-8">
        
        {/* Left Column - Event Summary */}
        <div className="w-full lg:w-1/2 space-y-6">

          
          <div className="bg-surface-container rounded-3xl p-6 border border-black/10">
            <h2 className="text-2xl font-bold mb-4">Order Summary</h2>
            
            <div className="flex gap-4 mb-6 pb-6 border-b border-black/10">
              <div className="w-24 h-24 rounded-xl relative overflow-hidden shrink-0">
                <Image src={event.imageUrl || '/placeholder-event.jpg'} alt={event.title} fill className="object-cover" />
              </div>
              <div>
                <h3 className="font-bold text-lg leading-tight">{event.title}</h3>
                <p className="text-sm text-on-surface-variant mt-1">{event.location}</p>
              </div>
            </div>
            
            <div className="space-y-4">
              {reservation.items.map((item, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-on-surface-variant">{item.quantity}x {item.name}</span>
                  <span className="font-semibold">${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              
              <div className="flex justify-between items-center text-xl font-bold pt-4 border-t border-black/10">
                <span>Total</span>
                <span className="text-secondary">${reservation.total.toFixed(2)} TTD</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Payment */}
        <div className="w-full lg:w-1/2">
          <div className="bg-surface-container rounded-3xl p-6 border border-black/10">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold">Payment</h2>
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full font-mono font-bold transition-all ${timeLeft !== null && timeLeft < 120 ? 'bg-error text-white shadow-[0_0_15px_rgba(255,82,82,0.6)] animate-pulse' : 'bg-error/10 text-error'}`}>
                <Timer size={18} className={timeLeft !== null && timeLeft < 120 ? 'animate-bounce' : ''} />
                {timeLeft !== null ? formatTime(timeLeft) : '--:--'}
              </div>
            </div>

            <p className="text-on-surface-variant mb-6">
              Your tickets are reserved for the next 15 minutes. Please complete your payment below.
            </p>

            <div className="space-y-4">
              {/* WiPay Credit Card Form */}
              <form action="https://tt.wipayfinancial.com/plugins/payments/request" method="POST">
                <input type="hidden" name="account_number" value={process.env.NEXT_PUBLIC_WIPAY_ACCOUNT_NUMBER || "1234567890"} />
                <input type="hidden" name="country_code" value="TT" />
                <input type="hidden" name="currency" value="TTD" />
                <input type="hidden" name="environment" value={process.env.NEXT_PUBLIC_WIPAY_ENVIRONMENT || "sandbox"} />
                <input type="hidden" name="origin" value={(process.env.NEXT_PUBLIC_APP_NAME || 'Fete_Online').replace(/[^a-zA-Z0-9-_]/g, '_')} />
                <input type="hidden" name="order_id" value={`${eventId}_${reservationId}`} />
                <input type="hidden" name="total" value={reservation.total.toFixed(2)} />
                {/* We need the absolute URL for the callback */}
                <input type="hidden" name="response_url" value={`${origin}/api/wipay/callback`} />
                <input type="hidden" name="fee_structure" value="customer_pay" />
                <input type="hidden" name="method" value="credit_card_co" />
                
                <button type="submit" className="w-full py-4 px-6 rounded-2xl bg-surface-container-high border border-black/10 hover:border-primary transition-all flex items-center justify-between group relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                      <CreditCard size={20} />
                    </div>
                    <div className="text-left">
                      <span className="block font-bold">Pay with Credit Card</span>
                      <span className="text-xs text-on-surface-variant">Visa, Mastercard</span>
                    </div>
                  </div>
                  <span className="font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">Select &rarr;</span>
                </button>
              </form>

              {/* WiPay Debit / Bank / Voucher Form */}
              <form action="https://tt.wipayfinancial.com/plugins/payments/request" method="POST">
                <input type="hidden" name="account_number" value={process.env.NEXT_PUBLIC_WIPAY_ACCOUNT_NUMBER || "1234567890"} />
                <input type="hidden" name="country_code" value="TT" />
                <input type="hidden" name="currency" value="TTD" />
                <input type="hidden" name="environment" value={process.env.NEXT_PUBLIC_WIPAY_ENVIRONMENT || "sandbox"} />
                <input type="hidden" name="origin" value={(process.env.NEXT_PUBLIC_APP_NAME || 'Fete_Online').replace(/[^a-zA-Z0-9-_]/g, '_')} />
                <input type="hidden" name="order_id" value={`${eventId}_${reservationId}`} />
                <input type="hidden" name="total" value={reservation.total.toFixed(2)} />
                <input type="hidden" name="response_url" value={`${origin}/api/wipay/callback`} />
                <input type="hidden" name="fee_structure" value="customer_pay" />
                <input type="hidden" name="method" value="voucher" /> {/* Could be linx or debit, using voucher for variety */}
                
                <button type="submit" className="w-full py-4 px-6 rounded-2xl bg-surface-container-high border border-black/10 hover:border-secondary transition-all flex items-center justify-between group relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-secondary/0 via-secondary/5 to-secondary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center text-secondary">
                      <Wallet size={20} />
                    </div>
                    <div className="text-left font-sans">
                      <span className="block font-bold">Pay with Debit Card</span>
                      <span className="text-xs text-on-surface-variant">Local Debit, Linx</span>
                    </div>
                  </div>
                  <span className="font-bold text-secondary opacity-0 group-hover:opacity-100 transition-opacity">Select &rarr;</span>
                </button>
              </form>

              {/* DEV ONLY MOCK BUTTON */}
              {process.env.NODE_ENV === 'development' && (
                <button 
                  onClick={() => window.location.href = `/api/wipay/callback?status=success&order_id=${eventId}_${reservationId}&transaction_id=DEV-MOCK`}
                  className="w-full mt-8 py-4 px-6 rounded-2xl bg-surface/50 border border-dashed border-error/50 hover:bg-error/10 hover:border-error transition-all flex items-center justify-between"
                >
                  <div className="text-left">
                    <span className="block font-bold text-error">Skip Payment (Dev Only)</span>
                    <span className="text-xs text-error/70">Simulate a successful payment redirect</span>
                  </div>
                </button>
              )}
            </div>
            
            <p className="text-xs text-center text-on-surface-variant mt-6">
              Secured by our payment partner. You will be redirected to complete your payment securely.
            </p>
          </div>
        </div>

      </div>

      <div className="max-w-4xl mx-auto mt-12 flex justify-center">
        <button 
          onClick={handleCancel}
          className="inline-flex items-center text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors bg-surface-container/50 px-4 py-2 rounded-full backdrop-blur-md"
        >
          <ArrowLeft size={16} className="mr-2" /> Cancel & Return
        </button>
      </div>
    </main>
  );
}
