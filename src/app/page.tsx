import EventsSection from "@/components/EventsSection";
import HeroCarousel from "@/components/HeroCarousel";
import BackToTop from "@/components/BackToTop";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Home | Sack-E Online',
  description: 'Find the best upcoming events, concerts, and festivals. Book your tickets easily and securely.',
};

export default function Home() {
  return (
    <main className="min-h-screen pt-24 md:pt-32 pb-20 overflow-x-hidden relative">
      {/* Subtle Mesh / Grid Background */}
      <div className="fixed inset-0 -z-10 bg-surface-container opacity-40">
        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" className="text-primary/10" />
            </pattern>
            <radialGradient id="mesh-gradient" cx="50%" cy="0%" r="50%">
              <stop offset="0%" stopColor="var(--primary-color, #0B4DE5)" stopOpacity="0.08" />
              <stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid-pattern)" />
          <rect width="100%" height="100%" fill="url(#mesh-gradient)" />
        </svg>
      </div>
      <header>
        <h1 className="sr-only">Sack-E Online - Safe, Accessible & Convenient Event Ticketing</h1>
      </header>
      
      <section aria-label="Featured Events Carousel">
        <HeroCarousel />
      </section>

      <section aria-label="Upcoming Events">
        <EventsSection />
      </section>
      
      <BackToTop />
    </main>
  );
}
