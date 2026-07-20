'use client';

import { useState, useEffect, useRef, useCallback, Fragment } from 'react';
import { getEvents } from '@/lib/events';
import { EventData } from '@/types';
import { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { format, parseISO } from 'date-fns';
import EventCalendar from './EventCalendar';
import EventCard from './EventCard';

export default function EventList({ 
  viewMode = 'grid', 
  searchQuery = '',
  initialEvents = []
}: { 
  viewMode?: 'grid' | 'calendar'; 
  searchQuery?: string;
  initialEvents?: EventData[];
}) {
  const [events, setEvents] = useState<EventData[]>(initialEvents);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [loading, setLoading] = useState(false);
  const [firstLoad, setFirstLoad] = useState(initialEvents.length === 0);
  // If we have initialEvents, we still don't know the exact lastDoc for pagination, 
  // but since we fetched 9 on the server, we assume there might be more. 
  // Wait, if we don't have lastDoc, the next fetch will fetch page 1 again, resulting in duplicates being filtered out!
  // To avoid fetching page 1 again, if initialEvents are provided, we should ideally have the lastDoc, but since we can't serialize it, we might just fetch the next page by passing a special cursor or re-fetching and filtering.
  // We'll leave setHasMore(true) and let the Set filter out duplicates when it refetches page 1 on scroll.
  const [hasMore, setHasMore] = useState(true);
  const observer = useRef<IntersectionObserver | null>(null);

  const fetchEvents = async (last?: QueryDocumentSnapshot<DocumentData> | null) => {
    if (loading || !hasMore) return;
    
    setLoading(true);
    try {
      const { events: newEvents, lastVisible } = await getEvents(last);
      if (!last) {
        setEvents(newEvents);
      } else {
        setEvents((prev) => {
          const existingIds = new Set(prev.map(e => e.id));
          const uniqueNewEvents = newEvents.filter(e => !existingIds.has(e.id));
          return [...prev, ...uniqueNewEvents];
        });
      }
      setLastDoc(lastVisible);
      if (newEvents.length === 0 || !lastVisible) {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
      setFirstLoad(false);
    }
  };

  useEffect(() => {
    // Only fetch if we didn't receive initial events
    if (initialEvents.length === 0) {
      void fetchEvents(null);
    }
  }, []);

  const lastEventElementRef = useCallback((node: HTMLAnchorElement | null) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        fetchEvents(lastDoc);
      }
    });
    
    if (node) observer.current.observe(node);
  }, [loading, hasMore, lastDoc]);

  const filteredEvents = events.filter(event => {
    if (!searchQuery) return true;
    const lower = searchQuery.toLowerCase().trim();
    if (!lower) return true;
    return (
      event.title.toLowerCase().includes(lower) || 
      event.location.toLowerCase().includes(lower) ||
      (event.description && event.description.toLowerCase().includes(lower)) ||
      (event.organizerName && event.organizerName.toLowerCase().includes(lower))
    );
  });

  if (firstLoad) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="animate-pulse rounded-3xl overflow-hidden bg-surface-container-lowest border border-outline-variant/20 h-[400px]">
            <div className="w-full h-full bg-surface-container-highest"></div>
          </div>
        ))}
      </div>
    );
  }

  if (filteredEvents.length === 0 && !loading) {
    return <div className="text-center py-20 text-on-surface-variant font-semibold">No events found.</div>;
  }

  // Group filtered events by month
  const groupedEvents: { [key: string]: EventData[] } = {};
  filteredEvents.forEach(event => {
    const monthYear = format(parseISO(event.date), 'MMMM yyyy');
    if (!groupedEvents[monthYear]) {
      groupedEvents[monthYear] = [];
    }
    groupedEvents[monthYear].push(event);
  });

  const lastEventId = filteredEvents[filteredEvents.length - 1]?.id;

  if (viewMode === 'calendar' && !searchQuery) {
    return <EventCalendar events={events} />;
  }

  return (
    <div className="min-h-[60vh] space-y-12">
      {Object.entries(groupedEvents).map(([monthYear, monthEvents]) => (
        <div key={monthYear} className="relative">
          {/* Sticky Month Header */}
          <div className="sticky top-4 z-20 -mx-4 px-4 py-3 bg-surface/90 backdrop-blur-md border-b border-outline-variant/30 flex justify-between items-center rounded-xl shadow-sm mb-6">
            <h3 className="text-sm font-extrabold uppercase tracking-[0.2em] text-primary">
              {monthYear}
            </h3>
            <span className="text-xs font-bold text-on-surface-variant bg-surface-container-high px-3 py-1 rounded-full">
              {monthEvents.length} {monthEvents.length === 1 ? 'event' : 'events'}
            </span>
          </div>

          {/* Grid of Events for this month */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {monthEvents.map((event) => {
              const isLast = event.id === lastEventId;
              return (
                <div key={event.id} className="col-span-1 h-[400px]">
                  <EventCard 
                    event={event} 
                    innerRef={isLast ? lastEventElementRef : undefined} 
                  />
                </div>
              );
            })}
          </div>
        </div>
      ))}
      
      {loading && (
        <div className="w-full flex justify-center py-12">
          <div className="animate-pulse flex gap-2 items-center text-on-surface-variant">
            <div className="w-2.5 h-2.5 bg-primary rounded-full"></div>
            <div className="w-2.5 h-2.5 bg-secondary rounded-full delay-75"></div>
            <div className="w-2.5 h-2.5 bg-primary rounded-full delay-150"></div>
            <span className="ml-3 text-sm font-bold tracking-widest uppercase">Loading More</span>
          </div>
        </div>
      )}
    </div>
  );
}
