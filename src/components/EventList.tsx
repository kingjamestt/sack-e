'use client';

import { useState, useEffect, useRef, useCallback, Fragment } from 'react';
import { getEvents } from '@/lib/events';
import { EventData } from '@/types';
import { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { format, parseISO } from 'date-fns';
import EventCalendar from './EventCalendar';
import EventCard from './EventCard';

export default function EventList({ viewMode = 'grid', searchQuery = '' }: { viewMode?: 'grid' | 'calendar', searchQuery?: string }) {
  const [events, setEvents] = useState<EventData[]>([]);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [loading, setLoading] = useState(false);
  const [firstLoad, setFirstLoad] = useState(true);
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
    void fetchEvents(null);
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
    const lower = searchQuery.toLowerCase();
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

  if (viewMode === 'calendar' && !searchQuery) {
    return <EventCalendar events={events} />;
  }

  return (
    <div className="min-h-[60vh]">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredEvents.map((event, index) => {
          const isLast = filteredEvents.length === index + 1;
          const currentMonthYear = format(parseISO(event.date), 'MMM yyyy');
          const prevMonthYear = index > 0 ? format(parseISO(filteredEvents[index - 1].date), 'MMM yyyy') : null;
          const showSeparator = currentMonthYear !== prevMonthYear;

          return (
            <Fragment key={`fragment-${event.id}`}>
              {showSeparator && (
                <div className="col-span-full sticky top-[72px] md:top-[88px] z-30 bg-background/90 backdrop-blur-md py-4 mt-8 mb-4 first:mt-0 -mx-4 px-4 shadow-sm border-y border-outline-variant/10">
                  <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-on-surface-variant opacity-80">
                    {currentMonthYear}
                  </h3>
                </div>
              )}
              <div className="col-span-1 h-[400px]">
                <EventCard 
                  event={event} 
                  innerRef={isLast ? lastEventElementRef : undefined} 
                />
              </div>
            </Fragment>
          );
        })}
      </div>
      
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
