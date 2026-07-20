'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState, use, useRef } from 'react';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { CheckCircle2, XCircle, ShieldAlert, ScanLine } from 'lucide-react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { NotFoundException } from '@zxing/library';
import { verifyAndUseTicket } from '@/lib/tickets';

export default function ScannerPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = use(params);
  const { user, loading } = useAuth();
  const router = useRouter();
  
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [authError, setAuthError] = useState('');
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  
  const [scanResult, setScanResult] = useState<any>(null);
  const [scanError, setScanError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const controlsRef = useRef<any>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push(`/login?redirect=/verify/${eventId}/scanner`);
    }
  }, [user, loading, router, eventId]);

  // Auth verification
  useEffect(() => {
    async function verifyAccess() {
      if (!user) return;
      setIsLoadingAuth(true);
      try {
        const eventRef = doc(db, 'events', eventId);
        const eventSnap = await getDoc(eventRef);
        
        if (!eventSnap.exists()) {
          throw new Error('Event not found.');
        }
        const eData = eventSnap.data();

        let hasAccess = false;
        if (eData.owner_id === user.uid) {
          hasAccess = true;
        } else {
          // Check team subcollection
          if (user.email) {
            const teamRef = collection(db, 'events', eventId, 'team');
            const q = query(teamRef, where('email', '==', user.email.toLowerCase()));
            const teamSnap = await getDocs(q);
            if (!teamSnap.empty) {
              const memberData = teamSnap.docs[0].data();
              if (['owner', 'admin', 'scanner'].includes(memberData.role)) {
                hasAccess = true;
              }
            }
          }
        }

        if (!hasAccess) {
          throw new Error('UNAUTHORIZED: You do not have permission to scan tickets for this event.');
        }
        setIsAuthorized(true);
      } catch (err: any) {
        setAuthError(err.message || 'Failed to verify authorization.');
      } finally {
        setIsLoadingAuth(false);
      }
    }
    verifyAccess();
  }, [user, eventId]);

  // Scanner initialization
  useEffect(() => {
    if (!isAuthorized || isProcessing || scanResult || !videoRef.current) return;

    let isMounted = true;
    const codeReader = new BrowserMultiFormatReader();
    readerRef.current = codeReader;

    codeReader.decodeFromVideoDevice(undefined, videoRef.current, async (result, err) => {
      if (result && isMounted) {
        handleScannedCode(result.getText());
      }
      if (err && !(err instanceof NotFoundException)) {
        console.warn('QR scan error:', err);
      }
    }).then(controls => {
        if (isMounted) controlsRef.current = controls;
    }).catch(console.error);

    return () => {
      isMounted = false;
      if (controlsRef.current) {
        controlsRef.current.stop();
      }
    };
  }, [isAuthorized, isProcessing, scanResult]);

  const handleScannedCode = async (text: string) => {
    setIsProcessing(true);
    setScanError('');
    if (controlsRef.current) {
      controlsRef.current.stop();
    }
    
    try {
      // Expected URL format: origin/verify/{eventId}/{ticketId}?owner={ownerId}
      const match = text.match(/\/verify\/([^\/]+)\/([^\/?]+)(?:\?owner=(.+))?$/);
      let scannedEventId = '';
      let ticketId = '';
      let scannedOwnerId = '';
      
      if (match) {
        scannedEventId = match[1];
        ticketId = match[2];
        scannedOwnerId = match[3] || '';
      } else {
        throw new Error('Invalid QR code format. Please scan a valid ticket.');
      }

      if (scannedEventId !== eventId) {
        throw new Error('This ticket is for a different event!');
      }

      const result = await verifyAndUseTicket(ticketId, eventId, user!.uid, scannedOwnerId);
      setScanResult(result);
    } catch (err: any) {
      setScanError(err.message || 'Failed to process QR code.');
    } finally {
      setIsProcessing(false);
    }
  };

  const resetScanner = () => {
    setScanResult(null);
    setScanError('');
    setIsProcessing(false);
  };

  if (loading || isLoadingAuth) {
    return (
      <main className="min-h-screen pt-24 md:pt-32 pb-20 px-6 flex justify-center items-center">
        <div className="animate-pulse flex gap-2 items-center text-on-surface-variant">
          <ScanLine size={24} className="animate-bounce text-primary" />
          <span className="ml-2 text-sm font-semibold tracking-widest uppercase">Checking Authorization...</span>
        </div>
      </main>
    );
  }

  if (!user) return null;

  if (authError) {
    return (
      <main className="min-h-screen pt-24 md:pt-32 pb-20 px-4 flex justify-center items-center">
        <div className="bg-error/10 border border-error/20 rounded-3xl p-8 max-w-md w-full text-center">
          <ShieldAlert size={48} className="text-error mx-auto mb-4" />
          <h1 className="text-xl font-bold text-error mb-2">Access Denied</h1>
          <p className="text-error/80 text-sm mb-6">{authError}</p>
          <button onClick={() => router.push('/')} className="px-6 py-3 bg-error text-white font-bold rounded-xl w-full">
            Return Home
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen pt-24 md:pt-32 pb-20 px-4 flex flex-col items-center">
      <div className="w-full max-w-md">
        <h1 className="font-display text-3xl font-bold mb-6 text-center">Scan Tickets</h1>
        
        {scanResult ? (
          <div className="bg-surface-container border border-black/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden text-center">
            {scanResult.valid ? (
               <>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-success/20 rounded-full blur-[100px] pointer-events-none" />
                <div className="w-24 h-24 bg-success/20 text-success rounded-full flex items-center justify-center mx-auto mb-6 border border-success/30 shadow-[0_0_30px_rgba(0,255,0,0.3)]">
                  <CheckCircle2 size={48} />
                </div>
                <h2 className="font-display text-4xl font-bold mb-2 text-success">VALID!</h2>
                <p className="text-on-surface-variant font-bold mb-6 text-lg">
                  Ticket successfully scanned.
                </p>
                <div className="bg-black/20 p-4 rounded-xl mb-8 border border-white/5">
                  <p className="text-xs uppercase text-on-surface-variant font-bold mb-1">Tier</p>
                  <p className="font-bold text-xl">{scanResult.data.name || 'General Admission'}</p>
                </div>
               </>
            ) : (
               <>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-error/20 rounded-full blur-[100px] pointer-events-none" />
                <div className="w-24 h-24 bg-error/20 text-error rounded-full flex items-center justify-center mx-auto mb-6 border border-error/30 shadow-[0_0_30px_rgba(255,0,0,0.3)]">
                  <XCircle size={48} />
                </div>
                <h2 className="font-display text-3xl font-bold mb-2 text-error">STOP</h2>
                <p className="text-white font-bold mb-2 text-xl">
                  {scanResult.message}
                </p>
                <div className="bg-black/20 p-4 rounded-xl mb-8 border border-white/5 mt-4">
                  <p className="text-xs uppercase text-on-surface-variant font-bold mb-1">Tier</p>
                  <p className="font-bold text-xl">{scanResult.data?.name || 'General Admission'}</p>
                </div>
               </>
            )}
            
            <button 
              onClick={resetScanner}
              className="w-full py-4 bg-surface-container-high border border-black/10 text-white font-bold rounded-xl hover:bg-black/5 transition-colors"
            >
              Scan Next Ticket
            </button>
          </div>
        ) : scanError ? (
          <div className="bg-surface-container border border-black/10 rounded-3xl p-8 shadow-2xl text-center">
             <div className="w-24 h-24 bg-error/20 text-error rounded-full flex items-center justify-center mx-auto mb-6 border border-error/30 shadow-[0_0_30px_rgba(255,0,0,0.3)]">
                <XCircle size={48} />
             </div>
             <h2 className="font-display text-2xl font-bold mb-2 text-error">Error</h2>
             <p className="text-white font-bold mb-8">{scanError}</p>
             <button 
              onClick={resetScanner}
              className="w-full py-4 bg-surface-container-high border border-black/10 text-white font-bold rounded-xl hover:bg-black/5 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : (
          <div className="bg-surface-container border border-black/10 rounded-3xl p-4 shadow-2xl relative overflow-hidden">
             {isProcessing && (
                <div className="absolute inset-0 z-10 bg-black/80 flex items-center justify-center backdrop-blur-sm">
                   <div className="animate-pulse flex flex-col items-center text-primary">
                      <ScanLine size={48} className="animate-bounce mb-4" />
                      <span className="text-sm font-bold tracking-widest uppercase">Processing...</span>
                   </div>
                </div>
             )}
             <div className="aspect-[3/4] sm:aspect-square bg-black rounded-2xl overflow-hidden relative border border-white/5">
                <video ref={videoRef} className="w-full h-full object-cover" />
                
                {/* Scanner Overlay UI */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute inset-0 border-[40px] border-black/40" />
                  <div className="absolute inset-[40px] border-2 border-primary/50 shadow-[0_0_0_1000px_rgba(0,0,0,0.5)] rounded-2xl flex items-center justify-center">
                    <div className="w-full h-1 bg-primary/80 blur-[2px] animate-pulse" />
                  </div>
                  
                  {/* Corner accents */}
                  <div className="absolute top-[40px] left-[40px] w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-2xl" />
                  <div className="absolute top-[40px] right-[40px] w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-2xl" />
                  <div className="absolute bottom-[40px] left-[40px] w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-2xl" />
                  <div className="absolute bottom-[40px] right-[40px] w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-2xl" />
                </div>
             </div>
             <p className="text-center text-on-surface-variant text-sm mt-4">
                Point your camera at a ticket QR code.
             </p>
          </div>
        )}
      </div>
    </main>
  );
}
