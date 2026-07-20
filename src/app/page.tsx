import EventsSection from "@/components/EventsSection";
import HeroCarousel from "@/components/HeroCarousel";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Home | Sack-E Online',
  description: 'Find the best upcoming events, concerts, and festivals. Book your tickets easily and securely.',
};

export default function Home() {
  return (
    <main className="min-h-screen pb-20 overflow-x-hidden">
      <header>
        <h1 className="sr-only">Sack-E Online - Safe, Accessible & Convenient Event Ticketing</h1>
      </header>
      
      <section aria-label="Featured Events Carousel">
        <HeroCarousel />
      </section>

      <section aria-label="Upcoming Events">
        <EventsSection />
      </section>
    </main>
  );
}
