'use client';

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useRef, useEffect } from "react";
import { ChevronDown, Ticket, LogOut, Home, Search, Bell, Menu, User, Mail, Settings, X } from "lucide-react";
import { subscribeToNotifications, markNotificationAsRead } from "@/lib/notifications";
import { NotificationData } from "@/types";
import { useNotifications } from "@/hooks/useNotifications";
import toast from 'react-hot-toast';

/**
 * NavBar Component
 * 
 * Responsive navigation bar for the application.
 * It dynamically adapts its contents based on the user's authentication state.
 * Includes logo/branding, main navigation links, and a user profile dropdown 
 * or login/signup buttons depending on if the user is authenticated.
 * 
 * Includes real-time notification polling and displays unread notification badges.
 * 
 * @returns {JSX.Element} The rendered navigation bar.
 */
export default function NavBar() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);
  const [menuDropdownOpen, setMenuDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notifications = useNotifications(user?.uid);
  
  const accountRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (accountRef.current && !accountRef.current.contains(event.target as Node)) {
        setAccountDropdownOpen(false);
      }
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuDropdownOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/?q=${encodeURIComponent(searchQuery)}#events-section`);
    }
  };

  const handleLogout = async () => {
    setAccountDropdownOpen(false);
    try {
      await logout();
      toast.success('Successfully logged out');
    } catch (e) {
      console.error('Logout failed', e);
      toast.error('Logout failed');
    }
  };

  const getLinkClass = (path: string) => {
    const isActive = pathname === path || (path === '/#events-section' && pathname === '/');
    return `font-body text-sm xl:text-base font-bold transition-all duration-200 active:scale-95 whitespace-nowrap border-b-2 ${
      isActive 
        ? 'text-primary border-primary' 
        : 'text-on-surface-variant border-transparent hover:text-primary'
    }`;
  };

  const getMobileLinkClass = (path: string) => {
    const isActive = pathname === path || (path === '/#events-section' && pathname === '/');
    return `flex items-center gap-3 px-4 py-3 text-sm transition-colors text-left font-semibold ${
      isActive 
        ? 'bg-surface-dim text-primary' 
        : 'text-on-surface hover:bg-surface-dim'
    }`;
  };

  return (
    <nav className="bg-surface/90 backdrop-blur-xl w-full sticky top-0 z-50 border-b border-outline-variant/30 shadow-sm flex justify-between items-center px-6 md:px-8 py-4 max-w-full">
      <Link href="/" className="flex items-center gap-2">
        <img src="/sack-e-icon-logo.jpeg" alt="Sack-E Online" className="h-8 md:h-9 object-contain rounded-md" />
        <span className="font-display text-xl font-bold text-primary tracking-tight hidden sm:inline">Sack-E</span>
      </Link>
      
      <div className="hidden md:flex items-center gap-4 lg:gap-6">
        <Link href="/#events-section" className={getLinkClass('/#events-section')}>Upcoming Events</Link>
        {user && (
          <>
            <Link href="/my-tickets" className={getLinkClass('/my-tickets')}>My Tickets</Link>
            <Link href="/my-events" className={getLinkClass('/my-events')}>My Events</Link>
          </>
        )}
        <Link href="/contact" className={getLinkClass('/contact')}>Contact Us / Support</Link>
      </div>

      <div className="flex gap-4 items-center">
        <form onSubmit={handleSearch} className="hidden lg:flex items-center bg-surface-container rounded-full px-4 py-2 border border-outline-variant/50 focus-within:border-primary transition-colors">
          <Search className="text-on-surface-variant mr-2" size={16} />
          <input 
            type="text" 
            placeholder="Search events..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none focus:outline-none focus:ring-0 text-sm font-body text-on-surface placeholder:text-on-surface-variant w-32 xl:w-40" 
          />
        </form>

        <Link href="/my-events/create" className="hidden md:inline-flex bg-primary text-on-primary font-semibold text-sm px-4 py-2 rounded-full hover:bg-primary-container transition-colors duration-200 active:scale-95 shadow-[0_4px_14px_rgba(0,104,93,0.2)]">
          Create Event
        </Link>
        
        {user && (
          <div className="relative hidden md:block" ref={notificationsRef}>
            <button 
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="relative text-on-surface-variant hover:text-primary transition-colors p-2 rounded-full hover:bg-surface-container"
            >
              <Bell size={20} />
              {notifications.filter(n => !n.read).length > 0 && (
                <span className="absolute top-1 right-1.5 w-2 h-2 bg-error rounded-full ring-2 ring-surface"></span>
              )}
            </button>
            
            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-surface-container-highest border border-outline-variant/30 rounded-xl shadow-2xl overflow-hidden flex flex-col py-2 animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                <div className="px-4 py-2 border-b border-outline-variant/20 font-bold text-on-surface">Notifications</div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-6 text-center text-sm text-on-surface-variant">No notifications right now.</div>
                  ) : (
                    notifications.map(notification => (
                      <div key={notification.id} className={`px-4 py-3 border-b border-outline-variant/10 last:border-0 hover:bg-surface-dim transition-colors ${!notification.read ? 'bg-primary/5' : ''}`}>
                        <div className="flex justify-between items-start gap-2">
                          <div 
                            className={notification.link ? "cursor-pointer flex-1" : "flex-1"}
                            onClick={() => {
                              if (notification.link) {
                                router.push(notification.link);
                                setNotificationsOpen(false);
                                if (!notification.read && user) {
                                  markNotificationAsRead(user.uid, notification.id);
                                }
                              }
                            }}
                          >
                            <div className={`text-sm font-semibold ${!notification.read ? 'text-on-surface' : 'text-on-surface-variant'}`}>{notification.title}</div>
                            <div className="text-xs text-on-surface-variant mt-0.5 leading-snug">{notification.message}</div>
                          </div>
                          {!notification.read && (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                if (user) markNotificationAsRead(user.uid, notification.id);
                              }}
                              className="text-on-surface-variant hover:text-error p-1 rounded-full hover:bg-error/10 transition-colors flex-shrink-0"
                              title="Dismiss"
                            >
                              <X size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {!loading && (
          user ? (
            <div className="flex items-center gap-3">
              {/* Account Pill */}
              <div className="relative" ref={accountRef}>
                <button 
                  onClick={() => setAccountDropdownOpen(!accountDropdownOpen)} 
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container border border-outline-variant/30 hover:bg-surface-container-high transition-colors"
                >
                  <span className="text-sm font-semibold max-w-[120px] md:max-w-[160px] truncate text-on-surface">
                    {user.phoneNumber || user.email || 'Account'}
                  </span>
                  <ChevronDown size={16} className={`transition-transform text-on-surface-variant ${accountDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {accountDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-surface-container-highest border border-outline-variant/30 rounded-xl shadow-2xl overflow-hidden flex flex-col py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                    <Link 
                      href="/profile" 
                      onClick={() => setAccountDropdownOpen(false)} 
                      className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-surface-dim transition-colors text-left font-semibold text-on-surface"
                    >
                      <User size={16} className="text-primary" /> Edit Account Details
                    </Link>
                    <div className="py-2 border-t border-white/10">
                      <button 
                        onClick={handleLogout} 
                        className="w-full px-4 py-2 text-left text-sm text-error hover:bg-error/10 flex items-center gap-3 transition-colors"
                      >
                        <LogOut size={16} /> Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Hamburger Menu (Mobile Only) */}
              <div className="relative md:hidden" ref={menuRef}>
                <button 
                  onClick={() => setMenuDropdownOpen(!menuDropdownOpen)}
                  className="p-1.5 text-on-surface-variant hover:text-primary transition-colors rounded-lg hover:bg-surface-container"
                >
                  <Menu size={24} />
                </button>
                
                {menuDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-surface-container-highest border border-outline-variant/30 rounded-xl shadow-2xl overflow-hidden flex flex-col py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                    <Link 
                      href="/#events-section" 
                      onClick={() => setMenuDropdownOpen(false)} 
                      className={getMobileLinkClass('/#events-section')}
                    >
                      <Home size={16} className={pathname === '/' ? 'text-primary' : 'text-secondary'} /> Upcoming Events
                    </Link>
                    <Link 
                      href="/my-tickets" 
                      onClick={() => setMenuDropdownOpen(false)} 
                      className={getMobileLinkClass('/my-tickets')}
                    >
                      <Ticket size={16} className={pathname === '/my-tickets' ? 'text-primary' : 'text-primary/70'} /> My Tickets
                    </Link>
                    <Link 
                      href="/my-events" 
                      onClick={() => setMenuDropdownOpen(false)} 
                      className={getMobileLinkClass('/my-events')}
                    >
                      <Settings size={16} className={pathname === '/my-events' ? 'text-primary' : 'text-secondary'} /> My Events
                    </Link>
                    <Link 
                      href="/contact" 
                      onClick={() => setMenuDropdownOpen(false)} 
                      className={getMobileLinkClass('/contact')}
                    >
                      <Mail size={16} className={pathname === '/contact' ? 'text-primary' : 'text-secondary'} /> Contact Us / Support
                    </Link>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Link href="/login" className="px-4 py-2 text-sm font-semibold text-on-surface hover:text-primary transition-colors">
                Login
              </Link>
              <Link href="/signup" className="px-4 py-2 text-sm font-semibold bg-surface-container text-primary rounded-full hover:bg-surface-container-high transition-colors">
                Sign Up
              </Link>
              <div className="relative md:hidden" ref={menuRef}>
                <button 
                  onClick={() => setMenuDropdownOpen(!menuDropdownOpen)}
                  className="p-1.5 text-on-surface-variant hover:text-primary transition-colors rounded-lg hover:bg-surface-container"
                >
                  <Menu size={24} />
                </button>
                {menuDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-surface-container-highest border border-outline-variant/30 rounded-xl shadow-2xl overflow-hidden flex flex-col py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                    <Link 
                      href="/#events-section" 
                      onClick={() => setMenuDropdownOpen(false)} 
                      className={getMobileLinkClass('/#events-section')}
                    >
                      <Home size={16} className={pathname === '/' ? 'text-primary' : 'text-secondary'} /> Upcoming Events
                    </Link>
                    <Link 
                      href="/contact" 
                      onClick={() => setMenuDropdownOpen(false)} 
                      className={getMobileLinkClass('/contact')}
                    >
                      <Mail size={16} className={pathname === '/contact' ? 'text-primary' : 'text-secondary'} /> Contact Us / Support
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )
        )}
      </div>
    </nav>
  );
}
