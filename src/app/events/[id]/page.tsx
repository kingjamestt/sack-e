import { getEvent, getTicketTiers, extractEventId } from '@/lib/events';
import EventDetailsClient from './EventDetailsClient';
import Link from 'next/link';

export const revalidate = 60;

export default async function EventDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await params;
  const id = extractEventId(rawId);
  
  try {
    const [eventData, tiersData] = await Promise.all([
      getEvent(id),
      getTicketTiers(id)
    ]);

    if (!eventData) {
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
      <EventDetailsClient 
        event={eventData} 
        tiers={tiersData} 
        id={id} 
        rawId={rawId} 
      />
    );
  } catch (error) {
    console.error("Error loading event:", error);
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
        <h1 className="text-3xl font-bold mb-4">Error Loading Event</h1>
        <p className="text-on-surface-variant mb-8">An error occurred while loading this event. Please try again later.</p>
        <Link href="/" className="px-6 py-3 bg-primary text-on-primary rounded-xl font-bold hover:bg-primary-container transition-colors">
          Browse Events
        </Link>
      </div>
    );
  }
}
