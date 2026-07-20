'use client';

import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useRef, useEffect } from "react";
import { Search, Bell, User, LogOut, X, Compass, Ticket, CalendarPlus } from "lucide-react";
import { subscribeToNotifications, markNotificationAsRead } from "@/lib/notifications";
import { useNotifications } from "@/hooks/useNotifications";
import toast from 'react-hot-toast';

export default function NavBar() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  
  const notifications = useNotifications(user?.uid);
  
  const accountRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (accountRef.current && !accountRef.current.contains(event.target as Node)) {
        setAccountDropdownOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  // Prevent background scrolling when search overlay is open
  useEffect(() => {
    if (isSearchOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isSearchOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsSearchOpen(false);
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

  const NavLink = ({ path, icon, text }: { path: string, icon: React.ReactNode, text: string }) => {
    const isActive = pathname === path || (path === '/#events-section' && pathname === '/');
    return (
      <Link href={path} className={`flex items-center gap-1.5 font-body text-sm xl:text-base font-bold transition-all duration-300 active:scale-95 whitespace-nowrap px-2 md:px-3 py-1.5 md:py-2 rounded-full ${
        isActive 
          ? 'bg-primary/10 text-primary' 
          : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
      }`}>
        {icon}
        {isActive && <span className="animate-in fade-in slide-in-from-left-1 hidden min-[375px]:inline-block">{text}</span>}
      </Link>
    );
  };

  return (
    <>
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-1rem)] sm:w-[calc(100%-2rem)] max-w-7xl transition-all duration-300">
        <nav className="bg-surface/90 backdrop-blur-3xl w-full border border-outline-variant/30 shadow-[0_8px_32px_rgba(0,0,0,0.12)] rounded-full flex justify-between items-center px-2 sm:px-4 md:px-6 py-2 md:py-3">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0 mr-1 sm:mr-4">
            <Image src="/sack-e-icon-logo.jpeg" alt="Sack-E Online" width={36} height={36} className="h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9 object-contain rounded-md" />
            <span className="font-display text-xl font-bold text-primary tracking-tight hidden lg:inline whitespace-nowrap">Sack-E</span>
          </Link>
          
          {/* Core Links */}
          <div className="flex items-center gap-1 sm:gap-2 md:gap-4 xl:gap-6 flex-shrink-0 mx-auto">
            <NavLink path="/#events-section" icon={<Compass size={20} />} text="Explore" />
            {user && (
              <>
                <NavLink path="/my-tickets" icon={<Ticket size={20} />} text="Tickets" />
                <NavLink path="/my-events" icon={<CalendarPlus size={20} />} text="Manage" />
              </>
            )}
          </div>

          {/* Right Actions: Search, Notifications, Profile */}
          <div className="flex gap-0.5 sm:gap-2 items-center flex-shrink-0 ml-auto md:ml-0">
            {/* Search Toggle */}
            <button 
              onClick={() => setIsSearchOpen(true)}
              className="p-1.5 sm:p-2 text-on-surface-variant hover:text-primary transition-colors rounded-full hover:bg-surface-container"
              aria-label="Search events"
            >
              <Search size={20} className="w-5 h-5 sm:w-5 sm:h-5" />
            </button>

            {/* Notifications */}
            {user && (
              <div className="relative" ref={notificationsRef}>
                <button 
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="relative text-on-surface-variant hover:text-primary transition-colors p-1.5 sm:p-2 rounded-full hover:bg-surface-container"
                >
                  <Bell size={20} className="w-5 h-5 sm:w-5 sm:h-5" />
                  {notifications.filter(n => !n.read).length > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full ring-2 ring-surface"></span>
                  )}
                </button>
                
                {notificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-surface-container-highest border border-outline-variant/30 rounded-xl shadow-2xl overflow-hidden flex flex-col py-2 animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                    <div className="px-4 py-2 border-b border-outline-variant/20 font-bold text-on-surface flex justify-between items-center">
                      <span>Notifications</span>
                    </div>
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

            {/* Profile / Auth */}
            {!loading && (
              user ? (
                <div className="relative" ref={accountRef}>
                  <button 
                    onClick={() => setAccountDropdownOpen(!accountDropdownOpen)} 
                    className="p-1.5 sm:p-2 text-on-surface-variant hover:text-primary transition-colors rounded-full hover:bg-surface-container ml-0.5 sm:ml-1"
                  >
                    <User size={22} className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                  
                  {accountDropdownOpen && (
                     <div className="absolute right-0 mt-2 w-56 bg-surface-container-highest border border-outline-variant/30 rounded-xl shadow-2xl overflow-hidden flex flex-col py-2 animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                      <div className="px-4 py-3 border-b border-white/10 mb-2">
                        <p className="text-xs text-on-surface-variant">Signed in as</p>
                        <p className="text-sm font-bold text-on-surface truncate">{user.email || user.phoneNumber}</p>
                      </div>
                      <Link 
                        href="/profile" 
                        onClick={() => setAccountDropdownOpen(false)} 
                        className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-surface-dim transition-colors font-semibold text-on-surface"
                      >
                        <User size={16} className="text-primary" /> Profile
                      </Link>
                      <div className="py-2 mt-1 border-t border-white/10">
                        <button 
                          onClick={handleLogout} 
                          className="w-full px-4 py-2 text-left text-sm text-error hover:bg-error/10 flex items-center gap-3 transition-colors font-semibold"
                        >
                          <LogOut size={16} /> Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-1 sm:gap-2">
                  <Link href="/login" className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-on-surface hover:text-primary transition-colors">
                    Login
                  </Link>
                  <Link href="/signup" className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold bg-primary text-on-primary rounded-full hover:bg-primary-container transition-colors shadow-md whitespace-nowrap">
                    Sign Up
                  </Link>
                </div>
              )
            )}
          </div>
        </nav>
      </div>

      {/* Full Screen Search Overlay */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-2xl flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-300 p-4">
          <button 
            onClick={() => setIsSearchOpen(false)}
            className="absolute top-6 right-6 md:top-12 md:right-12 p-3 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-full transition-colors"
          >
            <X size={32} />
          </button>
          
          <div className="w-full max-w-4xl flex flex-col items-center">
            <h2 className="font-display font-bold text-3xl md:text-5xl text-on-surface mb-8 text-center">
              What are you looking for?
            </h2>
            <form onSubmit={handleSearch} className="w-full relative">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-primary" size={32} />
              <input 
                ref={searchInputRef}
                type="text" 
                placeholder="Search events, artists, venues..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-surface-container border-2 border-primary/20 focus:border-primary text-on-surface text-xl md:text-3xl rounded-full py-6 md:py-8 pl-16 md:pl-20 pr-6 shadow-2xl focus:outline-none focus:ring-0 transition-colors" 
              />
              <button 
                type="submit"
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-primary text-on-primary px-6 md:px-8 py-3 md:py-4 rounded-full font-bold md:text-lg hover:bg-primary-container hover:scale-105 transition-all shadow-lg"
              >
                Search
              </button>
            </form>
            <p className="mt-6 text-on-surface-variant font-medium text-sm md:text-base">
              Press <kbd className="bg-surface-container px-2 py-1 rounded-md text-xs font-mono border border-outline-variant/30">Enter</kbd> to search or click the X to close.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
