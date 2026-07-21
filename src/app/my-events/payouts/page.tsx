'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { collection, query, where, getDocs, collectionGroup, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import { Download, ArrowLeft, TrendingUp, DollarSign, Activity } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { getTicketTiers } from '@/lib/events';

const CURRENCIES = {
  USD: { symbol: '$', rate: 1 },
  JMD: { symbol: 'J$', rate: 155 },
  TTD: { symbol: 'TT$', rate: 6.8 }
};
type CurrencyCode = keyof typeof CURRENCIES;

interface PayoutEvent {
  id: string;
  title: string;
  date: string;
  status: string;
  ticketsSold: number;
  netPayout: number; // 100% of base price
  sackeFee: number;  // 7% fee
  grossVolume: number; // netPayout + sackeFee
}

export default function PayoutsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [events, setEvents] = useState<PayoutEvent[]>([]);
  const [totalNetPayout, setTotalNetPayout] = useState(0);
  const [totalSackeFee, setTotalSackeFee] = useState(0);
  const [totalGrossVolume, setTotalGrossVolume] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [currency, setCurrency] = useState<CurrencyCode>('USD');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    async function fetchPayoutData() {
      if (!user) return;
      setIsLoading(true);
      try {
        const q = query(
          collection(db, 'events'),
          where('organizerId', '==', user.uid)
        );
        const snapshot = await getDocs(q);
        const fetchedEventsMap = new Map<string, any>();
        
        snapshot.docs.forEach(docSnap => {
          fetchedEventsMap.set(docSnap.id, { id: docSnap.id, ...docSnap.data() });
        });

        if (user.email) {
          const teamQuery = query(
            collectionGroup(db, 'team'),
            where('email', '==', user.email.toLowerCase()),
            where('status', '==', 'active')
          );
          const teamSnap = await getDocs(teamQuery);
          
          await Promise.all(teamSnap.docs.map(async (teamDoc) => {
            const eventId = teamDoc.ref.parent.parent?.id;
            if (eventId && !fetchedEventsMap.has(eventId)) {
              const eventDocSnap = await getDoc(doc(db, 'events', eventId));
              if (eventDocSnap.exists()) {
                fetchedEventsMap.set(eventId, { id: eventId, ...eventDocSnap.data() });
              }
            }
          }));
        }

        const rawEvents = Array.from(fetchedEventsMap.values());
        
        let aggregatedNet = 0;
        let aggregatedFee = 0;
        let aggregatedGross = 0;

        const payoutEvents: PayoutEvent[] = [];

        await Promise.all(rawEvents.map(async (ev) => {
          try {
            const tiers = await getTicketTiers(ev.id);
            let eventTicketsSold = 0;
            let eventNetPayout = 0;
            let eventSackeFee = 0;

            tiers.forEach(t => {
              const sold = t.sold || 0;
              const price = t.price || 0;
              const net = sold * price;
              const fee = net * 0.07;
              
              eventTicketsSold += sold;
              eventNetPayout += net;
              eventSackeFee += fee;
            });

            const eventGross = eventNetPayout + eventSackeFee;

            aggregatedNet += eventNetPayout;
            aggregatedFee += eventSackeFee;
            aggregatedGross += eventGross;

            payoutEvents.push({
              id: ev.id,
              title: ev.title,
              date: ev.date,
              status: ev.status || 'draft',
              ticketsSold: eventTicketsSold,
              netPayout: eventNetPayout,
              sackeFee: eventSackeFee,
              grossVolume: eventGross
            });

          } catch (e) {
            console.error('Error fetching tiers for event', ev.id, e);
          }
        }));

        setTotalNetPayout(aggregatedNet);
        setTotalSackeFee(aggregatedFee);
        setTotalGrossVolume(aggregatedGross);

        // Sort by date descending
        payoutEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setEvents(payoutEvents);
      } catch (error) {
        console.error("Error fetching payout data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    if (user) {
      fetchPayoutData();
    }
  }, [user]);

  const handleDownloadCSV = () => {
    const rate = CURRENCIES[currency].rate;
    
    const headers = ['Event Name', 'Date', 'Status', 'Tickets Sold', `Net Payout (${currency})`, `Sack-E Fee (${currency})`, `Gross Volume (${currency})`];
    
    const rows = events.map(ev => [
      `"${ev.title.replace(/"/g, '""')}"`, // escape quotes
      format(parseISO(ev.date), 'MMM do, yyyy'),
      ev.status.toUpperCase(),
      ev.ticketsSold.toString(),
      (ev.netPayout * rate).toFixed(2),
      (ev.sackeFee * rate).toFixed(2),
      (ev.grossVolume * rate).toFixed(2)
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `SackE_Payout_Report_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading || (isLoading && user)) {
    return (
      <main className="min-h-screen pt-24 md:pt-32 pb-20 px-6 max-w-5xl mx-auto flex justify-center">
        <div className="animate-pulse flex gap-2 items-center text-on-surface-variant">
          <div className="w-2 h-2 bg-primary rounded-full"></div>
          <div className="w-2 h-2 bg-secondary rounded-full delay-75"></div>
          <div className="w-2 h-2 bg-primary rounded-full delay-150"></div>
          <span className="ml-2 text-sm font-semibold tracking-widest uppercase">Loading Payouts</span>
        </div>
      </main>
    );
  }

  if (!user) return null;

  const currentRate = CURRENCIES[currency].rate;
  const currentSymbol = CURRENCIES[currency].symbol;

  return (
    <main className="min-h-screen pt-24 md:pt-32 pb-20 px-4 md:px-6 max-w-6xl mx-auto">
      <Link href="/my-events" className="inline-flex items-center gap-2 text-primary font-semibold hover:underline mb-8">
        <ArrowLeft size={20} /> Back to Dashboard
      </Link>
      
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12">
        <div>
          <h1 className="font-display font-bold text-4xl md:text-5xl tracking-tight mb-2">Payout Reporting</h1>
          <p className="text-on-surface-variant font-sans">Track your earnings, ticket sales, and generated reports.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select 
            value={currency} 
            onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
            className="px-4 py-3 bg-surface-container border border-black/10 text-on-surface font-bold rounded-xl outline-none focus:border-primary/50 cursor-pointer"
          >
            <option value="USD">USD</option>
            <option value="JMD">JMD</option>
            <option value="TTD">TTD</option>
          </select>
          <button 
            onClick={handleDownloadCSV}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-on-primary font-bold rounded-xl hover:bg-primary/90 transition-colors shadow-lg"
          >
            <Download size={20} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-surface-container border border-black/5 p-6 rounded-3xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-on-surface-variant">Total Net Payout</h3>
            <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
              <DollarSign size={20} className="text-green-600" />
            </div>
          </div>
          <div>
            <h2 className="font-display text-4xl font-bold text-on-surface">{currentSymbol}{(totalNetPayout * currentRate).toFixed(2)}</h2>
            <p className="text-sm text-on-surface-variant mt-2 font-medium">Your actual earnings</p>
          </div>
        </div>
        
        <div className="bg-surface-container border border-black/5 p-6 rounded-3xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-on-surface-variant">Platform Fees (7%)</h3>
            <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center">
              <Activity size={20} className="text-orange-600" />
            </div>
          </div>
          <div>
            <h2 className="font-display text-4xl font-bold text-on-surface">{currentSymbol}{(totalSackeFee * currentRate).toFixed(2)}</h2>
            <p className="text-sm text-on-surface-variant mt-2 font-medium">Sack-E service fees</p>
          </div>
        </div>

        <div className="bg-surface-container border border-black/5 p-6 rounded-3xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-on-surface-variant">Total Gross Volume</h3>
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <TrendingUp size={20} className="text-primary" />
            </div>
          </div>
          <div>
            <h2 className="font-display text-4xl font-bold text-on-surface">{currentSymbol}{(totalGrossVolume * currentRate).toFixed(2)}</h2>
            <p className="text-sm text-on-surface-variant mt-2 font-medium">Total processed from customers</p>
          </div>
        </div>
      </div>

      {/* Payouts Table */}
      <div className="bg-surface-container border border-black/5 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-black/5 border-b border-black/5">
                <th className="p-5 font-semibold text-sm text-on-surface-variant uppercase tracking-wider">Event Name</th>
                <th className="p-5 font-semibold text-sm text-on-surface-variant uppercase tracking-wider">Date</th>
                <th className="p-5 font-semibold text-sm text-on-surface-variant uppercase tracking-wider text-right">Tickets Sold</th>
                <th className="p-5 font-semibold text-sm text-on-surface-variant uppercase tracking-wider text-right">Gross Volume</th>
                <th className="p-5 font-semibold text-sm text-on-surface-variant uppercase tracking-wider text-right">Net Payout</th>
                <th className="p-5 font-semibold text-sm text-on-surface-variant uppercase tracking-wider text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {events.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-on-surface-variant">
                    No payout data found. Start selling tickets to see your earnings here!
                  </td>
                </tr>
              ) : (
                events.map(ev => (
                  <tr key={ev.id} className="border-b border-black/5 last:border-b-0 hover:bg-black/5 transition-colors">
                    <td className="p-5 font-semibold text-on-surface">{ev.title}</td>
                    <td className="p-5 text-on-surface-variant whitespace-nowrap">{format(parseISO(ev.date), 'MMM do, yyyy')}</td>
                    <td className="p-5 text-right font-medium text-on-surface">{ev.ticketsSold}</td>
                    <td className="p-5 text-right text-on-surface-variant">
                      {currentSymbol}{(ev.grossVolume * currentRate).toFixed(2)}
                    </td>
                    <td className="p-5 text-right font-bold text-green-600">
                      {currentSymbol}{(ev.netPayout * currentRate).toFixed(2)}
                    </td>
                    <td className="p-5 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        ev.status === 'published' ? 'bg-green-500/20 text-green-700' : 'bg-orange-500/20 text-orange-700'
                      }`}>
                        {ev.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
