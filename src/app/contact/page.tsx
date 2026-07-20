'use client';

import { useState } from 'react';
import { Mail, MapPin, Send, Clock, Phone } from 'lucide-react';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Construct the email body
    const body = `Name: ${name}\nEmail: ${email}\nCategory: ${category}\n\nMessage:\n${message}`;

    // Construct the mailto URL
    const subject = encodeURIComponent(`[${category || 'General'}] Inquiry from ${name}`);
    const encodedBody = encodeURIComponent(body);
    const mailtoUrl = `mailto:support@sack-e.com?subject=${subject}&body=${encodedBody}`;

    // Open the user's default email client
    window.location.href = mailtoUrl;

    // Reset fields
    setName('');
    setEmail('');
    setCategory('');
    setMessage('');
  };

  return (
    <main className="min-h-screen pb-20 relative overflow-hidden">
      
      {/* Background Mesh (consistent with homepage) */}
      <div className="fixed inset-0 -z-10 bg-surface-container opacity-40">
        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" className="text-primary/10" />
            </pattern>
            <radialGradient id="mesh-gradient" cx="50%" cy="0%" r="50%">
              <stop offset="0%" stopColor="var(--primary-color, #0B4DE5)" stopOpacity="0.15" />
              <stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid-pattern)" />
          <rect width="100%" height="100%" fill="url(#mesh-gradient)" />
        </svg>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 pt-24 md:pt-32 relative z-10">
        
        {/* Header */}
        <div className="text-center mb-16 space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary font-bold text-sm tracking-widest uppercase mb-4 border border-primary/20">
            Contact Support
          </div>
          <h1 className="text-5xl md:text-6xl font-display font-black text-on-surface tracking-tight">
            We're here to <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">help.</span>
          </h1>
          <p className="text-lg md:text-xl text-on-surface-variant max-w-2xl mx-auto font-medium">
            Have a question about an event, need help with your tickets, or want to partner with us? Reach out today.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">
          
          {/* Contact Info (Left) */}
          <div className="lg:col-span-2 space-y-6 animate-in fade-in slide-in-from-left-8 duration-700 delay-150 fill-mode-both">
            
            <div className="bg-surface/60 backdrop-blur-xl border border-white/10 rounded-3xl p-8 flex items-start gap-4 transition-transform hover:-translate-y-1 duration-300 shadow-xl">
              <div className="p-4 bg-primary/20 rounded-2xl text-primary border border-primary/30 flex-shrink-0">
                <Mail size={28} />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-1 text-on-surface">Email Us</h3>
                <p className="text-on-surface-variant mb-2 text-sm leading-relaxed">For general inquiries and support, drop us a line anytime.</p>
                <a href="mailto:support@sack-e.com" className="text-primary hover:text-primary-container font-semibold transition-colors">support@sack-e.com</a>
              </div>
            </div>

            <div className="bg-surface/60 backdrop-blur-xl border border-white/10 rounded-3xl p-8 flex items-start gap-4 transition-transform hover:-translate-y-1 duration-300 shadow-xl">
              <div className="p-4 bg-secondary/20 rounded-2xl text-secondary border border-secondary/30 flex-shrink-0">
                <MapPin size={28} />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-1 text-on-surface">Our Location</h3>
                <p className="text-on-surface-variant text-sm leading-relaxed">Global HQ<br/>Port of Spain, Trinidad & Tobago</p>
              </div>
            </div>

            <div className="bg-surface/60 backdrop-blur-xl border border-white/10 rounded-3xl p-8 flex items-start gap-4 transition-transform hover:-translate-y-1 duration-300 shadow-xl">
              <div className="p-4 bg-tertiary/20 rounded-2xl text-tertiary border border-tertiary/30 flex-shrink-0">
                <Clock size={28} />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-1 text-on-surface">Business Hours</h3>
                <p className="text-on-surface-variant text-sm leading-relaxed">Mon - Fri: 9:00 AM - 6:00 PM AST<br/>Weekend: Event Days Only</p>
              </div>
            </div>

          </div>

          {/* Contact Form (Right) */}
          <div className="lg:col-span-3 animate-in fade-in slide-in-from-right-8 duration-700 delay-300 fill-mode-both">
            <div className="bg-surface-container-highest/80 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 lg:p-10 shadow-2xl relative overflow-hidden h-full">
              
              {/* Decorative background gradients */}
              <div className="absolute -top-32 -right-32 w-64 h-64 bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
              <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-secondary/20 rounded-full blur-[100px] pointer-events-none" />

              <h2 className="text-3xl font-display font-bold mb-8 relative z-10 text-on-surface">Send a Message</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-bold text-on-surface-variant uppercase tracking-wider">Your Name</label>
                    <input 
                      id="name"
                      type="text" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      placeholder="John Doe"
                      className="w-full bg-surface border border-white/10 rounded-xl px-4 py-4 text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-on-surface-variant/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-bold text-on-surface-variant uppercase tracking-wider">Email Address</label>
                    <input 
                      id="email"
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="john@example.com"
                      className="w-full bg-surface border border-white/10 rounded-xl px-4 py-4 text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-on-surface-variant/50"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="category" className="text-sm font-bold text-on-surface-variant uppercase tracking-wider">Inquiry Type</label>
                  <select
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    required
                    className="w-full bg-surface border border-white/10 rounded-xl px-4 py-4 text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all appearance-none"
                  >
                    <option value="" disabled>Select a topic...</option>
                    <option value="General Inquiry">General Inquiry</option>
                    <option value="Event Support">Event Support</option>
                    <option value="Ticket Issue">Ticket Issue</option>
                    <option value="Partnership">Partnership / Sponsorship</option>
                    <option value="Feedback">Feedback</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="message" className="text-sm font-bold text-on-surface-variant uppercase tracking-wider">Message</label>
                  <textarea 
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    rows={6}
                    placeholder="How can we help you today?"
                    className="w-full bg-surface border border-white/10 rounded-xl px-4 py-4 text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none placeholder:text-on-surface-variant/50"
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full py-4 mt-4 bg-primary text-on-primary font-bold text-lg rounded-xl hover:bg-primary-container transition-all hover:scale-[1.02] shadow-lg shadow-primary/20 flex items-center justify-center gap-2 group"
                >
                  Send Message
                  <Send size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </button>
                <p className="text-xs text-center text-on-surface-variant mt-4 opacity-70">
                  This will open your default email client to send the message securely.
                </p>
              </form>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
