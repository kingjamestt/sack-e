import Link from 'next/link';
import { Info, AlertTriangle, ShieldCheck, WifiOff, RefreshCw } from 'lucide-react';

export default function OrganizerGuidePage() {
  return (
    <div className="min-h-screen pt-24 md:pt-32 bg-background text-on-background font-sans pb-24">
      {/* Header */}
      <header className="bg-surface border-b border-outline-variant/30 sticky top-0 z-50">
        <div className="container mx-auto max-w-4xl px-6 py-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-on-surface font-display">Organizer Guide</h1>
          <Link href="/sell" className="text-primary font-medium hover:underline">
            Back to Sales
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto max-w-4xl px-6 pt-12">
        <div className="mb-12 animate-slideUp">
          <h2 className="text-4xl md:text-5xl font-bold text-on-surface mb-6 font-display">
            Mastering the Offline Scanner
          </h2>
          <p className="text-xl text-on-surface-variant leading-relaxed">
            Sack-E is built for real-world events where internet connectivity is unpredictable. 
            Our offline scanning system guarantees that you can securely validate tickets even when the venue's WiFi drops. 
            However, it requires strict adherence to a specific workflow to prevent ticket fraud.
          </p>
        </div>

        <div className="space-y-12">
          {/* Section 1: Why Lock Off Sales? */}
          <section className="glass rounded-3xl p-8 md:p-10 animate-slideUp" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-error-container text-on-error-container flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-on-surface mb-2">Crucial: Locking Off Ticket Sales</h3>
                <p className="text-on-surface-variant">
                  When operating in offline mode, you <strong>must lock off ticket sales</strong> before scanning begins.
                </p>
              </div>
            </div>
            
            <div className="bg-surface-dim rounded-2xl p-6 border border-outline-variant/50">
              <h4 className="font-semibold text-lg mb-3">Why is this necessary?</h4>
              <p className="text-on-surface-variant mb-4">
                Offline devices rely on a snapshot of ticket data downloaded prior to the event. If a customer buys a ticket online <em>while</em> your scanners are offline, the new ticket won't exist on the scanners, resulting in denied entry. 
              </p>
              <p className="text-on-surface-variant">
                Worse, if multiple scanners are offline, they cannot talk to each other to mark a ticket as "scanned." If you allow online sales, a bad actor could buy a ticket, duplicate the QR code, and enter through multiple different lines. Locking sales ensures the snapshot is complete and immutable.
              </p>
            </div>
          </section>

          {/* Section 2: The Workflow */}
          <section className="animate-slideUp" style={{ animationDelay: '0.2s' }}>
            <h3 className="text-3xl font-bold text-on-surface mb-8 font-display">The Event Day Workflow</h3>
            
            <div className="space-y-6">
              {/* Step 1 */}
              <div className="flex gap-6">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold z-10">1</div>
                  <div className="w-0.5 h-full bg-primary/20 my-2"></div>
                </div>
                <div className="pb-8">
                  <h4 className="text-xl font-bold mb-2 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-primary" /> 
                    Lock Off Sales
                  </h4>
                  <p className="text-on-surface-variant">
                    At least 1-2 hours before gates open, log into your Sack-E dashboard and officially close online ticket sales for the event. This finalizes the guest list.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-6">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold z-10">2</div>
                  <div className="w-0.5 h-full bg-primary/20 my-2"></div>
                </div>
                <div className="pb-8">
                  <h4 className="text-xl font-bold mb-2 flex items-center gap-2">
                    <RefreshCw className="w-5 h-5 text-primary" /> 
                    Initial Device Sync
                  </h4>
                  <p className="text-on-surface-variant">
                    While connected to a strong WiFi or cellular network, open the Sack-E Scanner App on all devices. Tap <strong>"Sync Event Data"</strong>. Verify that the total ticket count matches across all devices.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-6">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold z-10">3</div>
                  <div className="w-0.5 h-full bg-primary/20 my-2"></div>
                </div>
                <div className="pb-8">
                  <h4 className="text-xl font-bold mb-2 flex items-center gap-2">
                    <WifiOff className="w-5 h-5 text-primary" /> 
                    Scan Offline
                  </h4>
                  <p className="text-on-surface-variant">
                    Head to the gates. Devices can now safely operate without internet. The app will securely cryptographically verify tickets and locally record entry timestamps.
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex gap-6">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold z-10">4</div>
                </div>
                <div>
                  <h4 className="text-xl font-bold mb-2 flex items-center gap-2">
                    <RefreshCw className="w-5 h-5 text-primary" /> 
                    Post-Event Sync
                  </h4>
                  <p className="text-on-surface-variant">
                    After the event, reconnect all scanner devices to the internet. Open the app and allow it to upload the local scan logs to Sack-E. This populates your post-event analytics dashboard.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Alert Box */}
          <div className="bg-primary-container text-on-primary-container rounded-2xl p-6 flex items-start gap-4 animate-slideUp" style={{ animationDelay: '0.3s' }}>
            <Info className="w-6 h-6 flex-shrink-0 mt-1" />
            <div>
              <h4 className="font-bold text-lg mb-1">Need to sell tickets at the door?</h4>
              <p className="opacity-90">
                Use our dedicated Box Office module on a single, internet-connected device. This ensures door sales are centralized and cannot conflict with offline pre-sale scanners.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
