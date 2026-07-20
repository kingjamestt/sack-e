'use client';

import { EventData } from '@/types';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, parseISO } from 'date-fns';
import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { getEventLink } from '@/lib/events';

export default function EventCalendar({ events }: { events: EventData[] }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Pad the start of the month to align days of week
  const startDay = monthStart.getDay();
  const paddingDays = Array.from({ length: startDay }).map((_, i) => i);

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  return (
    <div className="bg-surface-container rounded-3xl p-6 border border-black/10 shadow-lg animate-in fade-in zoom-in-95 overflow-x-auto">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-display font-bold text-2xl">
          {format(currentDate, 'MMMM yyyy')}
        </h3>
        <div className="flex gap-2">
          <button onClick={prevMonth} className="p-2 hover:bg-black/10 rounded-full transition-colors">
            <ChevronLeft size={24} />
          </button>
          <button onClick={nextMonth} className="p-2 hover:bg-black/10 rounded-full transition-colors">
            <ChevronRight size={24} />
          </button>
        </div>
      </div>
      
      <div className="w-full">
        <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 text-center text-on-surface-variant text-xs sm:text-sm font-semibold">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="py-1 sm:py-2">{day.slice(0, 3)}</div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {paddingDays.map(pad => (
            <div key={`pad-${pad}`} className="min-h-[60px] sm:min-h-[100px] rounded-lg sm:rounded-xl bg-surface-container-high/30 opacity-50" />
          ))}
          
          {daysInMonth.map(day => {
            const dayEvents = events.filter(e => isSameDay(parseISO(e.date), day));
            const isToday = isSameDay(day, new Date());
            const isSelected = selectedDay && isSameDay(day, selectedDay);
            
            return (
              <button 
                key={day.toISOString()} 
                onClick={() => setSelectedDay(day)}
                className={`min-h-[60px] sm:min-h-[100px] text-center sm:text-left rounded-lg sm:rounded-xl p-1 sm:p-2 border transition-colors relative flex flex-col items-center sm:items-stretch ${
                  isSelected ? 'border-primary ring-2 ring-primary/20 bg-primary/10' :
                  isToday ? 'border-white/5 bg-surface-container-highest hover:border-white/20' : 
                  'border-white/5 bg-surface-container-high hover:border-white/20'
                }`}
              >
                <div className={`text-xs sm:text-sm font-bold mb-1 ${isToday || isSelected ? 'text-primary' : 'text-on-surface-variant'}`}>
                  {format(day, 'd')}
                </div>
                
                <div className="flex-1 w-full space-y-1 overflow-hidden">
                  {/* Desktop event pills */}
                  {dayEvents.slice(0, 3).map(event => (
                    <div 
                      key={event.id}
                      className="hidden sm:block text-[10px] sm:text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded truncate"
                    >
                      {event.time ? `${event.time} ` : ''}{event.title}
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="hidden sm:block text-[10px] text-on-surface-variant px-1 font-semibold">
                      +{dayEvents.length - 3} more
                    </div>
                  )}

                  {/* Mobile indicator dots */}
                  {dayEvents.length > 0 && (
                    <div className="sm:hidden flex gap-1 flex-wrap justify-center mt-1">
                      {dayEvents.slice(0, 3).map(event => (
                        <div key={event.id} className="w-1.5 h-1.5 rounded-full bg-primary" />
                      ))}
                      {dayEvents.length > 3 && (
                         <div className="w-1.5 h-1.5 rounded-full bg-primary/50" />
                      )}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Events List */}
      {selectedDay && (
        <div className="mt-8 pt-6 border-t border-black/10 animate-in slide-in-from-bottom-4">
          <h4 className="font-display font-bold text-xl mb-4 text-on-surface">
            Events on {format(selectedDay, 'EEEE, MMMM d')}
          </h4>
          
          <div className="space-y-3">
            {events.filter(e => isSameDay(parseISO(e.date), selectedDay)).length === 0 ? (
              <p className="text-on-surface-variant">No events scheduled for this day.</p>
            ) : (
              events.filter(e => isSameDay(parseISO(e.date), selectedDay)).map(event => (
                <Link 
                  key={event.id}
                  href={getEventLink(event)}
                  className="flex items-center justify-between p-4 bg-surface-container-high rounded-xl hover:bg-surface-container-highest border border-white/5 hover:border-black/10 transition-all group"
                >
                  <div>
                    <h5 className="font-bold text-lg group-hover:text-primary transition-colors">{event.title}</h5>
                    <div className="flex gap-4 text-sm text-on-surface-variant mt-1">
                      {event.time && <span>{event.time}</span>}
                      <span>{event.location}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="block text-secondary font-bold">{event.price}</span>
                    <span className="text-xs text-primary group-hover:underline">View details &rarr;</span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
