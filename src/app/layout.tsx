import type { Metadata } from "next";
import Image from "next/image";
import { Inter, Montserrat } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import NavBar from "@/components/NavBar";
import { Toaster } from 'react-hot-toast';
import Link from 'next/link';

const inter = Inter({ subsets: ["latin"], variable: '--font-inter' });
const montserrat = Montserrat({ subsets: ["latin"], variable: '--font-montserrat' });

export const metadata: Metadata = {
  title: {
    template: '%s | Sack-E Online',
    default: 'Sack-E Online | Safe, Accessible & Convenient Event Ticketing',
  },
  description: "Discover, book, and manage your event tickets seamlessly with Sack-E Online. Experience a premium, accessible, and convenient ticketing platform.",
  keywords: ["events", "ticketing", "booking", "sack-e", "concerts", "festivals", "nightlife"],
  openGraph: {
    title: 'Sack-E Online | Premium Event Ticketing',
    description: 'Safe, Accessible & Convenient Event Ticketing platform.',
    type: 'website',
    locale: 'en_US',
    siteName: 'Sack-E Online',
    images: [
      {
        url: '/sack-e-logo.jpeg',
        width: 1200,
        height: 630,
        alt: 'Sack-E Online Logo',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sack-E Online',
    description: 'Safe, Accessible & Convenient Event Ticketing platform.',
    images: ['/sack-e-logo.jpeg'],
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${montserrat.variable}`} suppressHydrationWarning>
      <body className="bg-background text-on-background antialiased min-h-screen selection:bg-primary selection:text-on-primary flex flex-col transition-colors duration-300" suppressHydrationWarning>
        <AuthProvider>
          <NavBar />
          <div className="flex-grow">
            {children}
          </div>
          <footer className="w-full py-12 mt-20 border-t border-surface-variant/20 bg-surface/50 backdrop-blur-md relative z-10">
            <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
              <div className="flex flex-col gap-4">
                <div className="font-bold text-2xl tracking-tight text-primary font-montserrat">
                  Sack-E<span className="text-secondary">.</span>
                </div>
                <p className="text-sm text-on-surface-variant max-w-xs">
                  Experience a premium, accessible, and convenient ticketing platform for events, concerts, and nightlife.
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <h3 className="font-semibold text-on-surface mb-2 font-montserrat">Company</h3>
                <Link href="/about" className="text-sm text-on-surface-variant hover:text-primary transition-colors">About Us</Link>
                <Link href="/contact" className="text-sm text-on-surface-variant hover:text-primary transition-colors">Contact</Link>
                <Link href="/careers" className="text-sm text-on-surface-variant hover:text-primary transition-colors">Careers</Link>
              </div>
              <div className="flex flex-col gap-3">
                <h3 className="font-semibold text-on-surface mb-2 font-montserrat">Support</h3>
                <Link href="/faq" className="text-sm text-on-surface-variant hover:text-primary transition-colors">FAQ</Link>
                <Link href="/refunds" className="text-sm text-on-surface-variant hover:text-primary transition-colors">Refund Policy</Link>
                <Link href="/terms" className="text-sm text-on-surface-variant hover:text-primary transition-colors">Terms of Service</Link>
              </div>
              <div className="flex flex-col gap-3">
                <h3 className="font-semibold text-on-surface mb-2 font-montserrat">Organizers</h3>
                <Link href="/sell" className="text-sm text-on-surface-variant hover:text-primary transition-colors">Sell Tickets</Link>
                <Link href="/pricing" className="text-sm text-on-surface-variant hover:text-primary transition-colors">Pricing</Link>
                <Link href="/dashboard" className="text-sm text-on-surface-variant hover:text-primary transition-colors">Dashboard</Link>
              </div>
            </div>
            
            <div className="container mx-auto px-6 pt-8 border-t border-surface-variant/20 flex flex-col items-center justify-center gap-4">
              <p className="text-on-surface-variant font-medium text-sm">&copy; {new Date().getFullYear()} Sack-E Online. All rights reserved.</p>
              <div className="flex items-center gap-1.5 text-xs text-on-surface/60 font-bold tracking-widest uppercase">
                <span>Powered by</span>
                <a href="https://www.bsweb.co" target="_blank" rel="noreferrer" className="opacity-90 hover:opacity-100 transition-all flex items-center">
                  <Image src="/bs-logo-original.png" alt="BS Web Solutions" width={60} height={20} className="object-contain" />
                </a>
              </div>
            </div>
          </footer>
          <Toaster 
            position="bottom-right"
            toastOptions={{
              className: '!glass !text-on-surface !border !border-white/20 !shadow-2xl font-semibold text-sm rounded-2xl',
              success: { iconTheme: { primary: '#0055CC', secondary: '#fff' } },
              error: { iconTheme: { primary: '#ba1a1a', secondary: '#fff' } }
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
