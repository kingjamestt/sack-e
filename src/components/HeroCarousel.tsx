'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Calendar, MapPin } from 'lucide-react';
import { getFeaturedEvents, getEventLink } from '@/lib/events';
import { EventData } from '@/types';
import { format, parseISO } from 'date-fns';

export default function HeroCarousel() {
  const [events, setEvents] = useState<EventData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadEvents() {
      try {
        const featured = await getFeaturedEvents();
        setEvents(featured);
      } catch (error) {
        console.error("Failed to load featured events:", error);
      } finally {
        setLoading(false);
      }
    }
    void loadEvents();
  }, []);

  const nextSlide = useCallback(() => {
    if (events.length > 0) {
      setCurrentIndex((prev) => (prev + 1) % events.length);
    }
  }, [events.length]);

  const prevSlide = useCallback(() => {
    if (events.length > 0) {
      setCurrentIndex((prev) => (prev === 0 ? events.length - 1 : prev - 1));
    }
  }, [events.length]);

  useEffect(() => {
    if (events.length <= 1) return;
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, [events.length, nextSlide]);

  if (loading) {
    return (
      <section className="relative w-full h-[60vh] min-h-[400px] flex items-center justify-center overflow-hidden animate-pulse bg-surface-container">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-surface/90 to-surface" />
      </section>
    );
  }

  // Fallback to static hero if no events returned
  if (events.length === 0) {
    return (
      <section className="relative w-full h-[550px] md:h-[614px] min-h-[500px] flex flex-col justify-end pb-16 overflow-hidden animate-fadeIn group">
        <Image 
          src="/hero.jpg"
          alt="Hero"
          fill
          priority
          className="object-cover opacity-95 transition-transform duration-1000 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#001d3d]/90 via-[#0B4DE5]/40 to-transparent z-10" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#001d3d]/70 to-transparent hidden md:block z-10" />
        
        <div className="relative z-20 px-6 md:px-8 w-full max-w-7xl mx-auto flex flex-col items-start animate-in slide-in-from-bottom-8 fade-in duration-700">
          <div className="flex gap-2 mb-4">
            <span className="bg-primary/20 backdrop-blur-md text-primary-fixed border border-primary/30 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
              Trending
            </span>
          </div>
          <h1 className="font-display font-extrabold text-5xl md:text-[80px] md:leading-[88px] text-on-primary mb-6 drop-shadow-lg">
            Experience the <br className="hidden md:block"/>Unforgettable
          </h1>
          <p className="text-lg md:text-xl text-on-primary/90 mb-8 font-body max-w-2xl">
            Secure your spot at the most exclusive events. Premium access, instant ticketing.
          </p>
          <a 
            href="#events-section"
            className="bg-primary text-on-primary font-semibold text-sm px-10 py-4 rounded-full shadow-[0_8px_24px_rgba(0,104,93,0.4)] hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(0,104,93,0.5)] transition-all duration-300 flex items-center gap-2"
          >
            Browse Events
          </a>
        </div>
      </section>
    );
  }

  const currentEvent = events[currentIndex];

  return (
    <section className="relative w-full h-[550px] md:h-[614px] min-h-[500px] flex flex-col justify-end pb-16 overflow-hidden group">
      {/* Background Image Carousel */}
      {events.map((event, idx) => (
        <div 
          key={event.id}
          className={`absolute inset-0 transition-all duration-1000 ease-in-out ${idx === currentIndex ? 'opacity-100 z-0 scale-100' : 'opacity-0 -z-10 scale-105'}`}
        >
          <Image
            src={event.imageUrl || '/placeholder-event.jpg'}
            alt={event.title}
            fill
            priority={idx === 0}
            className="object-cover"
          />
        </div>
      ))}
      
      {/* Deep Blue Overlay for readability and theme matching */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#001d3d]/95 via-[#0B4DE5]/50 to-transparent z-10" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#001d3d]/70 to-transparent hidden md:block z-10" />

      {/* Content */}
      <div className="relative z-20 w-full max-w-7xl mx-auto px-6 md:px-8 flex flex-col items-start">
        <div className="max-w-3xl flex flex-col gap-2 animate-in slide-in-from-bottom-8 fade-in duration-700" key={currentEvent.id}>
          {currentEvent.isFeatured && (
            <div className="flex gap-2 mb-2">
              <span className="bg-primary/20 backdrop-blur-md text-primary-fixed border border-primary/30 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
                Trending
              </span>
            </div>
          )}
          
          <h1 className="font-display font-extrabold text-5xl md:text-[80px] md:leading-[88px] text-on-primary mb-2 drop-shadow-lg">
            {currentEvent.title}
          </h1>

          {currentEvent.organizerName && (
            <div className="text-lg md:text-xl font-semibold text-on-primary/90 mt-2 drop-shadow-md">
              Presented by {currentEvent.organizerName}
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 mt-4 mb-6 text-on-primary/90 font-body text-lg opacity-90">
            <div className="flex items-center gap-2">
              <Calendar size={20} />
              <span>{format(parseISO(currentEvent.date), 'MMMM do, yyyy')}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin size={20} />
              <span>{currentEvent.location}</span>
            </div>
          </div>
          
          <Link 
            href={getEventLink(currentEvent)}
            className="w-full md:w-auto md:self-start bg-primary text-on-primary font-semibold text-sm px-10 py-4 rounded-full shadow-[0_8px_24px_rgba(0,104,93,0.4)] hover:-translate-y-1 hover:bg-primary-container hover:shadow-[0_12px_32px_rgba(0,104,93,0.5)] transition-all duration-300 flex justify-center items-center gap-2 mt-2"
          >
            Get Tickets
          </Link>
        </div>
      </div>

      {/* Carousel Controls */}
      {events.length > 1 && (
        <>
          <button 
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-2 rounded-full bg-surface/20 hover:bg-surface/60 text-white backdrop-blur-sm border border-white/10 transition-all opacity-0 group-hover:opacity-100"
          >
            <ChevronLeft size={32} />
          </button>
          <button 
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-2 rounded-full bg-surface/20 hover:bg-surface/60 text-white backdrop-blur-sm border border-white/10 transition-all opacity-0 group-hover:opacity-100"
          >
            <ChevronRight size={32} />
          </button>

          {/* Indicators */}
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2">
            {events.map((_, idx) => (
              <button 
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`transition-all rounded-full ${idx === currentIndex ? 'w-8 h-2 bg-primary' : 'w-2 h-2 bg-white/40 hover:bg-white/60'}`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
