'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import { ArrowLeft, Save } from 'lucide-react';
import ImageUpload from '@/components/ImageUpload';

export default function CreateEventPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [salesStart, setSalesStart] = useState('');
  const [organizerName, setOrganizerName] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      const eventsRef = collection(db, 'events');
      // Combine date and time for ISO string, or just use the date
      // We will just store date string as ISO for simplicity if time isn't strict, but let's just make an ISO
      const dateTimeString = new Date(`${date}T${time || '00:00'}`).toISOString();
      
      const payload: any = {
        title,
        date: dateTimeString,
        time,
        location,
        description,
        imageUrl: imageUrl || `https://loremflickr.com/800/600/concert,neon,party?random=${Math.random()}`,
        organizerId: user.uid,
        organizerName: organizerName.trim() || user.displayName || 'Organizer',
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      if (salesStart) {
        payload.salesStartDateTime = new Date(salesStart).toISOString();
      }

      const eventDoc = await addDoc(eventsRef, payload);
      router.push(`/my-events/events/${eventDoc.id}?new=true`);
    } catch (err: any) {
      setError(err.message || 'Failed to create event');
      setIsLoading(false);
    }
  };

  if (loading || !user) return null;

  return (
    <main className="min-h-screen pt-24 md:pt-32 pb-20 px-4 md:px-6 max-w-3xl mx-auto">
      <Link href="/my-events" className="inline-flex items-center text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors mb-8">
        <ArrowLeft size={16} className="mr-2" /> Back to Dashboard
      </Link>
      
      <div className="mb-8">
        <h1 className="font-display font-bold text-4xl tracking-tight mb-4">Create Event</h1>
        <div className="bg-primary/5 border border-primary/20 p-4 rounded-xl">
          <p className="text-sm text-on-surface-variant">
            <strong>Pro Tip:</strong> Fill out the details below to launch your event. You'll be able to add ticket tiers and manage availability on the next page after your event is created.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-surface-container border border-black/10 p-6 md:p-8 rounded-3xl">
        {error && (
          <div className="p-4 bg-error/10 text-error rounded-xl font-semibold border border-error/20">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-2">Event Title</label>
          <input 
            type="text" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-surface-container-high border border-black/10 rounded-xl py-3 px-4 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-on-surface"
            placeholder="E.g. Neon Nights Festival"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-2">Organizer / Committee Name</label>
          <input 
            type="text" 
            value={organizerName}
            onChange={(e) => setOrganizerName(e.target.value)}
            className="w-full bg-surface-container-high border border-black/10 rounded-xl py-3 px-4 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-on-surface"
            placeholder="E.g. The Party People"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-2">Date</label>
            <input 
              type="date" 
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-surface-container-high border border-black/10 rounded-xl py-3 px-4 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-on-surface [color-scheme:dark]"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-2">Time</label>
            <input 
              type="time" 
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full bg-surface-container-high border border-black/10 rounded-xl py-3 px-4 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-on-surface [color-scheme:dark]"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-2">Location</label>
          <input 
            type="text" 
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full bg-surface-container-high border border-black/10 rounded-xl py-3 px-4 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-on-surface"
            placeholder="E.g. Queens Park Savannah, Port of Spain"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-2">Event Banner</label>
          <ImageUpload 
            value={imageUrl} 
            onChange={setImageUrl} 
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-2">Ticket Sales Go Live (Optional)</label>
          <input 
            type="datetime-local" 
            value={salesStart}
            onChange={(e) => setSalesStart(e.target.value)}
            className="w-full bg-surface-container-high border border-black/10 rounded-xl py-3 px-4 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-on-surface [color-scheme:dark]"
          />
          <p className="text-xs text-on-surface-variant mt-2">If set, tickets will be hidden until this date and time.</p>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-2">Description</label>
          <textarea 
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-surface-container-high border border-black/10 rounded-xl py-3 px-4 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-on-surface min-h-[120px]"
            placeholder="Describe your event..."
            required
          />
        </div>

        <button 
          type="submit" 
          disabled={isLoading}
          className="w-full py-4 mt-4 bg-gradient-to-r from-primary to-secondary text-on-primary font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isLoading ? 'Creating Event...' : <><Save size={20} /> Create Event</>}
        </button>
      </form>
    </main>
  );
}
