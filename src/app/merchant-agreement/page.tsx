import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Merchant Agreement | Sack-E Online',
  description: 'Merchant Agreement for event organizers on Sack-E Online.',
};

export default function MerchantAgreementPage() {
  return (
    <main className="min-h-screen pt-24 md:pt-28 pb-24 px-4 md:px-6 max-w-4xl mx-auto">
      <article className="prose prose-invert lg:prose-xl max-w-none">
        <h1>Merchant Service Agreement</h1>
        <p className="lead">Last updated: July 20, 2026</p>
        
        <h2>1. Overview</h2>
        <p>
          This Merchant Agreement outlines the terms under which event organizers ("Merchants") may use Sack-E Online to sell tickets and manage events.
        </p>

        <h2>2. Event Creation and Ticket Sales</h2>
        <p>
          Merchants are solely responsible for setting ticket prices, capacities, and event details. Sack-E will process payments on behalf of the Merchant and remit the funds according to the payout schedule.
        </p>

        <h2>3. Fees and Payouts</h2>
        <p>
          Sack-E charges a service fee for each ticket sold. Payouts are typically processed within 3-5 business days after the successful conclusion of the event, subject to reserve holding if necessary.
        </p>

        <h2>4. Cancellations and Refunds</h2>
        <p>
          If a Merchant cancels an event, they must notify Sack-E immediately. The Merchant is responsible for authorizing and providing funds for full refunds to all attendees.
        </p>

        <h2>5. Prohibited Content</h2>
        <p>
          Merchants may not use Sack-E to promote illegal activities, hate speech, or explicit adult content. Sack-E reserves the right to suspend or terminate any Merchant account violating these guidelines.
        </p>
      </article>
    </main>
  );
}
