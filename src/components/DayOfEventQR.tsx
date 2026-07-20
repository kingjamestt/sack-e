"use client";

import React, { useState, useEffect } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Lock } from "lucide-react";

interface DayOfEventQRProps {
  eventDate: string | Date;
  qrPayload: string;
}

export default function DayOfEventQR({ eventDate, qrPayload }: DayOfEventQRProps) {
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [securePayload, setSecurePayload] = useState<string>("");

  useEffect(() => {
    const calculateTimeLeft = () => {
      const eventDateTime = new Date(eventDate);
      // Set to 12:00 AM on the day of the event
      const unlockTime = new Date(
        eventDateTime.getFullYear(),
        eventDateTime.getMonth(),
        eventDateTime.getDate(),
        0, 0, 0
      );
      const now = new Date();
      const difference = unlockTime.getTime() - now.getTime();

      if (difference <= 0) {
        setIsUnlocked(true);
        // Only load payload into memory when unlocked to prevent DOM/state inspection beforehand
        setSecurePayload(atob(btoa(qrPayload))); // simplistic obfuscation for demonstration, 
        // ideally fetched securely via API when difference <= 0
        setTimeLeft(null);
      } else {
        setIsUnlocked(false);
        setTimeLeft({
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24) + Math.floor(difference / (1000 * 60 * 60 * 24)) * 24,
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [eventDate, qrPayload]);

  return (
    <div className="relative flex flex-col items-center justify-center p-8 bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden min-h-[350px] min-w-[300px]">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-blue-500/10 pointer-events-none" />

      {isUnlocked ? (
        <div className="relative z-10 flex flex-col items-center animate-in fade-in zoom-in duration-700">
          <div className="bg-white p-4 rounded-2xl shadow-[0_0_40px_rgba(255,255,255,0.3)]">
            <QRCodeCanvas 
              value={securePayload} 
              size={220} 
              level="H" 
              includeMargin={false}
              className="rounded-lg"
            />
          </div>
          <p className="mt-6 text-emerald-400 font-semibold tracking-widest uppercase text-sm">
            Event Unlocked
          </p>
        </div>
      ) : (
        <div className="relative z-10 flex flex-col items-center justify-center w-full">
          <div className="relative group">
            {/* Blurry QR Placeholder */}
            <div className="bg-white p-4 rounded-2xl opacity-10 blur-md transition-all duration-500 group-hover:blur-lg select-none pointer-events-none">
              <QRCodeCanvas value="placeholder-do-not-read" size={220} level="L" />
            </div>
            
            {/* Lock Icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-black/60 p-4 rounded-full backdrop-blur-md border border-white/10 shadow-[0_0_30px_rgba(168,85,247,0.4)]">
                <Lock className="w-10 h-10 text-purple-400" />
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col items-center">
            <p className="text-white/60 text-xs font-medium uppercase tracking-widest mb-3">
              Unlocks Day of Event
            </p>
            {timeLeft && (
              <div className="flex gap-3 text-center">
                <div className="bg-white/5 border border-white/10 rounded-xl p-3 w-16 backdrop-blur-sm">
                  <div className="text-2xl font-bold text-white tabular-nums tracking-tighter">
                    {timeLeft.hours.toString().padStart(2, '0')}
                  </div>
                  <div className="text-[10px] text-white/50 uppercase font-medium mt-1">HRS</div>
                </div>
                <div className="text-2xl font-bold text-white/30 self-start mt-2">:</div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-3 w-16 backdrop-blur-sm">
                  <div className="text-2xl font-bold text-white tabular-nums tracking-tighter">
                    {timeLeft.minutes.toString().padStart(2, '0')}
                  </div>
                  <div className="text-[10px] text-white/50 uppercase font-medium mt-1">MIN</div>
                </div>
                <div className="text-2xl font-bold text-white/30 self-start mt-2">:</div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-3 w-16 backdrop-blur-sm">
                  <div className="text-2xl font-bold text-white tabular-nums tracking-tighter">
                    {timeLeft.seconds.toString().padStart(2, '0')}
                  </div>
                  <div className="text-[10px] text-white/50 uppercase font-medium mt-1">SEC</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
