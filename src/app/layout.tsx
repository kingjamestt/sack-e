import type { Metadata } from "next";
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
          <footer className="w-full py-10 mt-20 border-t border-white/5 bg-surface-container-lowest/80 backdrop-blur-md flex flex-col items-center justify-center gap-4 relative z-10">
            <div className="flex items-center gap-4 text-sm font-semibold text-on-surface-variant">
              <Link href="/contact" className="hover:text-primary transition-colors">Contact Us / Support</Link>
            </div>
            <p className="text-on-surface-variant font-medium text-sm">&copy; {new Date().getFullYear()} Sack-E Online. All rights reserved.</p>
            <div className="flex items-center gap-1.5 text-xs text-on-surface/60 font-bold tracking-widest uppercase mt-4">
              <span>Powered by</span>
              <a href="https://bsweb.com" target="_blank" rel="noreferrer" className="opacity-90 hover:opacity-100 transition-all text-primary">
                bsweb
              </a>
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
