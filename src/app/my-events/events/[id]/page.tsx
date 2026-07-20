'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Settings, Activity, Users, Edit3, Check, X, Calendar, MapPin, Clock, Eye } from 'lucide-react';
import { getEvent, getTicketTiers, TicketTier, getEventLink } from '@/lib/events';
import { EventData } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { format, parseISO } from 'date-fns';
import { doc, updateDoc, collection, addDoc, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import EventTeamSection from '@/components/EventTeamSection';
import EventApprovalsSection from '@/components/EventApprovalsSection';

export default function AdminEventDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  const [event, setEvent] = useState<EventData | null>(null);
  const [tiers, setTiers] = useState<TicketTier[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'tickets' | 'settings' | 'team' | 'approvals'>('overview');
  const [loading, setLoading] = useState(true);

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<EventData>>({});
  const [saving, setSaving] = useState(false);

  const [isTierModalOpen, setIsTierModalOpen] = useState(false);
  const [editingTierId, setEditingTierId] = useState<string | null>(null);
  const [tierForm, setTierForm] = useState<Partial<TicketTier>>({});
  const [savingTier, setSavingTier] = useState(false);
  const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState(false);

  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancellingEvent, setCancellingEvent] = useState(false);
  const [cancelMessage, setCancelMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!loading) {
      const params = new URLSearchParams(window.location.search);
      if (params.get('new') === 'true') {
        setIsWelcomeModalOpen(true);
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
      }
      
      if (window.location.hash) {
        const hashTab = window.location.hash.replace('#', '');
        if (['overview', 'tickets', 'team', 'approvals', 'settings'].includes(hashTab)) {
          setActiveTab(hashTab as any);
        }
      }
    }
  }, [loading]);

  useEffect(() => {
    async function loadData() {
      if (!user) return;
      try {
        const [eventData, tiersData] = await Promise.all([
          getEvent(id),
          getTicketTiers(id)
        ]);
        
        if (!eventData || eventData.organizerId !== user.uid) {
          router.push('/my-events');
          return;
        }

        setEvent(eventData);
        setTiers(tiersData);
        // Parse date properly (some might be full ISO strings from dummy data)
        let formattedDate = eventData.date || '';
        if (formattedDate && formattedDate.includes('T')) {
          formattedDate = formattedDate.substring(0, 10);
        }

        setEditForm({
          title: eventData.title,
          description: eventData.description,
          date: formattedDate,
          time: eventData.time || '',
          location: eventData.location,
          salesStartDateTime: eventData.salesStartDateTime,
          organizerName: eventData.organizerName || '',
          requiresApproval: eventData.requiresApproval || false,
        });
      } catch (error) {
        console.error("Error loading admin event details", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id, user, router]);

  const handleSaveEvent = async () => {
    if (!event) return;
    setSaving(true);
    try {
      const eventRef = doc(db, 'events', event.id);
      await updateDoc(eventRef, { ...editForm });
      setEvent({ ...event, ...editForm } as EventData);
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to update event', err);
      alert('Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveTier = async () => {
    if (!event || !tierForm.name || tierForm.price === undefined || tierForm.inventory === undefined) {
      alert("Please fill in all required tier fields");
      return;
    }
    setSavingTier(true);
    try {
      if (editingTierId) {
        const tierRef = doc(db, `events/${event.id}/ticketTiers`, editingTierId);
        await updateDoc(tierRef, { ...tierForm });
        setTiers(tiers.map(t => t.id === editingTierId ? { ...t, ...tierForm } as TicketTier : t));
      } else {
        const tiersRef = collection(db, `events/${event.id}/ticketTiers`);
        const docRef = await addDoc(tiersRef, {
          name: tierForm.name,
          price: Number(tierForm.price),
          inventory: Number(tierForm.inventory),
          sold: 0,
          reserved: 0,
          expiresAt: tierForm.expiresAt || null,
        });
        setTiers([...tiers, { id: docRef.id, ...tierForm, sold: 0, reserved: 0 } as TicketTier]);
      }
      setIsTierModalOpen(false);
    } catch (err) {
      console.error('Failed to save tier', err);
      alert('Failed to save tier.');
    } finally {
      setSavingTier(false);
    }
  };

  const openAddTierModal = () => {
    setEditingTierId(null);
    setTierForm({ name: '', price: 0, inventory: 0, expiresAt: '' });
    setIsTierModalOpen(true);
  };

  const openEditTierModal = (tier: TicketTier) => {
    setEditingTierId(tier.id);
    setTierForm({ 
      name: tier.name, 
      price: tier.price, 
      inventory: tier.inventory,
      expiresAt: tier.expiresAt || ''
    });
    setIsTierModalOpen(true);
  };

  const handleCancelEvent = async () => {
    if (!event) return;
    setCancellingEvent(true);
    setCancelMessage(null);
    try {
      const currentTotalSold = tiers.reduce((acc, tier) => acc + tier.sold, 0);
      const eventRef = doc(db, 'events', event.id);
      
      if (currentTotalSold === 0) {
        await updateDoc(eventRef, { status: 'deleted' });
        setEvent({ ...event, status: 'deleted' } as EventData);
        setCancelMessage("Event deleted successfully since no tickets were sold.");
      } else {
        await updateDoc(eventRef, { status: 'cancelled' });
        setEvent({ ...event, status: 'cancelled' } as EventData);
        setCancelMessage("Event cancelled. Because tickets were sold, you MUST reach out to Sack-E Online to issue refunds and payouts. Attendees have been notified.");
        // TODO: Integrate actual email notification here in the future
        console.log(`Notification to be sent to attendees of ${event.id} for cancellation.`);
      }
    } catch (err) {
      console.error('Failed to cancel event', err);
      setCancelMessage('Failed to process cancellation.');
    } finally {
      setCancellingEvent(false);
    }
  };

  const handleToggleEventPause = async () => {
    if (!event) return;
    try {
      const eventRef = doc(db, 'events', event.id);
      const newPausedState = !event.salesPaused;
      await updateDoc(eventRef, { salesPaused: newPausedState });
      setEvent({ ...event, salesPaused: newPausedState } as EventData);
    } catch (err) {
      console.error('Failed to toggle event pause', err);
    }
  };

  const handleToggleTierPause = async (tier: TicketTier) => {
    if (!event) return;
    try {
      const tierRef = doc(db, `events/${event.id}/ticketTiers`, tier.id);
      const newPausedState = !tier.salesPaused;
      await updateDoc(tierRef, { salesPaused: newPausedState });
      setTiers(tiers.map(t => t.id === tier.id ? { ...t, salesPaused: newPausedState } as TicketTier : t));
    } catch (err) {
      console.error('Failed to toggle tier pause', err);
    }
  };

  if (loading || authLoading) {
    return (
      <main className="min-h-screen pt-24 md:pt-32 pb-20 px-6 max-w-5xl mx-auto flex justify-center">
        <div className="animate-pulse flex gap-2 items-center text-on-surface-variant">
          <div className="w-2 h-2 bg-primary rounded-full"></div>
          <div className="w-2 h-2 bg-secondary rounded-full delay-75"></div>
          <div className="w-2 h-2 bg-primary rounded-full delay-150"></div>
          <span className="ml-2 text-sm font-semibold tracking-widest uppercase">Loading Event</span>
        </div>
      </main>
    );
  }

  if (!event) return null;

  // Calculate totals
  const totalCapacity = tiers.reduce((acc, tier) => acc + tier.inventory, 0);
  const totalSold = tiers.reduce((acc, tier) => acc + tier.sold, 0);
  const totalRevenue = tiers.reduce((acc, tier) => acc + (tier.sold * tier.price), 0);

  return (
    <main className="min-h-screen pt-24 md:pt-32 pb-20 px-4 md:px-6 max-w-6xl mx-auto">
      <Link href="/my-events" className="inline-flex items-center text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors mb-8">
        <ArrowLeft size={16} className="mr-2" /> Back to Dashboard
      </Link>

      <div className="flex gap-2 overflow-x-auto pb-4 hide-scrollbar">
          {(['overview', 'tickets', 'team'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 rounded-xl font-bold text-sm tracking-wide capitalize transition-colors whitespace-nowrap ${
                activeTab === tab 
                  ? 'bg-surface-container-lowest text-primary shadow-sm' 
                  : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
              }`}
            >
              {tab}
            </button>
          ))}
          {event.requiresApproval && (
            <button
              onClick={() => setActiveTab('approvals')}
              className={`px-6 py-3 rounded-xl font-bold text-sm tracking-wide capitalize transition-colors whitespace-nowrap ${
                activeTab === 'approvals' 
                  ? 'bg-surface-container-lowest text-primary shadow-sm' 
                  : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
              }`}
            >
              Approvals
            </button>
          )}
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-6 py-3 rounded-xl font-bold text-sm tracking-wide capitalize transition-colors whitespace-nowrap ${
              activeTab === 'settings' 
                ? 'bg-surface-container-lowest text-primary shadow-sm' 
                : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
            }`}
          >
            Settings
          </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Left Column: Event Details */}
        {activeTab === 'overview' && (
        <div className="w-full lg:w-1/3 space-y-6">
          <div className="bg-surface-container border border-white/10 rounded-3xl p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-32 opacity-20 overflow-hidden">
              <Image src={event.imageUrl || '/placeholder-event.jpg'} alt={event.title} fill className="object-cover" />
            </div>
            
            <div className="relative pt-20">
              <div className="flex justify-between items-start mb-2">
                <h1 className="font-display font-bold text-3xl leading-tight">{event.title}</h1>
              </div>
              
              <div className="mb-6 flex gap-2">
                <span className={`inline-flex items-center text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-md border ${
                  event.status === 'active' && new Date(event.date) < new Date()
                    ? 'bg-black/5 text-on-surface-variant border-black/10'
                    : event.status === 'active' 
                    ? 'bg-green-500/10 text-green-600 border-green-500/20' 
                    : event.status === 'suspended'
                    ? 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20'
                    : event.status === 'cancelled'
                    ? 'bg-error/10 text-error border-error/20'
                    : 'bg-on-surface/10 text-on-surface-variant border-on-surface/10'
                }`}>
                  {event.status === 'active' && new Date(event.date) < new Date() ? 'past' : event.status}
                </span>
                {event.salesPaused && event.status === 'active' && (
                  <span className="inline-flex items-center text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-md bg-orange-500/10 text-orange-600 border border-orange-500/20">
                    Sales Paused
                  </span>
                )}
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-3 text-on-surface-variant">
                  <Calendar className="text-primary" size={18} />
                  <span className="font-semibold">{event.date ? format(parseISO(event.date), 'MMMM do, yyyy') : 'TBA'}</span>
                </div>
                <div className="flex items-center gap-3 text-on-surface-variant">
                  <Clock className="text-primary" size={18} />
                  <span className="font-semibold">{event.time || 'TBA'}</span>
                </div>
                <div className="flex items-center gap-3 text-on-surface-variant">
                  <MapPin className="text-secondary" size={18} />
                  <span className="font-semibold">{event.location || 'TBA'}</span>
                </div>
              </div>

              <button 
                onClick={() => setIsEditing(true)}
                className="w-full flex justify-center items-center gap-2 py-3 bg-surface-container-high hover:bg-surface-container-highest rounded-xl font-bold transition-colors border border-on-surface/10"
              >
                <Edit3 size={18} /> Edit Details
              </button>

              <Link 
                href={`/verify/${event.id}/scanner`}
                className="w-full flex justify-center items-center gap-2 py-3 bg-primary text-on-primary hover:bg-primary-container hover:text-primary rounded-xl font-bold transition-colors shadow-lg shadow-primary/10 mt-3"
              >
                <Activity size={18} /> Open Ticket Scanner
              </Link>
            </div>
          </div>
        </div>
        )}

        {/* Right Column: Analytics & Tiers */}
        {activeTab === 'overview' && (
        <div className="w-full lg:w-2/3 space-y-6">
          
          {/* High-level metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-surface-container border border-white/10 rounded-2xl p-5">
              <p className="text-on-surface-variant text-xs font-bold uppercase tracking-wider mb-2">Tickets Sold</p>
              <h3 className="font-display text-3xl font-bold flex items-end gap-2">
                {totalSold} <span className="text-sm text-on-surface-variant mb-1 font-sans">/ {totalCapacity}</span>
              </h3>
            </div>
            <div className="bg-surface-container border border-white/10 rounded-2xl p-5">
              <p className="text-on-surface-variant text-xs font-bold uppercase tracking-wider mb-2">Gross Revenue</p>
              <h3 className="font-display text-3xl font-bold text-green-400">
                ${totalRevenue.toFixed(2)}
              </h3>
            </div>
            <div className="bg-surface-container border border-white/10 rounded-2xl p-5">
              <p className="text-on-surface-variant text-xs font-bold uppercase tracking-wider mb-2">Remaining</p>
              <h3 className="font-display text-3xl font-bold text-secondary">
                {totalCapacity - totalSold}
              </h3>
            </div>
          </div>
        </div>
        )}
        
        {activeTab === 'tickets' && (
          <div className="w-full bg-surface-container border border-white/10 rounded-3xl p-6 shadow-xl">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <h2 className="font-display text-2xl font-bold flex items-center gap-2">
                <Activity size={24} className="text-primary" /> Ticket Sales by Tier
              </h2>
              <button 
                onClick={openAddTierModal}
                className="w-full sm:w-auto text-sm px-4 py-2.5 bg-primary/20 text-primary font-bold rounded-xl hover:bg-primary/30 transition-colors text-center"
              >
                + Add Tier
              </button>
            </div>
            
            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-on-surface-variant text-sm tracking-wider uppercase">
                    <th className="pb-3 font-semibold">Tier Name</th>
                    <th className="pb-3 font-semibold">Price</th>
                    <th className="pb-3 font-semibold text-right">Sold / Cap</th>
                    <th className="pb-3 font-semibold text-right">Revenue</th>
                    <th className="pb-3 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {tiers.map(tier => {
                    const available = tier.inventory - (tier.sold + (tier.reserved || 0));
                    const isSoldOut = available <= 0;
                    return (
                      <tr key={tier.id} className="group hover:bg-black/5 transition-colors">
                        <td className="py-4 pr-4">
                          <p className="font-bold">{tier.name}</p>
                          {isSoldOut && <span className="text-[10px] uppercase font-bold text-error bg-error/10 px-2 py-0.5 rounded inline-block mt-1">Sold Out</span>}
                          {!isSoldOut && available < 40 && <span className="text-[10px] uppercase font-bold text-secondary bg-secondary/10 px-2 py-0.5 rounded inline-block mt-1">Almost Sold Out ({available} left)</span>}
                        </td>
                        <td className="py-4 text-on-surface-variant">${tier.price.toFixed(2)}</td>
                        <td className="py-4 text-right">
                          <span className="font-bold">{tier.sold}</span> <span className="text-sm text-on-surface-variant">/ {tier.inventory}</span>
                        </td>
                        <td className="py-4 text-right font-bold text-green-400">
                          ${(tier.sold * tier.price).toFixed(2)}
                        </td>
                        <td className="py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleToggleTierPause(tier)}
                              className={`text-xs font-bold px-3 py-1 border rounded transition-colors ${tier.salesPaused ? 'text-orange-500 border-orange-500/30 hover:text-orange-600 hover:bg-orange-500/10' : 'text-on-surface-variant border-on-surface/10 hover:text-on-surface hover:bg-on-surface/5'}`}
                            >
                              {tier.salesPaused ? 'Resume' : 'Pause'}
                            </button>
                            <button 
                              onClick={() => openEditTierModal(tier)}
                              className="text-xs font-bold text-primary hover:text-primary-container px-3 py-1 border border-primary/30 bg-primary/10 hover:bg-primary/20 rounded transition-colors"
                            >
                              Edit
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="sm:hidden space-y-4">
              {tiers.map(tier => {
                const available = tier.inventory - (tier.sold + (tier.reserved || 0));
                const isSoldOut = available <= 0;
                return (
                  <div key={tier.id} className="bg-surface-container-high border border-outline-variant/30 rounded-2xl p-5 space-y-4 shadow-sm">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-lg">{tier.name}</h3>
                        {isSoldOut && <span className="text-[10px] uppercase font-bold text-error bg-error/10 px-2 py-0.5 rounded inline-block mt-1">Sold Out</span>}
                        {!isSoldOut && available < 40 && <span className="text-[10px] uppercase font-bold text-secondary bg-secondary/10 px-2 py-0.5 rounded inline-block mt-1">Almost Sold Out ({available} left)</span>}
                      </div>
                      <p className="font-bold text-lg text-primary">${tier.price.toFixed(2)}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 py-3 border-y border-outline-variant/20 text-sm">
                      <div>
                        <p className="text-on-surface-variant text-xs uppercase font-semibold tracking-wide">Sold / Capacity</p>
                        <p className="font-bold mt-1">{tier.sold} <span className="text-xs text-on-surface-variant font-medium">/ {tier.inventory}</span></p>
                      </div>
                      <div>
                        <p className="text-on-surface-variant text-xs uppercase font-semibold tracking-wide">Revenue</p>
                        <p className="font-bold text-green-600 mt-1">${(tier.sold * tier.price).toFixed(2)}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-1">
                      <button
                        onClick={() => handleToggleTierPause(tier)}
                        className={`text-xs font-bold px-4 py-2 border rounded-xl transition-colors ${tier.salesPaused ? 'text-orange-600 border-orange-500/30 hover:bg-orange-500/10' : 'text-on-surface-variant border-outline-variant/50 hover:bg-on-surface/5'}`}
                      >
                        {tier.salesPaused ? 'Resume' : 'Pause'}
                      </button>
                      <button 
                        onClick={() => openEditTierModal(tier)}
                        className="text-xs font-bold text-primary hover:text-primary-container px-5 py-2 border border-primary/30 bg-primary/10 hover:bg-primary/20 rounded-xl transition-colors"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'team' && (
          <EventTeamSection eventId={event.id} />
        )}
        
        {activeTab === 'approvals' && event.requiresApproval && (
          <EventApprovalsSection eventId={event.id} isOrganizer={event.organizerId === user?.uid} />
        )}

        {activeTab === 'settings' && (
          <div className="bg-surface-container border border-white/10 rounded-3xl p-6 shadow-xl w-full">
            <h3 className="font-display font-bold text-xl mb-4 flex items-center gap-2">
              <Settings size={20} className="text-primary" /> Settings
            </h3>
            <div className="flex flex-row items-center justify-between gap-4 mb-6">
              <div className="flex-1">
                <p className="font-semibold text-on-surface">Pause Ticket Sales</p>
                <p className="text-xs text-on-surface-variant mt-1">Temporarily hide checkout and halt all sales for this event.</p>
              </div>
              <button 
                onClick={handleToggleEventPause}
                disabled={event.status === 'cancelled' || event.status === 'deleted'}
                className={`w-12 h-6 flex-shrink-0 rounded-full transition-colors relative ${event.salesPaused ? 'bg-orange-500' : 'bg-on-surface/20'} ${event.status === 'cancelled' || event.status === 'deleted' ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${event.salesPaused ? 'left-7' : 'left-1'}`} />
              </button>
            </div>
            <div className="flex justify-between items-center mt-6 pt-6 border-t border-white/10">
              <div className="flex gap-2">
                <Link 
                  href={getEventLink(event)} 
                  target="_blank"
                  className="flex items-center gap-2 px-4 py-2 bg-surface-container text-primary font-semibold rounded-lg hover:bg-surface-container-high transition-colors"
                >
                  <Eye size={16} /> View Public Page ↗
                </Link>
                <Link 
                  href={`/verify/${event.id}/scanner`}
                  className="flex items-center gap-2 px-4 py-2 bg-primary/20 text-primary font-semibold rounded-lg hover:bg-primary/30 transition-colors"
                >
                  <Activity size={16} /> Open Scanner
                </Link>
              </div>
              {(event.status === 'active' || event.status === 'pending' || event.status === 'suspended') && (
                <button
                  onClick={() => setIsCancelModalOpen(true)}
                  className="text-xs font-bold bg-error text-on-error hover:bg-red-600 uppercase tracking-wider px-4 py-2.5 rounded-lg transition-colors shadow-sm"
                >
                  Cancel Event
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal Overlay */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-surface-container-high border border-white/10 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-surface-container">
              <h2 className="font-display text-2xl font-bold">Edit Event Details</h2>
              <button onClick={() => setIsEditing(false)} className="text-on-surface-variant hover:text-on-surface transition-colors">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-2">Event Title</label>
                <input 
                  type="text" 
                  value={editForm.title || ''} 
                  onChange={e => setEditForm({...editForm, title: e.target.value})}
                  className="w-full bg-black/20 border border-white/10 rounded-xl py-3 px-4 outline-none focus:border-primary transition-all text-on-surface"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-2">Organizer / Committee Name</label>
                <input 
                  type="text" 
                  value={editForm.organizerName || ''} 
                  onChange={e => setEditForm({...editForm, organizerName: e.target.value})}
                  className="w-full bg-black/20 border border-white/10 rounded-xl py-3 px-4 outline-none focus:border-primary transition-all text-on-surface"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-2">Description</label>
                <textarea 
                  value={editForm.description || ''} 
                  onChange={e => setEditForm({...editForm, description: e.target.value})}
                  rows={4}
                  className="w-full bg-black/20 border border-white/10 rounded-xl py-3 px-4 outline-none focus:border-primary transition-all text-on-surface resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-2">Date</label>
                  <input 
                    type="date" 
                    value={editForm.date || ''} 
                    onChange={e => setEditForm({...editForm, date: e.target.value})}
                    className="w-full bg-black/20 border border-white/10 rounded-xl py-3 px-4 outline-none focus:border-primary transition-all text-on-surface [color-scheme:dark]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-2">Time</label>
                  <input 
                    type="time" 
                    value={editForm.time || ''} 
                    onChange={e => setEditForm({...editForm, time: e.target.value})}
                    className="w-full bg-black/20 border border-white/10 rounded-xl py-3 px-4 outline-none focus:border-primary transition-all text-on-surface [color-scheme:dark]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-2">Location</label>
                <input 
                  type="text" 
                  value={editForm.location || ''} 
                  onChange={e => setEditForm({...editForm, location: e.target.value})}
                  className="w-full bg-black/20 border border-white/10 rounded-xl py-3 px-4 outline-none focus:border-primary transition-all text-on-surface"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-2">Ticket Sales Go Live (Optional)</label>
                <input 
                  type="datetime-local" 
                  value={editForm.salesStartDateTime ? new Date(editForm.salesStartDateTime).toISOString().slice(0,16) : ''} 
                  onChange={e => setEditForm({...editForm, salesStartDateTime: e.target.value ? new Date(e.target.value).toISOString() : ''})}
                  className="w-full bg-black/20 border border-white/10 rounded-xl py-3 px-4 outline-none focus:border-primary transition-all text-on-surface [color-scheme:dark]"
                />
                <p className="text-xs text-on-surface-variant mt-2">If set, tickets will be hidden until this date and time.</p>
              </div>
              
              <div className="pt-4 border-t border-white/10 mt-4">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative">
                    <input 
                      type="checkbox" 
                      className="sr-only"
                      checked={!!editForm.requiresApproval}
                      onChange={e => setEditForm({...editForm, requiresApproval: e.target.checked})}
                    />
                    <div className={`w-12 h-6 rounded-full transition-colors relative ${editForm.requiresApproval ? 'bg-primary' : 'bg-on-surface/20'}`}>
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${editForm.requiresApproval ? 'left-7' : 'left-1'}`} />
                    </div>
                  </div>
                  <div>
                    <span className="font-semibold text-on-surface">Require Committee Approval for Tickets</span>
                    <p className="text-xs text-on-surface-variant">If enabled, users must request tickets from a committee member instead of purchasing immediately.</p>
                  </div>
                </label>
              </div>
            </div>
            <div className="p-6 border-t border-white/10 bg-surface-container flex justify-end gap-3">
              <button 
                onClick={() => setIsEditing(false)}
                className="px-6 py-3 font-bold rounded-xl hover:bg-black/5 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveEvent}
                disabled={saving}
                className="px-6 py-3 bg-primary text-on-primary font-bold rounded-xl hover:bg-primary-container transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? 'Saving...' : <><Check size={18}/> Save Changes</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tier Management Modal */}
      {isTierModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-surface-container-high border border-white/10 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-surface-container">
              <h2 className="font-display text-2xl font-bold">{editingTierId ? 'Edit Ticket Tier' : 'Add Ticket Tier'}</h2>
              <button onClick={() => setIsTierModalOpen(false)} className="text-on-surface-variant hover:text-on-surface transition-colors">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-2">Tier Name</label>
                <input 
                  type="text" 
                  value={tierForm.name || ''} 
                  onChange={e => setTierForm({...tierForm, name: e.target.value})}
                  className="w-full bg-black/20 border border-white/10 rounded-xl py-3 px-4 outline-none focus:border-primary transition-all text-on-surface"
                  placeholder="e.g. VIP, Early Bird"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-2">Price ($)</label>
                  <input 
                    type="number" 
                    min="0"
                    step="0.01"
                    value={tierForm.price === undefined || Number.isNaN(tierForm.price) ? '' : tierForm.price} 
                    onChange={e => {
                      const val = parseFloat(e.target.value);
                      setTierForm({...tierForm, price: e.target.value === '' ? undefined : val});
                    }}
                    className="w-full bg-black/20 border border-white/10 rounded-xl py-3 px-4 outline-none focus:border-primary transition-all text-on-surface"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-2">Total Capacity</label>
                  <input 
                    type="number" 
                    min="1"
                    value={tierForm.inventory === undefined || Number.isNaN(tierForm.inventory) ? '' : tierForm.inventory} 
                    onChange={e => {
                      const val = parseInt(e.target.value, 10);
                      setTierForm({...tierForm, inventory: e.target.value === '' ? undefined : val});
                    }}
                    className="w-full bg-black/20 border border-white/10 rounded-xl py-3 px-4 outline-none focus:border-primary transition-all text-on-surface"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-2">Sales End / Expiration (Optional)</label>
                <input 
                  type="datetime-local" 
                  value={tierForm.expiresAt ? new Date(tierForm.expiresAt).toISOString().slice(0,16) : ''} 
                  onChange={e => setTierForm({...tierForm, expiresAt: e.target.value ? new Date(e.target.value).toISOString() : ''})}
                  className="w-full bg-black/20 border border-white/10 rounded-xl py-3 px-4 outline-none focus:border-primary transition-all text-on-surface [color-scheme:dark]"
                />
                <p className="text-xs text-on-surface-variant mt-2">After this date, the tier will be automatically hidden from purchasers.</p>
              </div>
            </div>
            <div className="p-6 border-t border-white/10 bg-surface-container flex justify-end gap-3">
              <button 
                onClick={() => setIsTierModalOpen(false)}
                className="px-6 py-3 font-bold rounded-xl hover:bg-black/5 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveTier}
                disabled={savingTier}
                className="px-6 py-3 bg-primary text-on-primary font-bold rounded-xl hover:bg-primary-container transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {savingTier ? 'Saving...' : <><Check size={18}/> Save Tier</>}
              </button>
            </div>
          </div>
        </div>
      )}
      {isWelcomeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-surface-container border border-white/10 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl p-6 md:p-8 flex flex-col items-center text-center relative">
            <button 
              onClick={() => setIsWelcomeModalOpen(false)} 
              className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface transition-colors"
            >
              <X size={20} />
            </button>

            <div className="relative mb-6">
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full"></div>
              <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-surface-container-high border border-white/10 text-primary shadow-lg">
                <Activity size={32} className="animate-pulse" />
              </div>
            </div>

            <h2 className="font-display text-2xl font-bold text-on-surface mb-2">Event Created!</h2>
            <p className="text-sm text-on-surface-variant mb-6 max-w-xs leading-relaxed">
              Your event details are saved. Let&apos;s create your first ticket tier so people can start buying tickets.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <button
                onClick={() => {
                  setIsWelcomeModalOpen(false);
                  openAddTierModal();
                }}
                className="flex-1 py-3 px-4 bg-primary text-on-primary font-bold rounded-xl hover:bg-primary-container transition-all text-sm shadow-lg shadow-primary/10"
              >
                Create Tier
              </button>
              <button
                onClick={() => setIsWelcomeModalOpen(false)}
                className="flex-1 py-3 px-4 bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-bold rounded-xl border border-white/10 transition-all text-sm"
              >
                Do it Later
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Event Modal */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-surface-container border border-error/20 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl p-6 md:p-8 flex flex-col relative">
            <button 
              onClick={() => setIsCancelModalOpen(false)} 
              className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface transition-colors"
            >
              <X size={20} />
            </button>
            
            <h2 className="font-display text-2xl font-bold text-on-surface mb-4">Cancel Event</h2>
            
            {cancelMessage ? (
              <div className="bg-error/10 border border-error/20 p-4 rounded-xl mb-6">
                <p className="text-sm font-semibold text-error text-center">{cancelMessage}</p>
              </div>
            ) : (
              <p className="text-sm text-on-surface-variant mb-6 leading-relaxed">
                Are you sure you want to cancel this event? 
                {totalSold > 0 ? (
                  <span className="block mt-2 font-bold text-error">
                    Warning: You have sold {totalSold} ticket(s). You will be required to contact Sack-E Online to issue refunds manually.
                  </span>
                ) : (
                  <span className="block mt-2">
                    Since you have sold 0 tickets, this event will simply be deleted and removed from the public page.
                  </span>
                )}
              </p>
            )}

            <div className="flex flex-col sm:flex-row gap-3 w-full mt-4">
              {cancelMessage ? (
                <button
                  onClick={() => setIsCancelModalOpen(false)}
                  className="flex-1 py-3 px-4 bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-bold rounded-xl transition-all text-sm"
                >
                  Close
                </button>
              ) : (
                <>
                  <button
                    onClick={handleCancelEvent}
                    disabled={cancellingEvent}
                    className="flex-1 py-3 px-4 bg-error text-on-error font-bold rounded-xl hover:bg-red-600 transition-all text-sm shadow-lg shadow-error/10 disabled:opacity-50"
                  >
                    {cancellingEvent ? 'Processing...' : 'Yes, Cancel Event'}
                  </button>
                  <button
                    onClick={() => setIsCancelModalOpen(false)}
                    disabled={cancellingEvent}
                    className="flex-1 py-3 px-4 bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-bold rounded-xl border border-white/10 transition-all text-sm disabled:opacity-50"
                  >
                    Nevermind
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
