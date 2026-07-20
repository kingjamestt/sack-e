'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { collection, query, where, getDocs, orderBy, collectionGroup, doc, getDoc } from 'firebase/firestore';
import Image from 'next/image';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import { Plus, Calendar, MapPin, Users, Activity, Megaphone, LifeBuoy } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { getTicketTiers } from '@/lib/events';
import ContactSupportModal from '@/components/ContactSupportModal';

const CURRENCIES = {
  USD: { symbol: '$', rate: 1 },
  JMD: { symbol: 'J$', rate: 155 },
  TTD: { symbol: 'TT$', rate: 6.8 }
};
type CurrencyCode = keyof typeof CURRENCIES;

interface AdminEvent {
  id: string;
  title: string;
  date: string;
  location: string;
  status: string;
  imageUrl: string;
  createdAt: string;
}

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [totalSold, setTotalSold] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [supportCategory, setSupportCategory] = useState('');
  const [currency, setCurrency] = useState<CurrencyCode>('USD');

  const openSupportModal = (category = '') => {
    setSupportCategory(category);
    setIsSupportModalOpen(true);
  };

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    async function fetchAdminEvents() {
      if (!user) return;
      setIsLoading(true);
      try {
        const q = query(
          collection(db, 'events'),
          where('organizerId', '==', user.uid)
        );
        const snapshot = await getDocs(q);
        const fetchedEventsMap = new Map<string, AdminEvent>();
        
        snapshot.docs.forEach(docSnap => {
          fetchedEventsMap.set(docSnap.id, { id: docSnap.id, ...docSnap.data() } as AdminEvent);
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
                fetchedEventsMap.set(eventId, { id: eventId, ...eventDocSnap.data() } as AdminEvent);
              }
            }
          }));
        }

        const fetchedEvents = Array.from(fetchedEventsMap.values());
        
        let aggregatedSold = 0;
        let aggregatedRevenue = 0;

        await Promise.all(fetchedEvents.map(async (ev) => {
          try {
            const tiers = await getTicketTiers(ev.id);
            tiers.forEach(t => {
              aggregatedSold += t.sold || 0;
              aggregatedRevenue += (t.sold || 0) * (t.price || 0);
            });
          } catch (e) {
            console.error('Error fetching tiers for event', ev.id, e);
          }
        }));

        setTotalSold(aggregatedSold);
        setTotalRevenue(aggregatedRevenue);

        fetchedEvents.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setEvents(fetchedEvents);
      } catch (error) {
        console.error("Error fetching admin events:", error);
      } finally {
        setIsLoading(false);
      }
    }

    if (user) {
      fetchAdminEvents();
    }
  }, [user]);

  if (loading || (isLoading && user)) {
    return (
      <main className="min-h-screen pt-24 md:pt-32 pb-20 px-6 max-w-5xl mx-auto flex justify-center">
        <div className="animate-pulse flex gap-2 items-center text-on-surface-variant">
          <div className="w-2 h-2 bg-primary rounded-full"></div>
          <div className="w-2 h-2 bg-secondary rounded-full delay-75"></div>
          <div className="w-2 h-2 bg-primary rounded-full delay-150"></div>
          <span className="ml-2 text-sm font-semibold tracking-widest uppercase">Loading Dashboard</span>
        </div>
      </main>
    );
  }

  if (!user) return null;

  return (
    <main className="min-h-screen pt-24 md:pt-32 pb-20 px-4 md:px-6 max-w-6xl mx-auto">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12">
        <div>
          <h1 className="font-display font-bold text-4xl md:text-5xl tracking-tight mb-2">Organizer Dashboard</h1>
          <p className="text-on-surface-variant font-sans">Manage your events, ticket tiers, and sales.</p>
          <div className="mt-4 bg-primary/10 border-l-4 border-primary p-4 rounded-r-xl max-w-2xl">
            <h3 className="font-bold text-primary mb-1">Welcome to your command center</h3>
            <p className="text-sm text-on-surface-variant">
              Here you can create new events, track ticket sales in real-time, and get support. Click on any of your events below to manage ticket tiers, scan attendees, or view detailed analytics.
            </p>
          </div>
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
          <button onClick={() => openSupportModal('Advertisement Inquiry')} className="px-6 py-3 bg-orange-500/10 text-orange-500 border border-orange-500/30 font-bold rounded-xl hover:bg-orange-500/20 transition-colors flex items-center justify-center gap-2 shadow-lg">
            <Megaphone size={20} /> Promote Event
          </button>
          <button onClick={() => openSupportModal()} className="px-5 py-3 bg-surface-container border border-black/10 text-on-surface font-bold rounded-xl hover:bg-surface-container-high transition-colors flex items-center justify-center gap-2">
            <LifeBuoy size={20} /> Support
          </button>
          <Link href="/my-events/create" className="px-6 py-3 bg-primary text-on-primary font-bold rounded-xl hover:bg-primary-container hover:text-on-primary-container transition-colors shadow-lg flex items-center justify-center gap-2">
            <Plus size={20} /> Create Event
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-surface-container border border-black/10 rounded-2xl p-6 flex items-center gap-4">
          <div className="p-4 bg-primary/10 text-primary rounded-xl"><Calendar size={24} /></div>
          <div>
            <p className="text-on-surface-variant text-sm font-bold uppercase tracking-wider mb-1">Total Events</p>
            <h3 className="font-display text-3xl font-bold">{events.length}</h3>
          </div>
        </div>
        <div className="bg-surface-container border border-black/10 rounded-2xl p-6 flex items-center gap-4">
          <div className="p-4 bg-secondary/10 text-secondary rounded-xl"><Users size={24} /></div>
          <div>
            <p className="text-on-surface-variant text-sm font-bold uppercase tracking-wider mb-1">Tickets Sold</p>
            <h3 className="font-display text-3xl font-bold">{totalSold}</h3>
          </div>
        </div>
        <div className="bg-surface-container border border-black/10 rounded-2xl p-6 flex items-center gap-4">
          <div className="p-4 bg-green-500/10 text-green-400 rounded-xl"><Activity size={24} /></div>
          <div>
            <p className="text-on-surface-variant text-sm font-bold uppercase tracking-wider mb-1">Revenue</p>
            <h3 className="font-display text-3xl font-bold text-green-400">{CURRENCIES[currency].symbol}{(totalRevenue * CURRENCIES[currency].rate).toFixed(2)}</h3>
          </div>
        </div>
      </div>

      <h2 className="font-display text-2xl font-bold mb-6">Your Events</h2>

      {events.length === 0 ? (
        <div className="text-center py-20 bg-surface-container border border-white/5 rounded-3xl">
          <Calendar size={48} className="mx-auto text-on-surface-variant/50 mb-4" />
          <h3 className="text-xl font-bold mb-2">No events created yet</h3>
          <p className="text-on-surface-variant mb-6">Create your first event and start selling tickets.</p>
          <Link href="/my-events/create" className="inline-block px-6 py-3 bg-black/5 hover:bg-black/10 transition-colors rounded-xl font-semibold">
            Create Event
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <Link key={event.id} href={`/my-events/events/${event.id}`} className="group bg-surface-container border border-black/10 rounded-2xl overflow-hidden hover:border-primary/50 transition-colors block relative">
              <div className="h-40 relative overflow-hidden">
                <Image src={event.imageUrl || '/placeholder-event.jpg'} alt={event.title} fill className="object-cover" />
              </div>
              <div className="p-5">
                <div className="flex justify-between items-start mb-2 gap-3">
                  <h3 className="font-display font-bold text-lg line-clamp-1 flex-1">{event.title}</h3>
                  <span className={`flex-shrink-0 text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-md ${
                    event.status === 'active' && new Date(event.date) < new Date() 
                      ? 'bg-black/5 text-on-surface-variant' 
                      : event.status === 'active' 
                      ? 'bg-green-500/20 text-green-600' 
                      : 'bg-black/5 text-on-surface-variant'
                  }`}>
                    {event.status === 'active' && new Date(event.date) < new Date() ? 'past' : event.status}
                  </span>
                </div>
                <div className="space-y-1 mt-3">
                  <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                    <Calendar size={14} />
                    <span>{format(parseISO(event.date), 'MMM do, yyyy')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                    <MapPin size={14} />
                    <span className="line-clamp-1">{event.location}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <ContactSupportModal 
        isOpen={isSupportModalOpen} 
        onClose={() => setIsSupportModalOpen(false)} 
        organizerId={user?.uid}
        defaultCategory={supportCategory}
      />
    </main>
  );
}
