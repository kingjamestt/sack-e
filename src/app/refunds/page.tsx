import React from 'react';

export default function RefundsPage() {
  return (
    <div className="min-h-screen bg-white text-slate-800">
      <div className="max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-extrabold text-blue-600 mb-8">Refund Policy</h1>
        <div className="prose prose-blue max-w-none text-slate-600">
          <p className="text-lg mb-6">
            At Sack-E Ticketing, we strive to ensure a fair and transparent refund process.
          </p>
          <h2 className="text-2xl font-bold text-slate-800 mt-8 mb-4">Event Cancellations</h2>
          <p className="mb-6">
            If an event is canceled entirely and not rescheduled, you will automatically receive a full refund to your original method of payment.
          </p>
          <h2 className="text-2xl font-bold text-slate-800 mt-8 mb-4">Rescheduled Events</h2>
          <p className="mb-6">
            If an event is postponed or rescheduled, your ticket remains valid for the new date. If you cannot attend the new date, you may request a refund within 30 days of the announcement.
          </p>
          <h2 className="text-2xl font-bold text-slate-800 mt-8 mb-4">All Other Sales</h2>
          <p>
            Unless the event is canceled or explicitly stated otherwise by the event organizer, all sales are final. No refunds or exchanges will be issued.
          </p>
        </div>
      </div>
    </div>
  );
}
