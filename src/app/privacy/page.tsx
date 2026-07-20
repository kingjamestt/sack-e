import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | Sack-E Online',
  description: 'Privacy Policy for Sack-E Online Ticketing.',
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen pt-24 md:pt-28 pb-24 px-4 md:px-6 max-w-4xl mx-auto">
      <article className="prose prose-invert lg:prose-xl max-w-none">
        <h1>Privacy Policy</h1>
        <p className="lead">Last updated: July 20, 2026</p>
        
        <h2>1. Information We Collect</h2>
        <p>
          At Sack-E Online, we collect information you provide directly to us, such as your name, email address, and payment information when you purchase tickets.
        </p>

        <h2>2. How We Use Your Information</h2>
        <p>
          We use the information we collect to provide, maintain, and improve our ticketing services, process transactions, and communicate with you about events and updates.
        </p>

        <h2>3. Information Sharing</h2>
        <p>
          We share your information with event organizers for the specific events you purchase tickets for. We do not sell your personal data to third parties.
        </p>

        <h2>4. Data Security</h2>
        <p>
          Sack-E takes reasonable measures to help protect information about you from loss, theft, misuse, unauthorized access, disclosure, alteration, and destruction.
        </p>

        <h2>5. Your Rights</h2>
        <p>
          You may request access to, correction, or deletion of your personal data by contacting our support team.
        </p>
      </article>
    </main>
  );
}
