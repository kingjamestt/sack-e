"use client";

import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { doc, updateDoc, collection, query, getDocs, where, waitForPendingWrites } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Wifi, WifiOff, RefreshCw, CheckCircle, AlertTriangle, Play, Square } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

export default function ScannerPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [lastScan, setLastScan] = useState<string | null>(null);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [eventId, setEventId] = useState<string>("test-event-123");

  // Initialize Network Listeners
  useEffect(() => {
    setIsOnline(navigator.onLine);
    
    const handleOnline = () => {
      setIsOnline(true);
      toast.success("Back online. Syncing pending scans...");
      
      // Wait for Firestore to push all pending writes
      waitForPendingWrites(db).then(() => {
        toast.success("All offline scans pushed successfully!");
      }).catch(err => {
        console.error("Error waiting for pending writes:", err);
      });
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      toast.error("You are offline. Scans will be saved locally.");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const syncBeforeEvent = async () => {
    setSyncing(true);
    try {
      const q = query(collection(db, "attendees"), where("eventId", "==", eventId));
      // getDocs will force a network fetch and store it in Firestore's offline persistence
      const snapshot = await getDocs(q);
      toast.success(`Event Synced! ${snapshot.size} attendees pre-loaded for offline use.`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to pre-load attendees.");
    } finally {
      setSyncing(false);
    }
  };

  const startScanner = async () => {
    if (!videoRef.current) return;
    try {
      readerRef.current = new BrowserMultiFormatReader();
      
      const videoInputDevices = await BrowserMultiFormatReader.listVideoInputDevices();
      const selectedDeviceId = videoInputDevices.length > 0 ? videoInputDevices[videoInputDevices.length - 1].deviceId : undefined; // usually the back camera

      await readerRef.current.decodeFromVideoDevice(selectedDeviceId, videoRef.current, async (result: any, error: any) => {
        if (result) {
          handleScan(result.getText());
        }
      });
      setIsScanning(true);
    } catch (err) {
      console.error("Error starting scanner:", err);
      toast.error("Could not access camera.");
    }
  };

  const stopScanner = () => {
    if (readerRef.current) {
      // stop video streams
      const stream = videoRef.current?.srcObject as MediaStream;
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    }
    setIsScanning(false);
  };

  // Prevent multiple rapid scans of the same code
  const lastScannedTimeRef = useRef<{ id: string, time: number }>({ id: "", time: 0 });

  const handleScan = (attendeeId: string) => {
    const now = Date.now();
    if (lastScannedTimeRef.current.id === attendeeId && (now - lastScannedTimeRef.current.time) < 3000) {
      // debounce same code within 3 seconds
      return;
    }
    
    lastScannedTimeRef.current = { id: attendeeId, time: now };
    setLastScan(attendeeId);
    toast(`Scanned: ${attendeeId}`, { icon: '📷' });
    
    const scanData = {
      checkedIn: true,
      scannedAt: new Date().toISOString()
    };

    // Fire and forget: updateDoc is queued by Firestore automatically when offline
    updateDoc(doc(db, "attendees", attendeeId), scanData).catch(err => {
      console.error("Error queuing updateDoc:", err);
      // It will only throw here if the document isn't in cache and we're offline, 
      // or if permissions fail, etc.
    });

    if (navigator.onLine) {
      toast.success("Check-in synced!");
    } else {
      toast("Saved to offline cache", { icon: <CheckCircle className="w-4 h-4 text-green-500" /> });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Toaster position="bottom-center" />
      
      {/* Header */}
      <header className="bg-indigo-600 text-white p-4 shadow-md flex justify-between items-center">
        <h1 className="text-xl font-bold tracking-wide">Fete Scanner</h1>
        <div className="flex items-center space-x-2">
          {isOnline ? (
            <span className="flex items-center text-sm font-medium bg-indigo-500 px-2 py-1 rounded-full">
              <Wifi className="w-4 h-4 mr-1" />
              Online
            </span>
          ) : (
            <span className="flex items-center text-sm font-medium bg-red-500 px-2 py-1 rounded-full animate-pulse">
              <WifiOff className="w-4 h-4 mr-1" />
              Offline
            </span>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col p-4 max-w-lg mx-auto w-full">
        
        {/* Controls */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6 border border-gray-100 flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-500 font-medium">Offline Persistence: <span className="text-indigo-600 font-bold">Enabled</span></p>
          </div>
          <button 
            onClick={syncBeforeEvent}
            disabled={!isOnline || syncing}
            className="flex items-center px-4 py-2 bg-indigo-50 text-indigo-700 font-semibold rounded-lg hover:bg-indigo-100 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
            Sync Before Event
          </button>
        </div>

        {/* Scanner Viewfinder */}
        <div className="flex-1 bg-black rounded-2xl overflow-hidden relative shadow-lg min-h-[300px] flex flex-col items-center justify-center">
          <video 
            ref={videoRef} 
            className="w-full h-full object-cover absolute inset-0"
            style={{ display: isScanning ? "block" : "none" }}
          ></video>
          
          {!isScanning && (
            <div className="z-10 text-white text-center p-6">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                <Play className="w-8 h-8 text-white ml-1" />
              </div>
              <p className="font-medium text-lg">Camera off</p>
              <p className="text-sm text-gray-300 mt-1">Tap start to begin scanning tickets</p>
            </div>
          )}
          
          {/* Overlay Grid */}
          {isScanning && (
            <div className="absolute inset-0 pointer-events-none border-[40px] border-black/40 flex items-center justify-center">
              <div className="w-full h-full border-2 border-indigo-400/50 rounded-lg relative">
                 {/* Scanner line animation can go here */}
                 <div className="w-full h-0.5 bg-indigo-400 absolute top-1/2 left-0 shadow-[0_0_8px_2px_rgba(99,102,241,0.5)]"></div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-6">
          {isScanning ? (
            <button 
              onClick={stopScanner}
              className="w-full flex items-center justify-center py-4 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 shadow-md transition-transform active:scale-[0.98]"
            >
              <Square className="w-5 h-5 mr-2" />
              Stop Scanner
            </button>
          ) : (
            <button 
              onClick={startScanner}
              className="w-full flex items-center justify-center py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-transform active:scale-[0.98]"
            >
              <Play className="w-5 h-5 mr-2" />
              Start Scanner
            </button>
          )}
        </div>

        {/* Recent Scan */}
        {lastScan && (
          <div className="mt-6 bg-white border border-green-200 rounded-xl p-4 flex items-start shadow-sm animate-in fade-in slide-in-from-bottom-2">
            <div className="bg-green-100 p-2 rounded-full mr-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Last Scanned</p>
              <p className="text-gray-900 font-mono font-bold">{lastScan}</p>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
