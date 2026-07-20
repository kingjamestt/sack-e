import React from 'react';

export default function AboutPage() {
  return (
    <div className="min-h-screen pt-24 md:pt-32 bg-white text-slate-800">
      <div className="max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-extrabold text-blue-600 mb-8">About Us</h1>
        <p className="text-lg text-slate-600 mb-6">
          Welcome to Sack-E Ticketing! We are dedicated to providing the best ticketing experience in the industry. Our platform is built with love and passion to connect people with unforgettable experiences.
        </p>
        <p className="text-lg text-slate-600">
          Our team is composed of industry veterans and tech enthusiasts working together to revolutionize how events are discovered and attended.
        </p>
      </div>
    </div>
  );
}
