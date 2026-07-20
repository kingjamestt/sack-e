'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getEvent, getEventLink, TicketTier, getTicketTiers, reserveTickets, finalizeReservation, requestTickets } from '@/lib/events';
import { EventData, TeamMember } from '@/types';
import { getTeamMembers } from '@/lib/team';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, CreditCard, Loader2, Minus, Plus, AlertCircle, CheckCircle2, Ticket, Users } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function CheckoutPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = use(params);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  const [event, setEvent] = useState<EventData | null>(null);
  const [tiers, setTiers] = useState<TicketTier[]>([]);
  const [committeeMembers, setCommitteeMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  
  const [selectedCommitteeMemberId, setSelectedCommitteeMemberId] = useState('');
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [eventData, tiersData, teamData] = await Promise.all([
          getEvent(eventId),
          getTicketTiers(eventId),
          getTeamMembers(eventId)
        ]);
        setEvent(eventData);
        setTiers(tiersData);
        if (eventData?.requiresApproval) {
          setCommitteeMembers(teamData.filter(m => m.status === 'active' && (m.role === 'committee' || m.role === 'admin' || m.role === 'owner')));
        }
      } catch (error) {
        console.error("Error loading checkout data", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [eventId]);

  const handleQuantityChange = (tierId: string, delta: number, max: number) => {
    setQuantities(prev => {
      const current = prev[tierId] || 0;
      const next = current + delta;
      if (next < 0) return prev;
      if (next > max) return prev;
      return { ...prev, [tierId]: next };
    });
  };

  const selectedTiers = tiers.filter(t => (quantities[t.id] || 0) > 0);
  const totalAmount = selectedTiers.reduce((sum, tier) => sum + tier.price * quantities[tier.id], 0);

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (authLoading) return;
    
    if (!user) {
      setError("Please log in to purchase tickets.");
      return;
    }
    if (totalAmount <= 0) {
      setError("Please select at least one ticket.");
      return;
    }
    if (event?.requiresApproval && !selectedCommitteeMemberId) {
      setError("Please select a committee member to approve your request.");
      return;
    }
    if (!event?.requiresApproval && (!cardNumber || !expiry || !cvc)) {
      setError("Please fill out all payment fields.");
      return;
    }
    
    setIsProcessing(true);
    setError('');
    
    try {
      const cartItems = selectedTiers.map(tier => ({
        tierId: tier.id,
        name: tier.name,
        quantity: quantities[tier.id],
        price: tier.price
      }));

      if (event?.requiresApproval) {
        // Request tickets flow
        await requestTickets(eventId, cartItems, user.uid, selectedCommitteeMemberId);
        
        setSuccess(true);
        setTimeout(() => {
          router.push('/my-tickets');
        }, 3000);
      } else {
        // Purchase flow
        // Simulate payment delay
        await new Promise(r => setTimeout(r, 2000));
        
        // 1. Reserve the tickets
        const reservationId = await reserveTickets(eventId, cartItems, user.uid);
        
        // 2. Finalize the reservation (mocking 100% success rate for WiPay)
        await finalizeReservation(eventId, reservationId);
        
        setSuccess(true);
        setTimeout(() => {
          router.push('/my-tickets');
        }, 2000);
      }
      
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

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-4">
        <h1 className="text-2xl font-bold">Event not found</h1>
        <Link href="/" className="text-primary hover:underline">Go back home</Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
        <CheckCircle2 size={64} className="text-green-500 mb-6" />
        <h1 className="text-3xl font-bold mb-4">{event?.requiresApproval ? 'Request Sent!' : 'Payment Successful!'}</h1>
        <p className="text-on-surface-variant mb-8 max-w-md">
          {event?.requiresApproval ? 'Your ticket request has been sent to the committee member. You will be notified when it is approved.' : 'Your tickets have been issued. Redirecting you to your tickets...'}
        </p>
      </div>
    );
  }

  return (
    <main className="min-h-screen pt-8 md:pt-24 pb-24 relative px-4">
      <div className="max-w-5xl mx-auto flex flex-col lg:flex-row gap-8">
        
        {/* Left Column - Event & Ticket Selection */}
        <div className="w-full lg:w-1/2 space-y-6">
          <Link 
            href={getEventLink(event)}
            className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors mb-6 w-max"
          >
            &larr; Back to Event
          </Link>
          
          <div className="bg-surface-container rounded-3xl p-6 border border-black/10">
            <h2 className="text-2xl font-bold mb-4">Select Tickets</h2>
            
            <div className="flex gap-4 mb-8 pb-6 border-b border-black/10">
              <div className="w-24 h-24 rounded-xl relative overflow-hidden shrink-0">
                <Image src={event.imageUrl || '/placeholder-event.jpg'} alt={event.title} fill className="object-cover" />
              </div>
              <div>
                <h3 className="font-bold text-lg leading-tight">{event.title}</h3>
                <p className="text-sm text-on-surface-variant mt-1">{event.date} • {event.time}</p>
                <p className="text-sm text-on-surface-variant">{event.location}</p>
              </div>
            </div>
            
            <div className="space-y-4">
              {tiers.map(tier => {
                const available = tier.inventory - (tier.sold || 0) - (tier.reserved || 0);
                const isSoldOut = available <= 0;
                const qty = quantities[tier.id] || 0;
                
                return (
                  <div key={tier.id} className={`p-4 rounded-2xl border ${isSoldOut ? 'border-error/20 bg-error/5 opacity-75' : 'border-black/10 bg-surface-container-high'}`}>
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-bold">{tier.name}</h4>
                        <p className="text-sm text-primary font-semibold">${tier.price.toFixed(2)}</p>
                        {isSoldOut ? (
                          <span className="text-xs text-error font-semibold uppercase mt-1 block">Sold Out</span>
                        ) : (
                          <span className="text-xs text-on-surface-variant mt-1 block">{available} available</span>
                        )}
                      </div>
                      
                      {!isSoldOut && (
                        <div className="flex items-center gap-3 bg-surface rounded-xl p-1">
                          <button 
                            onClick={() => handleQuantityChange(tier.id, -1, available)}
                            disabled={qty === 0}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-xl font-bold hover:bg-black/10 disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
                          >
                            -
                          </button>
                          <span className="w-4 text-center font-semibold">{qty}</span>
                          <button 
                            onClick={() => handleQuantityChange(tier.id, 1, available)}
                            disabled={qty >= available || qty >= 10}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-xl font-bold hover:bg-black/10 disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
                          >
                            +
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {tiers.length === 0 && (
                <p className="text-on-surface-variant text-center py-4">No tickets currently available.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Payment & Summary */}
        <div className="w-full lg:w-1/2">
          <div className="bg-surface-container rounded-3xl p-6 border border-black/10 sticky top-24">
            <h2 className="text-2xl font-bold mb-6">Payment Details</h2>

            {/* Order Summary */}
            <div className="mb-8">
              <h3 className="font-semibold text-sm text-on-surface-variant mb-4 uppercase tracking-wider">Order Summary</h3>
              {selectedTiers.length > 0 ? (
                <div className="space-y-3">
                  {selectedTiers.map(tier => (
                    <div key={tier.id} className="flex justify-between items-center text-sm">
                      <span>{quantities[tier.id]}x {tier.name}</span>
                      <span className="font-semibold">${(tier.price * quantities[tier.id]).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center text-lg font-bold pt-4 border-t border-black/10">
                    <span>Total</span>
                    <span className="text-primary">${totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-on-surface-variant italic">No tickets selected.</p>
              )}
            </div>

            <form onSubmit={handlePayment} className="space-y-4">
              {event?.requiresApproval ? (
                <>
                  <h3 className="font-semibold text-sm text-on-surface-variant mb-4 uppercase tracking-wider flex items-center gap-2">
                    <Users size={16} /> Committee Approval Required
                  </h3>
                  <div>
                    <label className="block text-xs font-medium text-on-surface-variant mb-1">Select Committee Member</label>
                    <select 
                      required
                      value={selectedCommitteeMemberId}
                      onChange={e => setSelectedCommitteeMemberId(e.target.value)}
                      className="w-full bg-surface px-4 py-3 rounded-xl border border-black/10 focus:border-primary outline-none transition-colors"
                    >
                      <option value="" disabled>Select a member...</option>
                      {committeeMembers.map(m => (
                        <option key={m.id} value={m.userId || m.email}>{m.email}</option>
                      ))}
                    </select>
                    {committeeMembers.length === 0 && (
                      <p className="text-xs text-error mt-1">No active committee members available. Please contact the organizer.</p>
                    )}
                  </div>
                </>
              ) : (
                <>
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
                </>
              )}
              
              {error && (
                <div className="p-4 bg-error/10 border border-error/20 rounded-xl flex items-start gap-3 text-error text-sm mt-4">
                  <AlertCircle size={18} className="shrink-0 mt-0.5" />
                  <p>{error}</p>
                </div>
              )}

              {!user && (
                <div className="p-4 bg-secondary/10 border border-secondary/20 rounded-xl flex items-start gap-3 text-secondary text-sm mt-4">
                  <AlertCircle size={18} className="shrink-0 mt-0.5" />
                  <p>You must be logged in to purchase tickets.</p>
                </div>
              )}
              
              <button 
                type="submit" 
                disabled={isProcessing || totalAmount <= 0 || !user || (event?.requiresApproval && !selectedCommitteeMemberId)}
                className="w-full mt-6 py-4 px-6 rounded-xl bg-primary text-on-primary font-bold hover:bg-primary-container disabled:opacity-50 disabled:hover:bg-primary transition-all flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
                    {event?.requiresApproval ? 'Requesting...' : 'Processing Payment...'}
                  </>
                ) : (
                  <>
                    <Ticket size={20} />
                    {event?.requiresApproval ? `Request Tickets ($${totalAmount.toFixed(2)})` : `Pay $${totalAmount.toFixed(2)}`}
                  </>
                )}
              </button>
            </form>
            
            {!event?.requiresApproval && (
              <p className="text-xs text-center text-on-surface-variant mt-4">
                This is a Mock WiPay form for demonstration purposes. No real charges will be made.
              </p>
            )}
          </div>
        </div>

      </div>
    </main>
  );
}
