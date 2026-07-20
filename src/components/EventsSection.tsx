'use client';

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Calendar, Search, LayoutGrid, X } from "lucide-react";
import EventList from "./EventList";
import Fireflies from "./Fireflies";

function EventsContent() {
  const searchParams = useSearchParams();
  const [viewMode, setViewMode] = useState<'grid' | 'calendar'>('grid');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');

  useEffect(() => {
    const q = searchParams.get('q');
    if (q !== null) {
      setSearchQuery(q);
    }
  }, [searchParams]);

  return (
    <section id="events-section" className="relative px-6 md:px-8 py-16 w-full max-w-7xl mx-auto scroll-mt-24 animate-slideUp">
      <Fireflies quantity={25} />
      
      {/* Tightened Header Bar */}
      <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 mb-12 border-b border-outline-variant/30 pb-6">
        <div>
          <h2 className="font-display text-4xl font-bold text-on-background mb-1">Upcoming Events</h2>
          <p className="font-body text-base text-on-surface-variant">Sorted by closest date</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
          {/* Prominent Search Field */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" size={20} />
            <input 
              type="text" 
              placeholder="Search events, artists..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-full py-3 pl-12 pr-4 font-body text-base text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <button 
            onClick={() => setViewMode(viewMode === 'grid' ? 'calendar' : 'grid')} 
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-surface-container text-on-surface font-semibold text-sm px-6 py-3 rounded-full hover:bg-surface-container-high transition-colors border border-outline-variant/50"
          >
            {viewMode === 'grid' ? (
              <>
                <Calendar size={20} className="text-on-surface-variant" />
                <span>Calendar View</span>
              </>
            ) : (
              <>
                <LayoutGrid size={20} className="text-on-surface-variant" />
                <span>Grid View</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Event Grid & Calendar & Infinite Scroll */}
      <div className="relative z-10">
        <EventList viewMode={viewMode} searchQuery={searchQuery} />
      </div>
    </section>
  );
}

export default function EventsSection() {
  return (
    <Suspense fallback={<div className="h-96 flex items-center justify-center">Loading...</div>}>
      <EventsContent />
    </Suspense>
  );
}
