import Link from 'next/link';
import { EventData } from '@/types';
import { format, parseISO } from 'date-fns';
import { getEventLink } from '@/lib/events';
import Image from 'next/image';

interface EventCardProps {
  event: EventData;
  innerRef?: (node: HTMLAnchorElement | null) => void;
}

export default function EventCard({ event, innerRef }: EventCardProps) {

  return (
    <Link 
      ref={innerRef}
      href={getEventLink(event)} 
      className="group flex flex-col w-full h-full relative rounded-3xl overflow-hidden glass hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 animate-slideUp"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-white/10 z-0"></div>

      <div className="relative w-full h-1/2 overflow-hidden z-10">
        <Image
          src={event.imageUrl || '/placeholder-event.jpg'}
          alt={event.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-90 transition-opacity duration-300 group-hover:opacity-100" />
        
        <div className="absolute top-5 right-5 glass px-4 py-1.5 rounded-full text-xs font-bold tracking-wide shadow-lg border border-white/20 backdrop-blur-md text-white">
          {event.price === 'Free' ? 'Free Entry' : event.price}
        </div>
      </div>
      
      <div className="relative z-10 p-6 sm:p-8 flex flex-col gap-3 flex-grow w-full bg-white/40 backdrop-blur-xl border-t border-white/20 justify-between">
        <div>
            <div className="text-xs sm:text-sm text-primary font-bold tracking-widest uppercase flex items-center gap-2 mb-2">
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none" className="opacity-80"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            {format(parseISO(event.date), 'MMM dd • h:mm a')}
            </div>
            
            <h4 className="font-display font-extrabold leading-tight text-on-background group-hover:text-primary transition-colors line-clamp-2 text-xl sm:text-2xl mb-1">
            {event.title}
            </h4>
            
            {event.organizerName && (
            <div className="text-sm font-medium text-on-surface-variant opacity-90">
                by <span className="text-on-surface font-semibold">{event.organizerName}</span>
            </div>
            )}
        </div>
        
        <div className="text-sm font-medium text-on-surface-variant flex items-start gap-2 mt-auto pt-4 border-t border-on-surface/10">
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none" className="mt-0.5 flex-shrink-0 opacity-70"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          <span className="line-clamp-1">{event.location}</span>
        </div>
      </div>
    </Link>
  );
}
