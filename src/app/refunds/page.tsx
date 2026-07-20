import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Refund Policy | Sack-E Online',
  description: 'Refund Policy for ticket purchases on Sack-E Online.',
};

export default function RefundPolicyPage() {
  return (
    <main className="min-h-screen pt-24 md:pt-32 pb-24 px-4 md:px-6 max-w-4xl mx-auto">
      <article className="prose prose-invert lg:prose-xl max-w-none">
        <h1>Refund Policy</h1>
        <p className="lead">Last updated: July 20, 2026</p>
        
        <h2>1. General Refund Rule</h2>
        <p>
          All ticket sales on Sack-E Online are considered final. We do not issue refunds for change of mind or personal scheduling conflicts.
        </p>

        <h2>2. Canceled Events</h2>
        <p>
          If an event is canceled by the organizer, you will receive a full refund of the ticket price. Sack-E service fees may be non-refundable depending on the specific event policies.
        </p>

        <h2>3. Postponed or Rescheduled Events</h2>
        <p>
          If an event is postponed or rescheduled, your ticket will remain valid for the new date. If you are unable to attend the new date, you may request a refund within the specified window provided by the event organizer.
        </p>

        <h2>4. How to Request a Refund</h2>
        <p>
          Eligible refund requests must be directed to the event organizer through the contact options on the event page. Sack-E acts as a ticketing agent and cannot authorize refunds without the organizer's approval.
        </p>

        <h2>5. Processing Time</h2>
        <p>
          Once a refund is approved, it will be processed back to the original method of payment. Please allow 5-10 business days for the funds to appear in your account.
        </p>
      </article>
    </main>
  );
}
