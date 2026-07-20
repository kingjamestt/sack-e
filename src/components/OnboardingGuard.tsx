'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const { user, userData, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading) {
      if (user && userData && userData.onboarded === false && pathname !== '/onboarding') {
        router.push('/onboarding');
      } else if (user && userData && userData.onboarded && pathname === '/onboarding') {
        router.push('/');
      }
    }
  }, [user, userData, loading, pathname, router]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-white">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return <>{children}</>;
}
