import { Metadata } from 'next';
import React from 'react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'FAQ',
  description: 'Frequently Asked Questions about Sack-E Ticketing',
};

const faqs = [
  {
    question: 'How do I purchase a ticket?',
    answer: 'You can browse upcoming events on our home page, select the event you want to attend, choose your ticket tier, and complete the secure checkout process using major credit cards or digital wallets.'
  },
  {
    question: 'Are my tickets refundable?',
    answer: 'Refunds depend on the event organizer’s policy. Generally, tickets are non-refundable unless the event is canceled or rescheduled. Check the specific event page or our Refund Policy for more details.'
  },
  {
    question: 'How do I access my tickets?',
    answer: 'After purchase, tickets will be emailed to you and will also be available in your Dashboard under "My Tickets". You can show the QR code directly from your phone at the event.'
  },
  {
    question: 'Can I sell tickets for my own event?',
    answer: 'Yes! Sack-E provides a comprehensive platform for organizers. Go to the "Sell Tickets" page to create an organizer account and start setting up your event.'
  },
  {
    question: 'Is it safe to enter my payment information?',
    answer: 'Absolutely. We use industry-standard encryption and partner with secure payment gateways like Stripe to ensure your data is fully protected.'
  },
];

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-background text-on-background py-24">
      <div className="container mx-auto px-6 max-w-4xl">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-6 tracking-tight font-montserrat text-primary">
            Frequently Asked <span className="text-secondary">Questions</span>
          </h1>
          <p className="text-lg text-on-surface-variant max-w-2xl mx-auto">
            Find answers to the most common questions about buying tickets, managing your account, and organizing events.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {faqs.map((faq, index) => (
            <details
              key={index}
              className="group bg-surface-container-lowest border border-surface-variant/30 rounded-2xl overflow-hidden transition-all duration-300 open:bg-surface-container-low open:shadow-md hover:border-primary/50"
            >
              <summary className="flex justify-between items-center font-semibold text-lg cursor-pointer p-6 select-none font-montserrat text-on-surface">
                {faq.question}
                <span className="text-primary transform transition-transform duration-300 group-open:rotate-180">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
              </summary>
              <div className="px-6 pb-6 pt-0 text-on-surface-variant leading-relaxed">
                {faq.answer}
              </div>
            </details>
          ))}
        </div>
        
        <div className="mt-16 text-center bg-surface-container-lowest border border-surface-variant/30 rounded-3xl p-10">
          <h3 className="text-2xl font-bold font-montserrat mb-3 text-on-surface">Still have questions?</h3>
          <p className="text-on-surface-variant mb-6">Our support team is here to help you.</p>
          <Link href="/contact" className="inline-flex items-center justify-center rounded-full bg-primary text-on-primary px-8 py-3.5 font-bold hover:bg-primary/90 transition-all shadow-lg hover:shadow-primary/30">
            Contact Support
          </Link>
        </div>
      </div>
    </div>
  );
}
