'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { collection, query, getDocs, where, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Calendar, Users, Activity, Wallet, ShieldAlert, DollarSign, CheckCircle, PauseCircle, XCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { getEventLink } from '@/lib/events';
import Link from 'next/link';

interface PlatformMetrics {
  totalEvents: number;
  totalRevenue: number;
  totalSackERevenue: number;
  totalBSWebRevenue: number;
  totalTicketsSold: number;
}

interface PlatformEvent {
  id: string;
  title: string;
  date: string;
  location: string;
  status: string;
  payoutStatus: string;
  organizerId: string;
  createdAt: string;
}

export default function PlatformAdminDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<'events' | 'users'>('events');
  const [metrics, setMetrics] = useState<PlatformMetrics>({
    totalEvents: 0,
    totalRevenue: 0,
    totalSackERevenue: 0,
    totalBSWebRevenue: 0,
    totalTicketsSold: 0
  });
  const [events, setEvents] = useState<PlatformEvent[]>([]);
  const [platformUsers, setPlatformUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [allReservations, setAllReservations] = useState<any[]>([]);

  // Derived available months from reservations
  const availableMonths = Array.from(new Set(allReservations.map(res => {
    let date;
    if (res.completedAt?.toDate) date = res.completedAt.toDate();
    else if (res.createdAt?.toDate) date = res.createdAt.toDate();
    else if (typeof res.createdAt === 'string') date = new Date(res.createdAt);
    else date = new Date();
    return format(date, 'yyyy-MM');
  }))).sort().reverse(); // Sort descending (newest first)

  // Compute metrics dynamically based on selectedMonth
  useEffect(() => {
    let totalRev = 0;
    let sackeRev = 0;
    let bswebRev = 0;
    let ticketsSold = 0;

    const filteredReservations = allReservations.filter(res => {
      if (selectedMonth === 'all') return true;
      let date;
      if (res.completedAt?.toDate) date = res.completedAt.toDate();
      else if (res.createdAt?.toDate) date = res.createdAt.toDate();
      else if (typeof res.createdAt === 'string') date = new Date(res.createdAt);
      else date = new Date();
      return format(date, 'yyyy-MM') === selectedMonth;
    });

    filteredReservations.forEach(data => {
      const total = data.total || 0;
      totalRev += total;
      
      // Legacy Fallback: If old reservation without explicit fee splits
      if (data.sackeFee === undefined && data.bswebFee === undefined) {
        sackeRev += total * 0.045;
        bswebRev += total * 0.015;
      } else {
        sackeRev += data.sackeFee || 0;
        bswebRev += data.bswebFee || 0;
      }
      
      // Count tickets
      if (data.items && Array.isArray(data.items)) {
        data.items.forEach((item: any) => {
          ticketsSold += item.quantity || 0;
        });
      }
    });

    setMetrics({
      totalEvents: events.length,
      totalRevenue: totalRev,
      totalSackERevenue: sackeRev,
      totalBSWebRevenue: bswebRev,
      totalTicketsSold: ticketsSold
    });
  }, [selectedMonth, allReservations, events.length]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
      return;
    }

    async function checkAdminAndLoadData() {
      if (!user) return;
      
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userData = userDoc.data();
        
        if (!userData?.isAdmin) {
          router.push('/');
          return;
        }
        
        setIsAdmin(true);
        await loadPlatformData();
      } catch (error) {
        console.error("Error checking admin status:", error);
        router.push('/');
      }
    }

    if (user) {
      checkAdminAndLoadData();
    }
  }, [user, loading, router]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadPlatformData() {
    try {
      // 1. Fetch all events
      const eventsRef = collection(db, 'events');
      const eventsSnap = await getDocs(eventsRef);
      const fetchedEvents: PlatformEvent[] = [];
      
      eventsSnap.forEach(doc => {
        const data = doc.data();
        fetchedEvents.push({
          id: doc.id,
          title: data.title || 'Untitled Event',
          date: data.date || '',
          location: data.location || '',
          status: data.status || 'draft',
          payoutStatus: data.payoutStatus || 'none',
          organizerId: data.organizerId || '',
          createdAt: data.createdAt || new Date().toISOString()
        });
      });
      
      fetchedEvents.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setEvents(fetchedEvents);

      // 2. Fetch all completed reservations across events
      const fetchedReservations: any[] = [];

      for (const event of fetchedEvents) {
        const reservationsQuery = query(
          collection(db, `events/${event.id}/reservations`),
          where('status', '==', 'completed')
        );
        
        try {
          const resSnap = await getDocs(reservationsQuery);
          resSnap.forEach(doc => {
            fetchedReservations.push({ id: doc.id, eventId: event.id, ...doc.data() });
          });
        } catch (err) {
          console.warn(`Could not fetch reservations for event ${event.id}`, err);
        }
      }

      setAllReservations(fetchedReservations);

      // 3. Fetch all users
      const usersRef = collection(db, 'users');
      const usersSnap = await getDocs(usersRef);
      const fetchedUsers: any[] = [];
      usersSnap.forEach(doc => {
        fetchedUsers.push({ id: doc.id, ...doc.data() });
      });
      fetchedUsers.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setPlatformUsers(fetchedUsers);
      
    } catch (error) {
      console.error("Error loading platform data:", error);
    } finally {
      setIsLoading(false);
    }
  }

  const handleUpdateEventStatus = async (eventId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'events', eventId), { status: newStatus });
      setEvents(events.map(e => e.id === eventId ? { ...e, status: newStatus } : e));
    } catch (error) {
      console.error("Failed to update status", error);
      alert("Failed to update event status.");
    }
  };

  if (loading || isLoading || !isAdmin) {
    return (
      <main className="min-h-screen pt-8 md:pt-24 pb-20 px-6 max-w-5xl mx-auto flex justify-center">
        <div className="animate-pulse flex gap-2 items-center text-on-surface-variant">
          <div className="w-2 h-2 bg-primary rounded-full"></div>
          <div className="w-2 h-2 bg-secondary rounded-full delay-75"></div>
          <div className="w-2 h-2 bg-primary rounded-full delay-150"></div>
          <span className="ml-2 text-sm font-semibold tracking-widest uppercase">Verifying Access...</span>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen pt-8 md:pt-24 pb-20 px-4 md:px-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <h1 className="font-display font-bold text-4xl md:text-5xl tracking-tight mb-2 flex items-center gap-3">
            <ShieldAlert className="text-error" size={40} />
            Platform Admin
          </h1>
          <p className="text-on-surface-variant font-sans">
            System-wide overview for {process.env.NEXT_PUBLIC_APP_NAME || 'Sack-E Online'}.
          </p>
        </div>
        
        {/* Month Filter */}
        <div className="flex flex-col items-start md:items-end gap-2">
          <label htmlFor="monthFilter" className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Filter Metrics</label>
          <select 
            id="monthFilter"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-surface-container border border-black/10 text-on-surface text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5 outline-none font-semibold cursor-pointer"
          >
            <option value="all">All Time</option>
            {availableMonths.map(month => {
              const [year, monthNum] = month.split('-');
              const date = new Date(parseInt(year), parseInt(monthNum) - 1);
              return (
                <option key={month} value={month}>
                  {format(date, 'MMMM yyyy')}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <div className="bg-surface-container border border-black/10 rounded-2xl p-6 flex flex-col justify-between">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-surface-container-high text-on-surface-variant rounded-xl"><Activity size={24} /></div>
          </div>
          <div>
            <p className="text-on-surface-variant text-xs font-bold uppercase tracking-wider mb-1">Total Gross Volume</p>
            <h3 className="font-display text-3xl font-bold">${metrics.totalRevenue.toFixed(2)}</h3>
          </div>
        </div>

        <div className="bg-surface-container border border-primary/20 rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10"><DollarSign size={64} className="text-primary" /></div>
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-primary/10 text-primary rounded-xl"><Wallet size={24} /></div>
          </div>
          <div className="bg-surface/50 border border-white/5 p-6 rounded-2xl">
            <h4 className="text-on-surface-variant text-sm font-semibold mb-2">Sack-E Rev</h4>
            <h3 className="font-display text-3xl font-bold text-primary">${metrics.totalSackERevenue.toFixed(2)}</h3>
          </div>
        </div>

        <div className="bg-surface-container border border-secondary/20 rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10"><DollarSign size={64} className="text-secondary" /></div>
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-secondary/10 text-secondary rounded-xl"><Wallet size={24} /></div>
          </div>
          <div>
            <p className="text-on-surface-variant text-xs font-bold uppercase tracking-wider mb-1">Developer Cut (BSWeb)</p>
            <h3 className="font-display text-3xl font-bold text-secondary">${metrics.totalBSWebRevenue.toFixed(2)}</h3>
          </div>
        </div>

        <div className="bg-surface-container border border-black/10 rounded-2xl p-6 flex flex-col justify-between">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-surface-container-high text-on-surface-variant rounded-xl"><Users size={24} /></div>
          </div>
          <div>
            <p className="text-on-surface-variant text-xs font-bold uppercase tracking-wider mb-1">Total Tickets Sold</p>
            <h3 className="font-display text-3xl font-bold">{metrics.totalTicketsSold}</h3>
          </div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-black/10 mb-8">
        <button
          onClick={() => setActiveTab('events')}
          className={`pb-4 px-6 font-semibold text-sm transition-colors relative ${activeTab === 'events' ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
        >
          Events
          {activeTab === 'events' && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-primary rounded-t-full" />}
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-4 px-6 font-semibold text-sm transition-colors relative ${activeTab === 'users' ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
        >
          Users
          {activeTab === 'users' && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-primary rounded-t-full" />}
        </button>
      </div>

      {activeTab === 'events' && (
        <div className="bg-surface-container border border-black/10 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-black/10 flex justify-between items-center bg-black/5">
            <h2 className="font-display text-xl font-bold">All Events ({metrics.totalEvents})</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-black/20 text-on-surface-variant text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-bold">Event Name</th>
                  <th className="px-6 py-4 font-bold">Date</th>
                  <th className="px-6 py-4 font-bold">Status</th>
                  <th className="px-6 py-4 font-bold">Payout Status</th>
                  <th className="px-6 py-4 font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {events.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-on-surface-variant">
                      No events found on the platform.
                    </td>
                  </tr>
                ) : (
                  events.map(event => (
                    <tr key={event.id} className="hover:bg-black/5 transition-colors">
                      <td className="px-6 py-4 font-semibold">{event.title}</td>
                      <td className="px-6 py-4 text-on-surface-variant">
                        {event.date ? format(parseISO(event.date), 'MMM d, yyyy') : 'TBA'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          event.status === 'active' ? 'bg-green-500/20 text-green-400' :
                          event.status === 'pending' ? 'bg-secondary/20 text-secondary' :
                          event.status === 'cancelled' ? 'bg-error/20 text-error' :
                          'bg-black/5 text-on-surface-variant'
                        }`}>
                          {event.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          event.payoutStatus === 'paid' ? 'bg-green-500/20 text-green-400' :
                          event.payoutStatus === 'pending' || event.payoutStatus === 'processing' ? 'bg-secondary/20 text-secondary' :
                          event.payoutStatus === 'withheld' ? 'bg-error/20 text-error' :
                          'bg-black/5 text-on-surface-variant'
                        }`}>
                          {event.payoutStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <Link href={getEventLink(event)} target="_blank" className="text-primary hover:text-primary-container font-semibold text-xs">
                            View Event
                          </Link>
                          {(event.status === 'pending' || event.status === 'draft') && (
                            <>
                              <button 
                                onClick={() => handleUpdateEventStatus(event.id, 'active')}
                                className="text-green-500 hover:text-green-400 font-semibold text-xs flex items-center gap-1"
                              >
                                <CheckCircle size={14} /> Approve
                              </button>
                              <button 
                                onClick={() => handleUpdateEventStatus(event.id, 'rejected')}
                                className="text-error hover:text-error/80 font-semibold text-xs flex items-center gap-1"
                              >
                                <XCircle size={14} /> Reject
                              </button>
                            </>
                          )}
                          {event.status === 'active' && (
                            <button 
                              onClick={() => handleUpdateEventStatus(event.id, 'pending')}
                              className="text-error hover:text-error/80 font-semibold text-xs flex items-center gap-1"
                            >
                              <PauseCircle size={14} /> Suspend
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="bg-surface-container border border-black/10 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-black/10 flex justify-between items-center bg-black/5">
            <h2 className="font-display text-xl font-bold">All Users ({platformUsers.length})</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-black/20 text-on-surface-variant text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-bold">Name</th>
                  <th className="px-6 py-4 font-bold">Email</th>
                  <th className="px-6 py-4 font-bold">Admin</th>
                  <th className="px-6 py-4 font-bold">Organizer?</th>
                  <th className="px-6 py-4 font-bold">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {platformUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-on-surface-variant">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  platformUsers.map(u => {
                    const hasEvents = events.some(e => e.organizerId === u.id);
                    return (
                      <tr key={u.id} className="hover:bg-black/5 transition-colors">
                        <td className="px-6 py-4 font-semibold">{u.name || 'Unnamed'}</td>
                        <td className="px-6 py-4 text-on-surface-variant">{u.email}</td>
                        <td className="px-6 py-4">
                          {u.isAdmin ? (
                            <span className="px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-primary/20 text-primary">Admin</span>
                          ) : (
                            <span className="text-on-surface-variant text-xs">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {hasEvents ? (
                            <span className="px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-secondary/20 text-secondary">Organizer</span>
                          ) : (
                            <span className="text-on-surface-variant text-xs">User</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-on-surface-variant text-xs">
                          {u.createdAt ? format(new Date(u.createdAt), 'MMM d, yyyy') : 'Unknown'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  );
}
