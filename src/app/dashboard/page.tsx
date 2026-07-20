'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/my-events');
  }, [router]);

  return (
    <div className="flex h-screen pt-24 md:pt-32 items-center justify-center bg-background text-on-surface">
      <div className="animate-fadeIn">
        <p>Redirecting to your events...</p>
      </div>
    </div>
  );
}
