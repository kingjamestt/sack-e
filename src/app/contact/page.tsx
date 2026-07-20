'use client';

import { useState } from 'react';
import { Mail, MapPin, Send, Clock } from 'lucide-react';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Construct the email body
    const body = `Name: ${name}
Email: ${email}
Category: ${category}

Message:
${message}`;

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
    <main className="min-h-screen bg-background text-on-background flex flex-col font-sans pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-6">
          
          {/* Header */}
          <div className="text-center mb-16 space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <h1 className="text-5xl md:text-6xl font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-tertiary">
              Get in Touch
            </h1>
            <p className="text-lg text-on-surface-variant max-w-2xl mx-auto">
              Have a question about an event, need help with your tickets, or want to partner with us? We'd love to hear from you.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24">
            
            {/* Contact Info (Left) */}
            <div className="space-y-12 animate-in fade-in slide-in-from-left-8 duration-700 delay-150 fill-mode-both">
              <div>
                <h2 className="text-3xl font-display font-bold mb-6">Contact Information</h2>
                <p className="text-on-surface-variant leading-relaxed">
                  Our support team is available around the clock to ensure you have the best experience on Sack-E Online. Feel free to reach out through any of the channels below.
                </p>
              </div>

              <div className="space-y-8">
                <div className="flex items-start gap-4">
                  <div className="p-4 bg-primary/10 rounded-2xl text-primary">
                    <Mail size={28} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-1">Email Us</h3>
                    <p className="text-on-surface-variant mb-1">For general inquiries and support.</p>
                    <a href="mailto:support@sack-e.com" className="text-primary hover:underline font-semibold">support@sack-e.com</a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-4 bg-secondary/10 rounded-2xl text-secondary">
                    <MapPin size={28} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-1">Our Location</h3>
                    <p className="text-on-surface-variant">Global HQ<br/>Port of Spain, Trinidad</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-4 bg-tertiary/10 rounded-2xl text-tertiary">
                    <Clock size={28} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-1">Business Hours</h3>
                    <p className="text-on-surface-variant">Mon - Fri: 9:00 AM - 6:00 PM AST<br/>Weekend: Event Days Only</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form (Right) */}
            <div className="animate-in fade-in slide-in-from-right-8 duration-700 delay-300 fill-mode-both">
              <div className="bg-surface-container-low border border-white/5 rounded-3xl p-8 lg:p-10 shadow-2xl relative overflow-hidden">
                
                {/* Decorative background gradients */}
                <div className="absolute -top-32 -right-32 w-64 h-64 bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
                <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-secondary/20 rounded-full blur-[100px] pointer-events-none" />

                <h2 className="text-2xl font-display font-bold mb-8 relative z-10">Send us a Message</h2>
                
                <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label htmlFor="name" className="text-sm font-semibold text-on-surface-variant">Your Name</label>
                      <input 
                        id="name"
                        type="text" 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        placeholder="John Doe"
                        className="w-full bg-surface-container border border-black/10 rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-on-surface/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="email" className="text-sm font-semibold text-on-surface-variant">Email Address</label>
                      <input 
                        id="email"
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder="john@example.com"
                        className="w-full bg-surface-container border border-black/10 rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-on-surface/20"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="category" className="text-sm font-semibold text-on-surface-variant">Inquiry Type</label>
                    <select
                      id="category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      required
                      className="w-full bg-surface-container border border-black/10 rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all appearance-none"
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
                    <label htmlFor="message" className="text-sm font-semibold text-on-surface-variant">Message</label>
                    <textarea 
                      id="message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      required
                      rows={5}
                      placeholder="How can we help you today?"
                      className="w-full bg-surface-container border border-black/10 rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none placeholder:text-on-surface/20"
                    />
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-4 bg-primary text-on-primary font-bold rounded-xl hover:bg-primary-container transition-all hover:scale-[1.02] shadow-lg shadow-primary/20 flex items-center justify-center gap-2 group"
                  >
                    Send Message
                    <Send size={18} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                  <p className="text-xs text-center text-on-surface-variant mt-4">
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
