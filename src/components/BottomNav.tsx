'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Compass, Ticket, PlusCircle, User } from "lucide-react";

export default function BottomNav() {
  const { user, loading } = useAuth();
  const pathname = usePathname();

  // Don't show bottom nav if we are on auth pages or platform admin
  if (pathname.startsWith('/login') || pathname.startsWith('/signup') || pathname.startsWith('/platform-admin')) {
    return null;
  }

  const getLinkClass = (path: string, exact: boolean = false) => {
    const isActive = exact 
      ? pathname === path 
      : (path === '/' && pathname === '/') || (path !== '/' && pathname.startsWith(path));
      
    return `flex flex-col items-center justify-center gap-1 w-full h-full transition-all duration-200 ${
      isActive ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'
    }`;
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface/80 backdrop-blur-3xl border-t border-outline-variant/30 pb-safe">
      <nav className="flex justify-around items-center h-16 px-2">
        <Link href="/#events-section" className={getLinkClass('/', true)}>
          <div className={`p-1.5 rounded-full transition-colors ${pathname === '/' ? 'bg-primary/10' : ''}`}>
            <Compass size={24} />
          </div>
          <span className="text-[10px] font-semibold">Explore</span>
        </Link>
        
        {user ? (
          <>
            <Link href="/my-tickets" className={getLinkClass('/my-tickets')}>
              <div className={`p-1.5 rounded-full transition-colors ${pathname.startsWith('/my-tickets') ? 'bg-primary/10' : ''}`}>
                <Ticket size={24} />
              </div>
              <span className="text-[10px] font-semibold">Tickets</span>
            </Link>
            
            <Link href="/my-events" className={getLinkClass('/my-events')}>
              <div className={`p-1.5 rounded-full transition-colors ${pathname.startsWith('/my-events') ? 'bg-primary/10' : ''}`}>
                <PlusCircle size={24} />
              </div>
              <span className="text-[10px] font-semibold">Manage</span>
            </Link>
          </>
        ) : (
          <Link href="/login" className="flex flex-col items-center justify-center gap-1 w-full h-full text-on-surface-variant hover:text-on-surface transition-all duration-200">
             <div className="p-1.5 rounded-full">
              <Ticket size={24} />
            </div>
            <span className="text-[10px] font-semibold">Tickets</span>
          </Link>
        )}
        
        <Link href={user ? "/profile" : "/login"} className={getLinkClass('/profile')}>
          <div className={`p-1.5 rounded-full transition-colors ${pathname.startsWith('/profile') ? 'bg-primary/10' : ''}`}>
            <User size={24} />
          </div>
          <span className="text-[10px] font-semibold">Profile</span>
        </Link>
      </nav>
    </div>
  );
}
