import React from 'react';

export default function PricingPage() {
  return (
    <div className="min-h-screen pt-24 md:pt-32 bg-white text-slate-800">
      <div className="max-w-6xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-extrabold text-blue-600 mb-4">Simple, Transparent Pricing</h1>
          <p className="text-xl text-slate-600">Choose the plan that fits your event needs.</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {/* Basic */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 hover:shadow-lg transition-shadow">
            <h3 className="text-2xl font-bold text-slate-800 mb-4">Basic</h3>
            <div className="text-4xl font-extrabold text-blue-600 mb-6">Free<span className="text-lg text-slate-500 font-normal">/event</span></div>
            <ul className="space-y-4 mb-8 text-slate-600">
              <li>Up to 100 tickets</li>
              <li>Basic analytics</li>
              <li>Standard support</li>
            </ul>
            <button className="w-full bg-blue-50 text-blue-600 font-semibold py-3 rounded-xl hover:bg-blue-100 transition-colors">
              Get Started
            </button>
          </div>

          {/* Pro */}
          <div className="bg-blue-600 rounded-2xl border border-blue-600 shadow-xl p-8 transform md:-translate-y-4 text-white">
            <div className="inline-block bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full mb-4">MOST POPULAR</div>
            <h3 className="text-2xl font-bold mb-4">Pro</h3>
            <div className="text-4xl font-extrabold mb-6">$49<span className="text-lg text-blue-200 font-normal">/event</span></div>
            <ul className="space-y-4 mb-8 text-blue-100">
              <li>Unlimited tickets</li>
              <li>Advanced analytics</li>
              <li>Priority support</li>
              <li>Custom branding</li>
            </ul>
            <button className="w-full bg-white text-blue-600 font-bold py-3 rounded-xl hover:bg-slate-50 transition-colors">
              Upgrade to Pro
            </button>
          </div>

          {/* Enterprise */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 hover:shadow-lg transition-shadow">
            <h3 className="text-2xl font-bold text-slate-800 mb-4">Enterprise</h3>
            <div className="text-4xl font-extrabold text-blue-600 mb-6">Custom</div>
            <ul className="space-y-4 mb-8 text-slate-600">
              <li>Dedicated account manager</li>
              <li>API access</li>
              <li>24/7 phone support</li>
              <li>Volume discounts</li>
            </ul>
            <button className="w-full bg-blue-50 text-blue-600 font-semibold py-3 rounded-xl hover:bg-blue-100 transition-colors">
              Contact Sales
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
