'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Calendar, MapPin, Share2, Clock, Loader2, Plus, Minus } from 'lucide-react';
import { getEvent, getTicketTiers, reserveTickets, TicketTier, extractEventId } from '@/lib/events';
import { EventData } from '@/types';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { format, parseISO } from 'date-fns';

export default function EventDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = use(params);
  const id = extractEventId(rawId);
  const router = useRouter();
  const { user } = useAuth();
  
  const [checkoutError, setCheckoutError] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  
  const [event, setEvent] = useState<EventData | null>(null);
  const [tiers, setTiers] = useState<TicketTier[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Cart state: tierId -> quantity
  const [cart, setCart] = useState<Record<string, number>>({});
  const [reserving, setReserving] = useState(false);

  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedCart = sessionStorage.getItem(`pending_cart_${id}`);
      if (savedCart) {
        try {
          setCart(JSON.parse(savedCart));
          sessionStorage.removeItem(`pending_cart_${id}`);
        } catch (e) {
          console.error("Failed to parse saved cart", e);
        }
      }
    }
  }, [id]);

  useEffect(() => {
    async function loadData() {
      try {
        const [eventData, tiersData] = await Promise.all([
          getEvent(id),
          getTicketTiers(id)
        ]);
        setEvent(eventData);
        setTiers(tiersData);
      } catch (error) {
        console.error("Error loading event", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  const updateQuantity = (tierId: string, delta: number, available: number) => {
    setCart(prev => {
      const current = prev[tierId] || 0;
      const next = Math.max(0, Math.min(available, current + delta));
      if (next === 0) {
        const newCart = { ...prev };
        delete newCart[tierId];
        return newCart;
      }
      return { ...prev, [tierId]: next };
    });
  };

  const totalQuantity = Object.values(cart).reduce((a, b) => a + b, 0);
  const totalPrice = Object.entries(cart).reduce((total, [tierId, qty]) => {
    const tier = tiers.find(t => t.id === tierId);
    return total + (tier ? tier.price * qty : 0);
  }, 0);

  const handleCheckout = async () => {
    if (totalQuantity === 0) return;
    
    if (!user) {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(`pending_cart_${id}`, JSON.stringify(cart));
      }
      router.push(`/login?redirect=/events/${rawId}`);
      return;
    }
    
    setCheckoutError('');
    setReserving(true);
    try {
      const items = Object.entries(cart).map(([tierId, quantity]) => {
        const tier = tiers.find(t => t.id === tierId)!;
        return { tierId, quantity, name: tier.name, price: tier.price };
      });
      
      const reservationId = await reserveTickets(id, items, user.uid);
      router.push(`/checkout/${id}/${reservationId}`);
    } catch (error) {
      console.error("Failed to reserve tickets:", error);
      const e = error as Error;
      setCheckoutError(e.message || "Failed to reserve tickets. Some tiers may have sold out.");
      setReserving(false);
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
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
        <h1 className="text-3xl font-bold mb-4">Event Not Found</h1>
        <p className="text-on-surface-variant mb-8">The event you are looking for does not exist or has been removed.</p>
        <Link href="/" className="px-6 py-3 bg-primary text-on-primary rounded-xl font-bold hover:bg-primary-container transition-colors">
          Browse Events
        </Link>
      </div>
    );
  }

  return (
    <main className="min-h-screen pb-24 relative">
      <div className="fixed inset-0 z-0">
        <Image
          src={event.imageUrl || '/placeholder-event.jpg'}
          alt="Background Blur"
          fill
          priority
          className="object-cover opacity-20 blur-3xl scale-110"
        />
        <div className="absolute inset-0 bg-surface/80" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 md:px-6 pt-24 lg:pt-28">

        {/* Hero Section */}
        <div className="rounded-3xl overflow-hidden bg-surface-container border border-white/10 shadow-2xl mb-8 lg:mb-12 flex flex-col lg:flex-row min-h-[350px]">
          <div className="w-full lg:w-7/12 h-72 lg:h-auto relative">
            <Image
              src={event.imageUrl || '/placeholder-event.jpg'}
              alt={event.title}
              fill
              priority
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-surface/90 lg:from-transparent via-surface/40 lg:via-transparent to-transparent lg:to-surface-container" />
          </div>

          <div className="w-full lg:w-5/12 p-8 lg:p-12 flex flex-col justify-center relative backdrop-blur-xl bg-surface-container/90">
            <h1 className="font-display font-extrabold text-3xl md:text-5xl mb-2 leading-tight">
              {event.title}
            </h1>
            {event.organizerName && (
              <p className="text-primary font-bold tracking-wide uppercase text-sm mb-4">
                Presented by <span className="text-on-surface">{event.organizerName}</span>
              </p>
            )}
            
            <div className="space-y-4 mb-8 text-on-surface-variant mt-4">
              <div className="flex items-center gap-3">
                <Calendar className="text-primary" size={20} />
                <span className="font-semibold text-on-surface">{format(parseISO(event.date), 'EEEE, MMMM do, yyyy')}</span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="text-primary" size={20} />
                <span className="font-semibold text-on-surface">{event.time || (event.date ? format(parseISO(event.date), 'h:mm a') : 'TBA')}</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="text-secondary" size={20} />
                <span className="font-semibold text-on-surface">{event.location || 'TBA'}</span>
              </div>
            </div>

            <button 
              onClick={async () => {
                const shareData = {
                  title: event.title,
                  text: `Check out ${event.title} on Sack-E Online!`,
                  url: window.location.href
                };
                try {
                  if (navigator.share) {
                    await navigator.share(shareData);
                  } else {
                    await navigator.clipboard.writeText(shareData.url);
                    setIsCopied(true);
                    setTimeout(() => setIsCopied(false), 2000);
                  }
                } catch (err) {
                  console.error("Error sharing:", err);
                }
              }}
              className="flex items-center gap-2 px-4 py-2 bg-surface-container hover:bg-surface-container-high rounded-full transition-colors text-sm font-semibold border border-white/5"
            >
              <Share2 size={16} />
              {isCopied ? 'Copied!' : 'Share'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pb-12">
          {/* Main Content */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-8">
            <section className="bg-surface-container p-6 lg:p-8 rounded-3xl border border-white/5 shadow-lg">
              <h3 className="font-display text-2xl lg:text-3xl font-bold mb-6">About the Event</h3>
              <div className="prose prose-invert prose-p:text-on-surface-variant max-w-none leading-relaxed">
                <p>{event.description}</p>
                <p className="mt-4">
                  Join us for an unforgettable experience filled with amazing performances, great food, and incredible vibes. 
                  Don&apos;t miss out on what promises to be the highlight of the season.
                </p>
              </div>
            </section>
          </div>

          {/* Tickets Section */}
          <div className="lg:col-span-7 xl:col-span-8 sticky top-24">
            <div className="bg-surface-container/80 backdrop-blur-md border border-white/10 rounded-3xl p-6 lg:p-10 shadow-2xl">
              <h3 className="font-display text-2xl font-bold mb-6">Select Tickets</h3>
              
              {event.status !== 'active' ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                  <div className="relative mb-6">
                    <div className="absolute inset-0 bg-error/20 blur-xl rounded-full"></div>
                    <div className="relative inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/5 border border-white/10 text-error shadow-lg">
                      <Minus size={26} />
                    </div>
                  </div>
                  <h4 className="font-display text-2xl font-bold tracking-tight text-white mb-2">
                    {event.status === 'cancelled' ? 'Event Cancelled' : 'Event Unavailable'}
                  </h4>
                  <p className="text-sm text-on-surface-variant max-w-sm mb-8 leading-relaxed">
                    {event.status === 'cancelled' 
                      ? 'This event has been cancelled by the organizer. If you have purchased tickets, please check your inbox or reach out for refunds.' 
                      : 'This event is currently suspended or pending platform approval. Ticket sales are disabled.'}
                  </p>
                </div>
              ) : (now && new Date(event.date) < now) ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                  <div className="relative mb-6">
                    <div className="absolute inset-0 bg-surface-container-high blur-xl rounded-full"></div>
                    <div className="relative inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-black/5 border border-black/10 text-on-surface-variant shadow-lg">
                      <Clock size={26} />
                    </div>
                  </div>
                  <h4 className="font-display text-2xl font-bold tracking-tight text-on-surface mb-2">Event Ended</h4>
                  <p className="text-sm text-on-surface-variant max-w-sm mb-8 leading-relaxed">
                    This event has already passed. Ticket sales are now closed.
                  </p>
                </div>
              ) : event.salesPaused ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                  <div className="relative mb-6">
                    <div className="absolute inset-0 bg-orange-500/20 blur-xl rounded-full"></div>
                    <div className="relative inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/5 border border-white/10 text-orange-500 shadow-lg">
                      <Minus size={26} />
                    </div>
                  </div>
                  <h4 className="font-display text-2xl font-bold tracking-tight text-white mb-2">Sales Paused</h4>
                  <p className="text-sm text-on-surface-variant max-w-sm mb-8 leading-relaxed">
                    Ticket sales for this event are temporarily paused. Please check back later.
                  </p>
                </div>
              ) : !now ? (
                <div className="animate-pulse space-y-4">
                  <div className="h-24 bg-white/5 rounded-2xl"></div>
                  <div className="h-24 bg-white/5 rounded-2xl"></div>
                </div>
              ) : (event.salesStartDateTime && now < new Date(event.salesStartDateTime)) ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                  <div className="relative mb-6">
                    <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full"></div>
                    <div className="relative inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/5 border border-white/10 text-primary shadow-lg">
                      <Clock size={26} className="animate-pulse" />
                    </div>
                  </div>
                  <h4 className="font-display text-2xl font-bold tracking-tight text-white mb-2">Tickets Not Yet Available</h4>
                  <p className="text-sm text-on-surface-variant max-w-sm mb-8 leading-relaxed">
                    Sales will begin on <span className="text-white font-semibold">{format(parseISO(event.salesStartDateTime), 'MMMM do, yyyy h:mm a')}</span>.
                  </p>
                  
                  <div className="flex items-center gap-3">
                    {(() => {
                      const diff = new Date(event.salesStartDateTime).getTime() - now.getTime();
                      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
                      const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
                      const m = Math.floor((diff / 1000 / 60) % 60);
                      const s = Math.floor((diff / 1000) % 60);
                      
                      const timeUnits = [
                        { label: 'days', value: d },
                        { label: 'hours', value: h },
                        { label: 'mins', value: m },
                        { label: 'secs', value: s },
                      ];

                      return timeUnits.map((unit, idx) => (
                        <div key={idx} className="flex items-center">
                          <div className="flex flex-col items-center justify-center bg-white/5 border border-white/5 rounded-2xl w-16 h-16">
                            <span className="font-mono text-xl font-extrabold text-white leading-none mb-1">
                              {String(unit.value).padStart(2, '0')}
                            </span>
                            <span className="text-[9px] uppercase font-bold text-on-surface-variant tracking-wider leading-none">
                              {unit.label}
                            </span>
                          </div>
                          {idx < timeUnits.length - 1 && (
                            <span className="text-lg font-bold text-white/20 mx-1">:</span>
                          )}
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {tiers.filter(t => !t.expiresAt || new Date(t.expiresAt) > now).map((tier) => {
                    const available = tier.inventory - (tier.sold + (tier.reserved || 0));
                  const isSoldOut = available <= 0;
                  const isPaused = tier.salesPaused;
                  const qty = cart[tier.id] || 0;

                  return (
                    <div 
                      key={tier.id} 
                      className={`p-4 rounded-2xl border ${isSoldOut && qty === 0 ? 'border-white/5 bg-surface-container opacity-60 grayscale' : isPaused && qty === 0 ? 'border-orange-500/20 bg-surface-container opacity-80' : qty > 0 ? 'border-primary bg-primary/5' : 'border-white/10 bg-surface-container-high'} transition-all relative overflow-hidden`}
                    >
                      {isSoldOut && qty === 0 && !isPaused && (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/40 backdrop-blur-[1px] z-10 pointer-events-none">
                          <div className="border-2 border-error text-error font-display font-black text-2xl uppercase tracking-widest px-4 py-2 rotate-[-10deg] rounded-lg opacity-80 shadow-lg">
                            Sold Out
                          </div>
                        </div>
                      )}
                      <div className="flex justify-between items-start mb-4 relative z-0">
                        <div>
                          <h4 className={`font-bold text-lg ${isSoldOut && qty === 0 ? 'text-on-surface-variant' : ''}`}>{tier.name}</h4>
                          {isPaused ? (
                            <span className="text-xs uppercase tracking-wider font-semibold text-orange-500">
                              Sales Paused
                            </span>
                          ) : (isSoldOut || available < 40) && (
                            <span className={`text-xs uppercase tracking-wider font-semibold ${isSoldOut && qty === 0 ? 'text-error/80' : 'text-secondary'}`}>
                              {isSoldOut ? 'Sold Out' : 'Almost Sold Out'}
                            </span>
                          )}
                        </div>
                        <span className={`font-bold text-xl ${isSoldOut && qty === 0 ? 'text-on-surface-variant' : 'text-secondary'}`}>${tier.price.toFixed(2)}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-on-surface-variant">Quantity</span>
                        <div className="flex items-center gap-3 bg-surface-container border border-white/10 rounded-full p-1">
                          <button 
                            disabled={qty === 0 || reserving || isPaused}
                            onClick={() => updateQuantity(tier.id, -1, available)}
                            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container-high disabled:opacity-50 transition-colors"
                          >
                            <Minus size={16} />
                          </button>
                          <span className="font-bold w-4 text-center">{qty}</span>
                          <button 
                            disabled={isSoldOut || qty >= available || reserving || isPaused}
                            onClick={() => updateQuantity(tier.id, 1, available)}
                            className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-container-high hover:bg-primary/20 hover:text-primary disabled:opacity-50 transition-colors"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
                  {tiers.filter(t => !t.expiresAt || new Date(t.expiresAt) > now).length === 0 && (
                    <div className="text-center py-8 text-on-surface-variant">
                      No ticket tiers are currently available.
                    </div>
                  )}
                </div>
              )}

              {/* Checkout Footer */}
              {event.status === 'active' && !(now && new Date(event.date) < now) && (!event.salesStartDateTime || (now && now >= new Date(event.salesStartDateTime))) && (
              <div className="mt-8 pt-6 border-t border-black/10">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-on-surface-variant font-semibold">Total ({totalQuantity})</span>
                  <span className="text-2xl font-bold text-secondary">${totalPrice.toFixed(2)}</span>
                </div>
                
                {checkoutError && (
                  <div className="mb-4 p-3 bg-error/10 text-error rounded-lg text-sm font-semibold">
                    {checkoutError}
                  </div>
                )}
                
                <button 
                  disabled={totalQuantity === 0 || reserving}
                  onClick={handleCheckout}
                  className={`w-full py-4 rounded-xl font-bold transition-all flex justify-center items-center gap-2 ${
                    totalQuantity === 0 
                      ? 'bg-surface/50 text-on-surface-variant cursor-not-allowed'
                      : reserving
                        ? 'bg-primary/50 text-white cursor-wait'
                        : 'bg-gradient-to-r from-primary to-secondary text-on-primary hover:opacity-90 hover:scale-[1.02] shadow-lg'
                  }`}
                >
                  {reserving && <Loader2 size={18} className="animate-spin" />}
                  {reserving ? 'Reserving...' : (!user && totalQuantity > 0) ? 'Sign in to Checkout' : 'Proceed to Checkout'}
                </button>
              </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-center">
          <Link href="/" className="inline-flex items-center px-6 py-3 rounded-full bg-surface-container hover:bg-surface-container-high transition-colors text-on-surface font-semibold shadow-sm border border-white/5">
            <ArrowLeft size={16} className="mr-2" /> Back to All Events
          </Link>
        </div>
      </div>
    </main>
  );
}
