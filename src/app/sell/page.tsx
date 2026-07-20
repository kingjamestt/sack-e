import Link from 'next/link';
import { ArrowRight, CheckCircle, BarChart3, Smartphone, DollarSign } from 'lucide-react';

export default function SellPage() {
  return (
    <div className="min-h-screen bg-background text-on-background font-sans">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-32 pb-24 lg:pt-48 lg:pb-32 px-6">
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-primary/5 to-transparent"></div>
        <div className="container mx-auto max-w-5xl relative z-10 text-center animate-slideUp">
          <h1 className="text-5xl lg:text-7xl font-bold tracking-tight text-on-surface mb-6 font-display">
            The Premium Standard for <span className="text-primary">Event Ticketing</span>
          </h1>
          <p className="text-xl lg:text-2xl text-on-surface-variant max-w-3xl mx-auto mb-10 leading-relaxed">
            Move past outdated platforms like Island eTickets and Frontline Ticketing. Experience lower fees, a stunning user interface, and an offline scanner system built for the real world.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link 
              href="/my-events/create" 
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium rounded-full bg-primary text-on-primary hover:bg-primary-container hover:text-on-primary-container transition-all shadow-[0_8px_30px_rgb(11,77,229,0.3)] hover:shadow-[0_8px_30px_rgb(11,77,229,0.5)] transform hover:-translate-y-1"
            >
              Start Selling Today <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
            <Link 
              href="/organizer-guide" 
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium rounded-full bg-surface text-primary border border-primary/20 hover:bg-surface-dim transition-all"
            >
              Read the Guide
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6 bg-surface-container-low">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold text-on-surface mb-4 font-display">Why Choose Sack-E?</h2>
            <p className="text-lg text-on-surface-variant max-w-2xl mx-auto">
              We built Sack-E specifically to solve the headaches event organizers face with legacy platforms.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="glass rounded-3xl p-8 transform hover:-translate-y-2 transition-all duration-300">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                <DollarSign className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-2xl font-semibold mb-4 text-on-surface">Lower Fees</h3>
              <p className="text-on-surface-variant leading-relaxed">
                Keep more of your revenue. We offer fundamentally lower ticketing fees compared to Frontline Ticketing and Island eTickets, so you and your attendees win.
              </p>
            </div>
            
            <div className="glass rounded-3xl p-8 transform hover:-translate-y-2 transition-all duration-300">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                <BarChart3 className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-2xl font-semibold mb-4 text-on-surface">Premium UI/UX</h3>
              <p className="text-on-surface-variant leading-relaxed">
                Provide your attendees with a modern, seamless, and frictionless checkout experience. A beautiful interface means higher conversion rates and happier customers.
              </p>
            </div>

            <div className="glass rounded-3xl p-8 transform hover:-translate-y-2 transition-all duration-300">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                <Smartphone className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-2xl font-semibold mb-4 text-on-surface">Robust Offline Scanner</h3>
              <p className="text-on-surface-variant leading-relaxed">
                Venue WiFi down? No problem. Our state-of-the-art offline scanning system ensures the line keeps moving, validating tickets securely even without internet.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="container mx-auto max-w-5xl relative z-10">
          <div className="glass rounded-[3rem] p-8 md:p-16 text-center">
            <h2 className="text-3xl md:text-5xl font-bold mb-8 font-display">Ready to elevate your event?</h2>
            <div className="flex flex-col gap-4 text-left max-w-xl mx-auto mb-10">
              <div className="flex items-center gap-3">
                <CheckCircle className="text-primary w-6 h-6 flex-shrink-0" />
                <span className="text-lg">Zero setup costs</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="text-primary w-6 h-6 flex-shrink-0" />
                <span className="text-lg">Instant payout options</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="text-primary w-6 h-6 flex-shrink-0" />
                <span className="text-lg">Real-time analytics dashboard</span>
              </div>
            </div>
            <Link 
              href="/my-events/create" 
              className="inline-flex items-center justify-center px-10 py-5 text-xl font-medium rounded-full bg-primary text-on-primary hover:bg-primary-container transition-all shadow-lg hover:shadow-xl"
            >
              Create Your First Event
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
