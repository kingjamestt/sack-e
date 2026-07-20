'use client';

import { useState } from 'react';
import { X, Send, Mail } from 'lucide-react';

interface ContactSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizerId?: string;
  defaultCategory?: string;
}

export default function ContactSupportModal({ isOpen, onClose, organizerId, defaultCategory = '' }: ContactSupportModalProps) {
  const [category, setCategory] = useState(defaultCategory);
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Construct the email body
    const body = `Organizer ID: ${organizerId || 'Unknown'}

Issue Details:
${description}`;

    // Construct the mailto URL
    const subject = encodeURIComponent(`[${category || 'General'}] Organizer Support Request`);
    const encodedBody = encodeURIComponent(body);
    const mailtoUrl = `mailto:support@feteonline.com?subject=${subject}&body=${encodedBody}`;

    // Open the user's default email client
    window.location.href = mailtoUrl;

    // Reset and close
    setCategory('');
    setDescription('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-surface border border-black/10 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
      >
        <div className="p-6 border-b border-black/10 flex justify-between items-center bg-surface-container-low">
          <h2 className="text-xl font-display font-bold flex items-center gap-2">
            <Mail className="text-primary" size={24} />
            Contact Sack-E Online
          </h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-black/10 rounded-full transition-colors text-on-surface-variant hover:text-on-surface"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            <div>
              <label htmlFor="category" className="block text-sm font-semibold text-on-surface-variant mb-2">
                Issue Category
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
                className="w-full bg-surface-container border border-black/10 rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all appearance-none"
              >
                <option value="" disabled>Select a category...</option>
                <option value="Advertisement Inquiry">Advertisement Inquiry</option>
                <option value="Refund Request">Refund Request</option>
                <option value="Payment Issue">Payment Issue</option>
                <option value="Platform Bug">Platform Bug</option>
                <option value="Event Review">Event Review</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-semibold text-on-surface-variant mb-2">
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={5}
                placeholder="Please describe your issue or inquiry in detail..."
                className="w-full bg-surface-container border border-black/10 rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none"
              />
              <p className="text-xs text-on-surface-variant mt-2">
                Clicking send will open your default email client to easily send this request to our support team.
              </p>
            </div>
          </div>

          <div className="mt-8 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 font-semibold text-on-surface-variant hover:text-on-surface hover:bg-black/5 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-primary text-on-primary font-bold rounded-xl hover:bg-primary-container transition-colors shadow-lg flex items-center justify-center gap-2"
            >
              <Send size={18} /> Open in Email
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
