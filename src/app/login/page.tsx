'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Mail, Lock, Phone, Eye, EyeOff } from 'lucide-react';
import { signInWithEmailAndPassword, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import toast from 'react-hot-toast';

declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier;
  }
}

function LoginContent() {
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');
  
  // Email Auth State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Phone Auth State
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  
  const [error, setError] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signInWithGoogle } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/';

  // Reference for Recaptcha
  const recaptchaContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Clear recaptcha on unmount or method change
    if (loginMethod !== 'phone') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setConfirmationResult(null);
      setPhoneNumber('');
      setVerificationCode('');
    }
  }, [loginMethod]);

  const handleGoogleSignIn = async () => {
    if (isLoading) return;
    setError('');
    
    // Call signInWithGoogle synchronously so Safari doesn't block the popup.
    // We set loading state after the promise starts.
    const signInPromise = signInWithGoogle();
    setIsLoading(true);
    
    try {
      await signInPromise;
      toast.success('Successfully logged in!');
      router.push(redirectUrl);
    } catch (err: any) {
      console.error('Failed to sign in', err);
      if (err.code === 'auth/popup-blocked') {
        setError('Popup was blocked by your browser. Please allow popups for this site or use Phone/Email login.');
      } else if (err.code === 'auth/popup-closed-by-user') {
        // User closed the popup, do not show error message
        setError('');
      } else {
        setError('Failed to sign in with Google. Please try another method.');
      }
      setIsLoading(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setError('');
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success('Successfully logged in!');
      router.push(redirectUrl);
    } catch (err: any) {
      const error = err as Error;
      setIsLoading(false);
      if (error.message.includes('auth/invalid-credential')) {
        setError('Invalid email or password.');
      } else {
        setError('An unexpected error occurred.');
      }
    }
  };

  const handleForgotPassword = async () => {
    setError('');
    setResetMessage('');
    if (!email) {
      setError('Please enter your email address first to reset your password.');
      return;
    }
    
    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setResetMessage('Password reset email sent. Please check your inbox.');
    } catch (err: any) {
      setError(err.message || 'Failed to send password reset email.');
    } finally {
      setIsLoading(false);
    }
  };

  const setUpRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
      });
    }
  };

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setError('');
    setIsLoading(true);
    
    // Basic phone validation (Firebase expects E.164 format, e.g. +16505551234)
    let formattedPhone = phoneNumber.trim();
    if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+' + formattedPhone; // Attempt to auto-add + if user forgot, though proper formatting is preferred
    }

    try {
      setUpRecaptcha();
      const appVerifier = window.recaptchaVerifier;
      if (!appVerifier) {
        throw new Error('reCAPTCHA failed to initialize');
      }
      const result = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      setConfirmationResult(result);
      setIsLoading(false);
    } catch (err) {
      const error = err as Error;
      setError(error.message || 'Failed to send verification code.');
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = undefined;
      }
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setError('');
    if (!confirmationResult) return;
    setIsLoading(true);

    try {
      await confirmationResult.confirm(verificationCode);
      toast.success('Successfully logged in!');
      router.push(redirectUrl);
    } catch (err) {
      setError('Invalid verification code.');
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen pt-24 md:pt-32 flex items-center justify-center px-4 pb-4 relative">
      <div className="absolute inset-0 bg-surface overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-secondary/20 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <Link href="/" className="inline-flex items-center text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors mb-8">
          <ArrowLeft size={16} className="mr-2" /> Back to Home
        </Link>
        
        <div className="backdrop-blur-xl bg-surface-container/60 border border-black/10 p-8 rounded-3xl shadow-2xl">
          <h1 className="font-display text-3xl font-bold mb-2">Welcome Back</h1>
          <p className="text-on-surface-variant text-sm mb-8">Sign in to manage your tickets and events.</p>

          {/* Toggle Method */}
          <div className="flex bg-surface-container-high rounded-xl p-1 mb-6 border border-white/5">
            <button 
              onClick={() => setLoginMethod('email')}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${loginMethod === 'email' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
            >
              Email
            </button>
            <button 
              onClick={() => setLoginMethod('phone')}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${loginMethod === 'phone' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
            >
              Phone
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-error-container text-on-error-container rounded-lg text-sm font-medium">
              {error}
            </div>
          )}
          {resetMessage && (
            <div className="mb-4 p-3 bg-green-500/20 text-green-700 rounded-lg text-sm font-medium border border-green-500/30">
              {resetMessage}
            </div>
          )}
          
          {loginMethod === 'email' ? (
            <form onSubmit={handleEmailSignIn} className="space-y-4">
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
                    required
                  />
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Password</label>
                  <button 
                    type="button"
                    onClick={handleForgotPassword}
                    disabled={isLoading}
                    className="text-xs text-primary hover:text-primary-container font-semibold transition-colors disabled:opacity-50"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-surface-container-high border border-black/10 rounded-xl py-3 pl-12 pr-12 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-on-surface"
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    required
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
                    {isLoading ? 'Loading...' : 'Sign In'}
                  </button>
            </form>
          ) : (
            <div className="space-y-4">
              <div id="recaptcha-container" ref={recaptchaContainerRef}></div>
              
              {!confirmationResult ? (
                <form onSubmit={handleSendCode} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-2">Phone Number</label>
                    <div className="relative">
                      <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                      <input 
                        type="tel" 
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="w-full bg-surface-container-high border border-black/10 rounded-xl py-3 pl-12 pr-4 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-on-surface"
                        placeholder="+1 650 555 1234"
                        required
                      />
                    </div>
                    <p className="text-[10px] text-on-surface-variant mt-2 px-1">Include country code (e.g., +1 for US/Canada, +1868 for TT)</p>
                  </div>
                  
                  <button disabled={isLoading} type="submit" className="w-full py-4 mt-2 bg-gradient-to-r from-primary to-secondary text-on-primary font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50">
                    {isLoading ? 'Loading...' : 'Send Code'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyCode} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-2">Verification Code</label>
                    <div className="relative">
                      <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                      <input 
                        type="text" 
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        className="w-full bg-surface-container-high border border-black/10 rounded-xl py-3 pl-12 pr-4 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-on-surface tracking-[0.5em] font-mono text-center"
                        placeholder="000000"
                        maxLength={6}
                        required
                      />
                    </div>
                  </div>
                  
                  <button disabled={isLoading} type="submit" className="w-full py-4 mt-2 bg-gradient-to-r from-primary to-secondary text-on-primary font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50">
                    {isLoading ? 'Loading...' : 'Verify Code'}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => { setConfirmationResult(null); setVerificationCode(''); }}
                    className="w-full py-2 mt-2 text-sm text-on-surface-variant hover:text-on-surface transition-colors"
                  >
                    Use a different number
                  </button>
                </form>
              )}
            </div>
          )}

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
            {/* Google Logo SVG */}
            <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg" className={isLoading ? "opacity-50" : ""}>
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            {isLoading ? 'Loading...' : 'Continue with Google'}
          </button>

          <p className="mt-8 text-center text-sm text-on-surface-variant">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-primary hover:text-primary-container font-bold transition-colors">Sign up</Link>
          </p>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen pt-24 md:pt-28 pb-20 px-6 flex justify-center items-center">
        <div className="text-on-surface-variant text-sm font-semibold tracking-widest uppercase animate-pulse">
          Loading...
        </div>
      </main>
    }>
      <LoginContent />
    </Suspense>
  );
}
