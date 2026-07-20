import React from 'react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white text-slate-800">
      <div className="max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-extrabold text-blue-600 mb-8">Terms of Service</h1>
        <div className="prose prose-blue max-w-none text-slate-600">
          <p className="mb-4">Last updated: July 2026</p>
          
          <h2 className="text-2xl font-bold text-slate-800 mt-8 mb-4">1. Acceptance of Terms</h2>
          <p className="mb-6">
            By accessing and using the Sack-E Ticketing platform, you accept and agree to be bound by the terms and provision of this agreement.
          </p>

          <h2 className="text-2xl font-bold text-slate-800 mt-8 mb-4">2. User Account</h2>
          <p className="mb-6">
            You are responsible for maintaining the confidentiality of your account and password and for restricting access to your computer.
          </p>

          <h2 className="text-2xl font-bold text-slate-800 mt-8 mb-4">3. Ticket Purchases</h2>
          <p className="mb-6">
            All ticket prices are listed in USD unless otherwise noted. We reserve the right to modify prices at any time before purchase completion.
          </p>
        </div>
      </div>
    </div>
  );
}
