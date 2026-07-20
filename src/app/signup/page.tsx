'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Mail, Lock, User as UserIcon, Eye, EyeOff } from 'lucide-react';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

export default function SignUpPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signInWithGoogle } = useAuth();
  const router = useRouter();

  const handleGoogleSignIn = async () => {
    if (isLoading) return;
    setError('');
    
    // Call synchronously to prevent Safari blocking the popup
    const signInPromise = signInWithGoogle();
    setIsLoading(true);
    
    try {
      await signInPromise;
      router.push('/');
    } catch (err: any) {
      console.error('Failed to sign in', err);
      if (err.code === 'auth/popup-blocked') {
        setError('Popup was blocked by your browser. Please allow popups for this site or use Email login.');
      } else if (err.code === 'auth/popup-closed-by-user') {
        // User closed the popup, do not show error message
        setError('');
      } else {
        setError('Failed to sign in with Google');
      }
      setIsLoading(false);
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setError('');
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;
      
      // Update Auth Profile
      await updateProfile(user, { displayName: name.trim() });
      
      // Create user document in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        name: name.trim(),
        email: email.trim(),
        createdAt: new Date().toISOString(),
        role: 'user', // Default role
      });
      
      router.push('/');
    } catch (err) {
      const error = err as Error;
      console.error('Failed to create an account', error);
      setError(error.message || 'Failed to create an account.');
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen pt-24 md:pt-32 flex flex-col items-center justify-center px-4 pb-16 relative">
      <div className="absolute inset-0 bg-background overflow-hidden pointer-events-none">
        <div className="absolute top-[30%] left-[20%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 w-full max-w-md">

        <div className="backdrop-blur-xl bg-surface-container/60 border border-black/10 p-8 rounded-3xl shadow-2xl">
          <h1 className="font-display text-3xl font-bold mb-2">Create Account</h1>
          <p className="text-on-surface-variant text-sm mb-8">Join Sack-E Online to secure your tickets.</p>
          
          {error && (
            <div className="mb-4 p-3 bg-error-container text-on-error-container rounded-lg text-sm font-medium">
              {error}
            </div>
          )}
          
          <form onSubmit={handleEmailSignUp} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-2">Full Name</label>
              <div className="relative">
                <UserIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-surface-container-high border border-black/10 rounded-xl py-3 pl-12 pr-4 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-on-surface"
                  placeholder="Enter your name"
                  autoComplete="name"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-2">Email</label>
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-surface-container-high border border-black/10 rounded-xl py-3 pl-12 pr-4 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-on-surface"
                  placeholder="Enter your email"
                  autoComplete="email"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-2">Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-surface-container-high border border-black/10 rounded-xl py-3 pl-12 pr-12 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-on-surface"
                  placeholder="Create a password"
                  autoComplete="new-password"
                  required
                  minLength={6}
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button disabled={isLoading} type="submit" className="w-full py-4 mt-2 bg-gradient-to-r from-primary to-secondary text-on-primary font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50">
              {isLoading ? 'Loading...' : 'Sign Up'}
            </button>
          </form>

          <div className="mt-6 mb-6 flex items-center gap-4">
            <div className="h-[1px] flex-1 bg-black/5" />
            <span className="text-xs uppercase tracking-wider text-on-surface-variant font-semibold">Or</span>
            <div className="h-[1px] flex-1 bg-black/5" />
          </div>

          <button 
            disabled={isLoading}
            onClick={handleGoogleSignIn}
            className="w-full py-4 bg-white text-black font-bold rounded-xl hover:bg-gray-100 transition-colors flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg" className={isLoading ? "opacity-50" : ""}>
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            {isLoading ? 'Loading...' : 'Sign up with Google'}
          </button>

          <p className="mt-8 text-center text-sm text-on-surface-variant">
            Already have an account? <Link href="/login" className="text-primary font-semibold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
