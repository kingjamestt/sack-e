"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function CheckoutError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Checkout error:", error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 transform transition-all">
        <div className="p-10 text-center space-y-6">
          <div className="mx-auto w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
          </div>
          
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Connection Lost
          </h2>
          
          <p className="text-gray-500 text-sm leading-relaxed">
            We experienced an issue connecting to the payment gateway. Don't worry, your payment hasn't been processed.
          </p>
          
          <div className="pt-8 flex flex-col space-y-3">
            <button
              onClick={() => reset()}
              className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg shadow-indigo-200 hover:shadow-xl hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Try Again
            </button>
            <Link 
              href="/"
              className="w-full py-3.5 px-4 bg-white hover:bg-gray-50 text-gray-700 rounded-xl font-semibold transition-all duration-200 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200"
            >
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
