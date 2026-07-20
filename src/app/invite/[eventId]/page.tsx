'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getEvent } from '@/lib/events';
import { requestCommitteeAccess, getTeamMembers } from '@/lib/team';
import { createNotification } from '@/lib/notifications';
import { EventData, TeamMember } from '@/types';
import Link from 'next/link';
import { CheckCircle2, UserPlus, ShieldAlert, ArrowLeft } from 'lucide-react';

export default function InvitePage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = use(params);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [isRequesting, setIsRequesting] = useState(false);
  const [requestStatus, setRequestStatus] = useState<'idle' | 'already_requested' | 'already_member' | 'success'>('idle');

  useEffect(() => {
    async function loadData() {
      if (authLoading) return;
      if (!user) {
        // Must be logged in to request access
        router.push(`/login?redirect=/invite/${eventId}`);
        return;
      }

      try {
        const [eventData, members] = await Promise.all([
          getEvent(eventId),
          getTeamMembers(eventId)
        ]);
        
        if (!eventData) {
          setError('Event not found.');
          setLoading(false);
          return;
        }

        setEvent(eventData);

        // Check if user is already a member or has already requested
        if (user.email) {
          const existingMember = members.find(m => m.email === user.email?.toLowerCase());
          if (existingMember) {
            if (existingMember.status === 'requested') {
              setRequestStatus('already_requested');
            } else {
              setRequestStatus('already_member');
            }
          }
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load event data.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [eventId, user, authLoading, router]);

  const handleRequestAccess = async () => {
    if (!user || !user.email || !event) return;
    
    setIsRequesting(true);
    setError('');

    try {
      await requestCommitteeAccess(eventId, user.email, user.uid);
      
      // Notify the organizer
      await createNotification(event.organizerId, {
        title: 'New Committee Request',
        message: `${user.email} has requested to join the committee for ${event.title}.`,
        type: 'approval_request',
        relatedDocId: eventId,
        link: `/my-events/events/${eventId}#team`
      });

      setRequestStatus('success');
    } catch (err: any) {
      setError(err.message || 'Failed to request access.');
    } finally {
      setIsRequesting(false);
    }
  };

  if (loading || authLoading) {
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

  if (error || !event) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
        <ShieldAlert size={64} className="text-error mb-4" />
        <h1 className="text-2xl font-bold mb-4">{error || 'Event not found'}</h1>
        <Link href="/" className="text-primary hover:underline flex items-center gap-2">
          <ArrowLeft size={16} /> Go back home
        </Link>
      </div>
    );
  }

  return (
    <main className="min-h-screen pt-24 md:pt-28 pb-20 px-4 flex justify-center items-center">
      <div className="bg-surface-container border border-black/10 rounded-3xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden">
        {/* Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-primary/20 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 text-center">
          {requestStatus === 'success' || requestStatus === 'already_requested' ? (
            <>
              <div className="w-20 h-20 bg-success/20 text-success rounded-full flex items-center justify-center mx-auto mb-6 border border-success/30 shadow-[0_0_30px_rgba(0,255,0,0.2)]">
                <CheckCircle2 size={40} />
              </div>
              <h1 className="font-display text-2xl font-bold mb-2">Request Sent</h1>
              <p className="text-on-surface-variant mb-8 text-sm leading-relaxed">
                {requestStatus === 'already_requested' 
                  ? 'You have already requested access. The organizer has been notified.' 
                  : 'Your request has been sent to the organizer. You will be notified when it is approved.'}
              </p>
              <Link 
                href="/"
                className="inline-block w-full py-4 bg-primary text-on-primary font-bold rounded-xl hover:bg-primary-container transition-colors shadow-lg"
              >
                Return to Home
              </Link>
            </>
          ) : requestStatus === 'already_member' ? (
            <>
              <div className="w-20 h-20 bg-primary/20 text-primary rounded-full flex items-center justify-center mx-auto mb-6 border border-primary/30">
                <CheckCircle2 size={40} />
              </div>
              <h1 className="font-display text-2xl font-bold mb-2">You are a Member</h1>
              <p className="text-on-surface-variant mb-8 text-sm leading-relaxed">
                You are already on the committee for this event.
              </p>
              <Link 
                href={`/events/${event.id}`}
                className="inline-block w-full py-4 bg-primary text-on-primary font-bold rounded-xl hover:bg-primary-container transition-colors shadow-lg"
              >
                View Event
              </Link>
            </>
          ) : (
            <>
              <div className="flex items-center justify-center w-16 h-16 bg-primary/20 text-primary rounded-2xl mx-auto mb-6">
                <UserPlus size={32} />
              </div>
              <h1 className="font-display text-2xl font-bold mb-2">Join Committee</h1>
              <p className="text-on-surface-variant text-sm mb-6">
                You have been invited to request committee access for <strong className="text-white">{event.title}</strong>.
              </p>
              
              <div className="bg-black/20 rounded-xl p-4 mb-8 border border-white/5">
                <p className="text-xs text-on-surface-variant mb-1 uppercase tracking-wider font-bold">Logged in as</p>
                <p className="font-mono text-sm truncate">{user?.email}</p>
              </div>

              <button 
                onClick={handleRequestAccess}
                disabled={isRequesting}
                className="w-full py-4 bg-gradient-to-r from-primary to-secondary text-on-primary font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 shadow-lg shadow-primary/20"
              >
                {isRequesting ? 'Requesting...' : 'Request Access'}
              </button>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
