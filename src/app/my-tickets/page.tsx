'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { collection, query, where, getDocs, doc, getDoc, collectionGroup } from 'firebase/firestore';
import Image from 'next/image';
import { db } from '@/lib/firebase';
import { QRCodeSVG } from 'qrcode.react';
import { format, parseISO, isBefore, startOfDay } from 'date-fns';
import { Ticket as TicketIcon, Calendar, MapPin, Clock, ExternalLink, Lock } from 'lucide-react';
import TicketDetailModal from '@/components/TicketDetailModal';
import { TicketData, ReservationData } from '@/types';



export default function TicketsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [reservations, setReservations] = useState<ReservationData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past' | 'requests'>('upcoming');
  const [selectedTicket, setSelectedTicket] = useState<TicketData | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    async function fetchTickets() {
      if (!user) return;
      setIsLoading(true);
      try {
        const ownedQuery = query(
          collection(db, 'tickets'),
          where('owner_id', '==', user.uid)
        );
        const receivedQuery = query(
          collection(db, 'tickets'),
          where('transfer_pending_to', '==', user.email?.toLowerCase() || '')
        );
        
        const reservationsQuery = query(
          collectionGroup(db, 'reservations'),
          where('userId', '==', user.uid)
        );
        
        const [ownedSnapshot, receivedSnapshot, resSnapshot] = await Promise.all([
          getDocs(ownedQuery),
          getDocs(receivedQuery),
          getDocs(reservationsQuery)
        ]);

        const fetchedTicketsMap = new Map<string, TicketData>();

        const processDocs = async (docs: any[]) => {
          for (const document of docs) {
            if (fetchedTicketsMap.has(document.id)) continue;
            
            const data = document.data() as TicketData;
            data.id = document.id;

            if (!data.eventId) continue;

            const eventRef = doc(db, 'events', data.eventId);
            const eventSnap = await getDoc(eventRef);
            if (eventSnap.exists()) {
              data.eventDetails = eventSnap.data() as TicketData['eventDetails'];
            }
            fetchedTicketsMap.set(data.id, data);
          }
        };

        await processDocs(ownedSnapshot.docs);
        await processDocs(receivedSnapshot.docs);

        const fetchedTickets = Array.from(fetchedTicketsMap.values());

        // Process reservations (only requested or approved)
        const fetchedResMap = new Map<string, ReservationData>();
        for (const docSnap of resSnapshot.docs) {
          const data = docSnap.data() as ReservationData;
          data.id = docSnap.id;
          if (data.status === 'requested' || data.status === 'approved') {
            if (!data.eventId) continue;
            const eventRef = doc(db, 'events', data.eventId);
            const eventSnap = await getDoc(eventRef);
            if (eventSnap.exists()) {
              data.eventDetails = eventSnap.data() as TicketData['eventDetails']; // Reuse the type
            }
            fetchedResMap.set(data.id!, data);
          }
        }

        const fetchedReservations = Array.from(fetchedResMap.values());

        // Sort by closest date first (ascending)
        fetchedTickets.sort((a, b) => {
          if (!a.eventDetails || !b.eventDetails) return 0;
          return new Date(a.eventDetails.date).getTime() - new Date(b.eventDetails.date).getTime();
        });

        fetchedReservations.sort((a, b) => {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(); // Newest first
        });

        setTickets(fetchedTickets);
        setReservations(fetchedReservations);
      } catch (error) {
        console.error("Error fetching tickets:", error);
      } finally {
        setIsLoading(false);
      }
    }

    if (user) {
      fetchTickets();
    }
  }, [user]);

  if (loading || (isLoading && user)) {
    return (
      <main className="min-h-screen pt-8 md:pt-24 pb-20 px-6 max-w-5xl mx-auto flex justify-center">
        <div className="animate-pulse flex gap-2 items-center text-on-surface-variant">
          <div className="w-2 h-2 bg-primary rounded-full"></div>
          <div className="w-2 h-2 bg-secondary rounded-full delay-75"></div>
          <div className="w-2 h-2 bg-primary rounded-full delay-150"></div>
          <span className="ml-2 text-sm font-semibold tracking-widest uppercase">Loading Tickets</span>
        </div>
      </main>
    );
  }

  if (!user) return null;

  const now = new Date();
  const upcomingTickets = tickets.filter(t => t.eventDetails && new Date(t.eventDetails.date) >= now);
  const pastTickets = tickets.filter(t => t.eventDetails && new Date(t.eventDetails.date) < now);

  const displayedTickets = activeTab === 'upcoming' ? upcomingTickets : pastTickets;

  return (
    <main className="min-h-screen pt-8 md:pt-24 pb-20 px-4 md:px-6 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <h1 className="font-display font-bold text-4xl md:text-5xl tracking-tight mb-2">My Tickets</h1>
          <p className="text-on-surface-variant font-sans mb-4">Manage your upcoming and past event passes.</p>
          <div className="bg-primary/10 border-l-4 border-primary p-3 rounded-r-xl max-w-lg">
            <p className="text-xs text-on-surface-variant">
              <strong>Need help?</strong> Tap on any ticket to view details, transfer it to a friend, or access the full QR code. The QR code will be scanned at the entrance.
            </p>
          </div>
        </div>
        
        <div className="flex bg-surface-container rounded-xl p-1 border border-white/5">
          <button 
            onClick={() => setActiveTab('upcoming')}
            className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'upcoming' ? 'bg-primary text-on-primary shadow-lg' : 'text-on-surface-variant hover:text-on-surface'}`}
          >
            Upcoming
          </button>
          <button 
            onClick={() => setActiveTab('past')}
            className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'past' ? 'bg-primary text-on-primary shadow-lg' : 'text-on-surface-variant hover:text-on-surface'}`}
          >
            Past Events
          </button>
          <button 
            onClick={() => setActiveTab('requests')}
            className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'requests' ? 'bg-primary text-on-primary shadow-lg' : 'text-on-surface-variant hover:text-on-surface'}`}
          >
            Requests {reservations.length > 0 && <span className="ml-1 bg-black/10 px-1.5 py-0.5 rounded-full text-xs">{reservations.length}</span>}
          </button>
        </div>
      </div>

      {activeTab !== 'requests' && displayedTickets.length === 0 ? (
        <div className="text-center py-24 bg-surface-container border border-white/5 rounded-3xl">
          <TicketIcon size={48} className="mx-auto text-on-surface-variant/50 mb-4" />
          <h3 className="text-xl font-bold mb-2">No {activeTab} tickets</h3>
          <p className="text-on-surface-variant mb-6">When you buy tickets to an event, they will appear here.</p>
          <button onClick={() => router.push('/')} className="px-6 py-3 bg-black/5 hover:bg-black/10 transition-colors rounded-xl font-semibold">
            Browse Events
          </button>
        </div>
      ) : activeTab !== 'requests' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {displayedTickets.map((ticket) => (
            <div 
              key={ticket.id} 
              onClick={() => setSelectedTicket(ticket)}
              className="bg-surface-container border border-black/10 rounded-3xl overflow-hidden flex flex-col sm:flex-row shadow-2xl relative group cursor-pointer hover:border-primary/50 transition-colors"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-colors" />
              
              {/* Event Image */}
              <div className="h-48 sm:h-auto sm:w-2/5 relative overflow-hidden border-b sm:border-b-0 sm:border-r border-black/10 shrink-0">
                <Image src={ticket.eventDetails?.imageUrl || '/placeholder-event.jpg'} alt={ticket.eventDetails?.title || 'Event Image'} fill className="object-cover" />
              </div>

              {/* Ticket Details */}
              <div className="p-6 flex-1 flex flex-col justify-between z-10 relative">
                <div>
                  <div className="flex justify-between items-start mb-2 gap-4">
                    <h3 className="font-display font-bold text-xl line-clamp-2 leading-tight">{ticket.eventDetails?.title}</h3>
                    {user?.email && ticket.transfer_pending_to === user.email.toLowerCase() && (
                      <span className="shrink-0 px-3 py-1.5 bg-success text-black text-[10px] uppercase font-extrabold tracking-widest rounded-lg shadow-[0_0_15px_rgba(0,255,0,0.4)] animate-pulse">
                        Action Required: Accept Ticket
                      </span>
                    )}
                    {user?.uid === ticket.owner_id && ticket.transfer_pending_to && (
                      <span className="shrink-0 px-2 py-1 bg-primary/20 text-primary text-[10px] uppercase font-bold tracking-widest rounded-md border border-primary/30">
                        Transferring
                      </span>
                    )}
                  </div>
                  <div className="space-y-2 mt-4">
                    <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                      <Calendar size={16} className="text-primary" />
                      <span>{ticket.eventDetails ? format(parseISO(ticket.eventDetails.date), 'MMM do, yyyy') : 'TBA'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                      <Clock size={16} className="text-primary" />
                      <span>{ticket.eventDetails?.time || (ticket.eventDetails?.date ? format(parseISO(ticket.eventDetails.date), 'h:mm a') : 'TBA')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                      <MapPin size={16} className="text-primary" />
                      <span className="line-clamp-1">{ticket.eventDetails?.location || 'TBA'}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-black/10 flex items-center justify-between">
                  <div>
                    <span className="block text-[10px] uppercase tracking-wider text-on-surface-variant font-bold mb-1">Ticket Tier</span>
                    <span className="font-bold text-lg">{ticket.name || 'GA'}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                      <span className="block text-[10px] uppercase tracking-wider text-on-surface-variant font-bold mb-1">Admit</span>
                      <span className="font-mono text-lg font-bold bg-black/5 px-3 py-1 rounded-lg inline-block">1</span>
                    </div>
                    <div className="bg-white p-2 rounded-xl shadow-inner shrink-0">
                      {ticket.eventDetails?.date && isBefore(new Date(), startOfDay(parseISO(ticket.eventDetails.date))) ? (
                        <div className="w-[48px] h-[48px] bg-black/5 rounded flex items-center justify-center" title={`Your secure QR code will unlock on ${format(parseISO(ticket.eventDetails.date), 'MMM do, yyyy')}`}>
                          <Lock size={20} className="text-on-surface-variant" />
                        </div>
                      ) : (
                        <QRCodeSVG 
                          value={`${typeof window !== 'undefined' ? window.location.origin : ''}/verify/${ticket.eventId}/${ticket.id}?owner=${ticket.owner_id}`}
                          size={48} 
                          bgColor="#ffffff" 
                          fgColor="#000000" 
                          level="M" 
                          includeMargin={false}
                        />
                      )}
                    </div>
                  </div>
                </div>
                
                {/* View Details Overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                  <span className="px-6 py-3 bg-primary text-on-primary font-bold rounded-xl flex items-center gap-2 shadow-xl transform translate-y-4 group-hover:translate-y-0 transition-all">
                    <ExternalLink size={20} /> View Ticket Details
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Requests Tab */
        reservations.length === 0 ? (
          <div className="text-center py-24 bg-surface-container border border-white/5 rounded-3xl">
            <Clock size={48} className="mx-auto text-on-surface-variant/50 mb-4" />
            <h3 className="text-xl font-bold mb-2">No active ticket requests</h3>
            <p className="text-on-surface-variant mb-6">Ticket requests you make for events requiring approval will appear here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {reservations.map(res => (
              <div key={res.id} className="bg-surface-container border border-black/10 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
                <div className="flex gap-4 items-center">
                  <div className="w-16 h-16 rounded-xl relative overflow-hidden shrink-0">
                    <Image src={res.eventDetails?.imageUrl || '/placeholder-event.jpg'} alt={res.eventDetails?.title || 'Event'} fill className="object-cover" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{res.eventDetails?.title}</h3>
                    <div className="flex gap-2 text-sm mt-1 text-on-surface-variant">
                      <span>{res.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}</span>
                      <span>•</span>
                      <span className="font-semibold text-primary">${res.totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-2 w-full md:w-auto">
                  {res.status === 'requested' ? (
                    <span className="px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-xs font-bold uppercase tracking-wider rounded-lg">
                      Pending Approval
                    </span>
                  ) : res.status === 'approved' ? (
                    <div className="flex flex-col items-end gap-2">
                      <span className="px-3 py-1 bg-green-500/10 border border-green-500/20 text-green-500 text-xs font-bold uppercase tracking-wider rounded-lg">
                        Approved! Payment Required
                      </span>
                      <button
                        onClick={() => router.push(`/checkout/${res.eventId}/pay/${res.id}`)}
                        className="px-4 py-2 bg-primary text-on-primary font-bold rounded-lg text-sm hover:bg-primary-container transition-colors w-full md:w-auto"
                      >
                        Complete Purchase
                      </button>
                    </div>
                  ) : null}
                  <p className="text-xs text-on-surface-variant">
                    Requested on {new Date(res.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      <TicketDetailModal 
        isOpen={!!selectedTicket} 
        onClose={() => setSelectedTicket(null)} 
        ticket={selectedTicket} 
        onUpdateTicket={(updated) => {
          setSelectedTicket(updated);
          setTickets(prev => prev.map(t => t.id === updated.id ? updated : t));
        }}
      />
    </main>
  );
}
