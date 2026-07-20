import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service | Sack-E Online',
  description: 'Terms of Service for Sack-E Online Ticketing.',
};

export default function TermsPage() {
  return (
    <main className="min-h-screen pt-24 md:pt-28 pb-24 px-4 md:px-6 max-w-4xl mx-auto">
      <article className="prose prose-invert lg:prose-xl max-w-none">
        <h1>Terms of Service</h1>
        <p className="lead">Last updated: July 20, 2026</p>
        
        <h2>1. Acceptance of Terms</h2>
        <p>
          By accessing or using the Sack-E Online ticketing platform ("Sack-E"), you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you may not access the service.
        </p>

        <h2>2. Use of Service</h2>
        <p>
          Sack-E provides a platform for event organizers to sell tickets and for attendees to discover and purchase tickets. You must provide accurate information when creating an account and purchasing tickets.
        </p>

        <h2>3. Ticket Purchases and Fees</h2>
        <p>
          All ticket prices are set by the event organizers. Sack-E may charge a booking fee or service fee per transaction. These fees are non-refundable unless the event is canceled.
        </p>

        <h2>4. User Conduct</h2>
        <p>
          You agree not to use Sack-E for any unlawful purpose, to resell tickets above face value without authorization, or to engage in fraudulent activities.
        </p>

        <h2>5. Limitation of Liability</h2>
        <p>
          Sack-E is not responsible for the events themselves. Any disputes regarding the event quality, safety, or occurrences must be directed to the event organizer.
        </p>
      </article>
    </main>
  );
}
