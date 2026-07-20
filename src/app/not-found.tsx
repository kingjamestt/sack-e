import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-[80vh] flex flex-col items-center justify-center px-6 py-24 bg-background text-center">
      <div className="max-w-md w-full space-y-8 relative">
        {/* Glow effect */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/20 blur-[100px] rounded-full pointer-events-none" />
        
        <h1 className="font-display text-[120px] leading-none font-bold text-primary tracking-tighter drop-shadow-sm relative z-10">
          404
        </h1>
        
        <div className="space-y-4 relative z-10">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-on-background">
            Looks like you're lost.
          </h2>
          <p className="text-on-surface-variant font-body">
            The event, page, or ticket you are looking for does not exist or has been moved. 
          </p>
        </div>

        <div className="pt-8 relative z-10">
          <Link 
            href="/" 
            className="inline-flex items-center justify-center bg-primary text-on-primary font-bold text-lg px-8 py-4 rounded-full hover:bg-primary-container hover:scale-105 transition-all shadow-[0_4px_20px_rgba(0,104,93,0.3)]"
          >
            Return to Homepage
          </Link>
        </div>
      </div>
    </main>
  );
}
