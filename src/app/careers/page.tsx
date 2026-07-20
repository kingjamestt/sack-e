import React from 'react';

export default function CareersPage() {
  return (
    <div className="min-h-screen bg-white text-slate-800">
      <div className="max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-extrabold text-blue-600 mb-8">Careers</h1>
        <p className="text-lg text-slate-600 mb-8">
          Join our mission to revolutionize ticketing! We are always looking for passionate individuals to join our growing team.
        </p>
        
        <div className="bg-blue-50 rounded-xl p-6 mb-6 border border-blue-100">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Frontend Engineer</h2>
          <p className="text-slate-600 mb-4">Remote - Full Time</p>
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
            Apply Now
          </button>
        </div>

        <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Product Manager</h2>
          <p className="text-slate-600 mb-4">New York, NY - Full Time</p>
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
            Apply Now
          </button>
        </div>
      </div>
    </div>
  );
}
