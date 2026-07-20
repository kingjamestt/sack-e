'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, XCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

function CallbackContent() {
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();
  
  const status = searchParams.get('status') || searchParams.get('transaction_id') ? 'success' : 'failed';
  const orderId = searchParams.get('order_id');
  
  const [transactionId, setTransactionId] = useState<string>('');
  const [isFinalizing, setIsFinalizing] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTransactionId(searchParams.get('transaction_id') || 'MOCK-' + Math.floor(Math.random() * 1000000));
  }, [searchParams]);

  const isSuccess = status === 'success' || searchParams.get('status') === 'approved';

  useEffect(() => {
    // Only run if successful, we have an orderId, auth is finished loading, and we have a user
    if (isSuccess && orderId && !loading && user && !isFinalizing) {
      setIsFinalizing(true);
      const parts = orderId.split('_');
      if (parts.length >= 2) {
        const eventId = parts[0];
        const resId = parts[1];
        // Import dynamically so we don't blow up client bundle with firestore if we don't need to
        import('@/lib/events').then(({ finalizeReservation }) => {
          finalizeReservation(eventId, resId).catch(console.error);
        });
      }
    }
  }, [isSuccess, orderId, loading, user, isFinalizing]);

  return (
    <div className="bg-surface-container border border-black/10 rounded-3xl p-10 max-w-md w-full text-center shadow-2xl relative overflow-hidden">
      {/* Decorative Glow */}
      <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 blur-3xl opacity-20 ${isSuccess ? 'bg-primary' : 'bg-error'}`} />

      {isSuccess ? (
        <>
          <CheckCircle2 size={64} className="text-primary mx-auto mb-6" />
          <h1 className="text-3xl font-bold mb-4 font-display">Payment Successful!</h1>
          <p className="text-on-surface-variant mb-8">
            Your ticket has been secured. An email confirmation has been sent with your receipt and QR code.
          </p>
          <div className="bg-surface-container-high rounded-xl p-4 mb-8 text-left border border-white/5">
            <div className="flex justify-between items-center gap-4 mb-2">
              <span className="text-on-surface-variant text-sm shrink-0">Order ID</span>
              <span className="font-mono text-sm truncate max-w-[200px] text-right" title={orderId || 'UNKNOWN'}>
                {orderId ? (orderId.includes('_') ? orderId.split('_')[1] : orderId) : 'UNKNOWN'}
              </span>
            </div>
            <div className="flex justify-between items-center gap-4">
              <span className="text-on-surface-variant text-sm shrink-0">Transaction</span>
              <span className="font-mono text-sm truncate max-w-[200px] text-right" title={transactionId}>
                {transactionId}
              </span>
            </div>
          </div>
          <Link href="/my-tickets" className="inline-block w-full py-4 bg-primary text-on-primary rounded-xl font-bold hover:bg-primary-container transition-colors shadow-lg shadow-primary/20">
            View My Tickets
          </Link>
        </>
      ) : (
        <>
          <XCircle size={64} className="text-error mx-auto mb-6" />
          <h1 className="text-3xl font-bold mb-4 font-display">Payment Failed</h1>
          <p className="text-on-surface-variant mb-8">
            There was an issue processing your payment with WiPay. Please try again.
          </p>
          <button 
            onClick={() => {
              if (orderId && orderId.includes('_')) {
                window.location.href = `/events/${orderId.split('_')[0]}`;
              } else {
                window.history.back();
              }
            }}
            className="inline-block w-full py-4 bg-surface-container-high border border-black/10 hover:border-error text-white rounded-xl font-bold transition-colors mb-4"
          >
            Try Again
          </button>
          <Link href="/" className="text-sm font-semibold text-on-surface-variant hover:text-on-surface transition-colors">
            Return to Home
          </Link>
        </>
      )}
    </div>
  );
}

export default function CheckoutCallbackPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <Suspense fallback={
        <div className="animate-pulse flex gap-2 items-center text-on-surface-variant">
          <div className="w-3 h-3 bg-primary rounded-full"></div>
          <div className="w-3 h-3 bg-secondary rounded-full delay-75"></div>
          <div className="w-3 h-3 bg-primary rounded-full delay-150"></div>
        </div>
      }>
        <CallbackContent />
      </Suspense>
    </main>
  );
}
