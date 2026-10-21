'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
} from 'lucide-react';
import { api } from '@/services/api';
import { isFirebaseConfigured, sendFirebasePasswordReset } from '@/lib/firebase';

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  const router = useRouter();

  // Screen modes: 'login' | 'first-time-setup' | 'forgot'
  const [mode, setMode] = useState<'login' | 'first-time-setup' | 'forgot'>('login');

  // Standard Login fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // First-time Student Setup fields
  const [firstTimeData, setFirstTimeData] = useState<{ name: string; email: string } | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [setupLoading, setSetupLoading] = useState(false);

  // Forgot password fields
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);

  // Handle standard login submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.login({ email, password });

      // AUTOMATIC FIRST-TIME DETECTION:
      // If student was created by SuperAdmin without a password, automatically prompt for password setup
      if (res?.firstTimeSetup) {
        setFirstTimeData({
          name: res.name || 'Student',
          email: res.email || email,
        });
        setMode('first-time-setup');
        setLoading(false);
        return;
      }

      if (res?.token) {
        localStorage.setItem('dexar_token', res.token);
        localStorage.setItem('dexar_user', JSON.stringify(res.user));
        router.push('/portal');
      } else {
        setError(res?.message || res?.error || 'Invalid credentials. Please verify your email and password.');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
      if (isLocal) {
        setError('Connection error. Please ensure the Dexar backend server is running on port 5000.');
      } else {
        setError(err?.message || 'Connection error. The backend server may be waking up. Please retry in 10-15 seconds.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle in-place first-time password creation
  const handleFirstTimeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please verify and try again.');
      return;
    }

    setSetupLoading(true);

    try {
      const targetEmail = firstTimeData?.email || email;
      const res = await api.firstTimeSetPassword({
        email: targetEmail,
        password: newPassword,
      });

      if (res?.success && res?.token) {
        localStorage.setItem('dexar_token', res.token);
        if (res.user) {
          localStorage.setItem('dexar_user', JSON.stringify(res.user));
        }
        router.push('/portal');
      } else {
        setError(res?.message || 'Failed to establish password. Please try again.');
      }
    } catch (err: any) {
      console.error('First time setup error:', err);
      setError(err?.message || 'Network error occurred while saving your password.');
    } finally {
      setSetupLoading(false);
    }
  };

  // Handle forgot password request
  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;

    const cleanEmail = forgotEmail.trim().toLowerCase();
    setForgotLoading(true);
    setError('');

    const frontendOrigin =
      typeof window !== 'undefined' &&
      window.location.origin &&
      !window.location.origin.includes('localhost')
        ? window.location.origin
        : 'https://dexartechnologies.in';

    let fbDispatched = false;
    let lmsDispatched = false;
    let lmsErrorMessage = '';

    // 1. Concurrently run Firebase reset if configured
    const firebaseTask = (async () => {
      if (isFirebaseConfigured()) {
        try {
          await sendFirebasePasswordReset(cleanEmail, frontendOrigin);
          fbDispatched = true;
        } catch (fbErr: any) {
          console.warn('Firebase reset dispatch notice:', fbErr?.message || fbErr);
        }
      }
    })();

    // 2. Concurrently run Dexar LMS backend email service
    const lmsTask = (async () => {
      try {
        const res = await api.forgotPassword({
          email: cleanEmail,
          frontendUrl: frontendOrigin,
        });
        if (res && res.success) {
          lmsDispatched = true;
        } else {
          lmsErrorMessage = res?.message || '';
        }
      } catch (err: any) {
        console.warn('LMS forgot password dispatch error:', err?.message || err);
        lmsErrorMessage = err?.message || '';
      }
    })();

    // 3. Safety timeout promise (12s max) to guarantee the button never hangs on "Sending Link..."
    const timeoutTask = new Promise<void>((resolve) => setTimeout(resolve, 12000));

    try {
      await Promise.race([
        Promise.all([firebaseTask, lmsTask]),
        timeoutTask,
      ]);

      if (lmsDispatched || fbDispatched) {
        setForgotSuccess(true);
      } else if (lmsErrorMessage && lmsErrorMessage.toLowerCase().includes('not exist')) {
        setError('No account found with this email. Please check your spelling or contact your administrator.');
      } else {
        // Fallback: If both initiated or network is slow, display success notice so user checks their inbox
        setForgotSuccess(true);
      }
    } catch (err: any) {
      console.error('Forgot password submission error:', err);
      if (fbDispatched || lmsDispatched) {
        setForgotSuccess(true);
      } else {
        setError('Could not dispatch password reset link. Please try again or contact support.');
      }
    } finally {
      setForgotLoading(false);
    }
  };


  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      {/* Centered Logo Outside the Box on Top */}
      <div className="flex justify-center">
        <Link href="/" className="inline-block group">
          <Image
            src="/images/dexar-logo-clean.png"
            alt="Dexar Technologies"
            width={180}
            height={45}
            priority
            className="h-10 w-auto object-contain transition-transform duration-200 group-hover:scale-105"
          />
        </Link>
      </div>

      <Card className="overflow-hidden p-0 border-0 ring-0 shadow-none rounded-2xl bg-white">
        <CardContent className="p-6 sm:p-8 lg:p-9 flex flex-col justify-between">
          <div>
            {/* Centered Title */}
            <div className="flex flex-col items-center text-center mb-7">

              {mode === 'first-time-setup' ? (
                <>
                  <h1 className="text-2xl sm:text-[26px] font-bold tracking-tight text-[#0a2540]">
                    Welcome, {firstTimeData?.name || 'Student'}!
                  </h1>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm">
                    This is your first time signing in. Please set your password below to activate your account.
                  </p>
                </>
              ) : mode === 'forgot' ? (
                <>
                  <h1 className="text-2xl sm:text-[26px] font-bold tracking-tight text-[#0a2540]">
                    Reset Your Password
                  </h1>
                  <p className="text-xs text-slate-500 mt-1">
                    Enter your email address and we will dispatch a password reset link to your inbox
                  </p>
                </>
              ) : (
                <>
                  <h1 className="text-2xl sm:text-[26px] font-bold tracking-tight text-[#0a2540]">
                    Sign in to Portal
                  </h1>
                  <p className="text-xs text-slate-500 mt-1">
                    Access your Dexar LMS learning courses, live meetings, and coding arena
                  </p>
                </>
              )}
            </div>

            {/* Error Alert */}
            {error && (
              <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* ========================================================================= */}
            {/* VIEW 1: STANDARD SIGN IN */}
            {/* ========================================================================= */}
            {mode === 'login' && (
              <form onSubmit={handleSubmit} className="space-y-4.5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-semibold text-slate-700">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@dexar.com"
                    required
                    className="h-12 text-[15px] px-3.5 rounded-xl bg-slate-50/50 border-slate-200 focus-visible:ring-[#2563eb]"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-sm font-semibold text-slate-700">
                      Password
                    </Label>
                    <button
                      type="button"
                      onClick={() => {
                        setMode('forgot');
                        setForgotEmail(email);
                        setError('');
                        setForgotSuccess(false);
                      }}
                      className="text-xs font-semibold text-[#2563eb] hover:text-[#1d4ed8] hover:underline transition-colors cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="h-12 text-[15px] px-3.5 pr-11 rounded-xl bg-slate-50/50 border-slate-200 focus-visible:ring-[#2563eb]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1 cursor-pointer focus:outline-none"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-semibold text-[15px] rounded-xl shadow-md transition-all mt-2.5 gap-2 cursor-pointer"
                >
                  {loading ? (
                    <span>Verifying...</span>
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>

                {/* Back to Home */}
                <div className="pt-2 text-center">
                  <Link
                    href="/"
                    className="inline-flex items-center justify-center gap-1.5 text-xs font-medium text-slate-500 hover:text-[#2563eb] transition-colors py-1.5 px-3 rounded-lg hover:bg-slate-50"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Home</span>
                  </Link>
                </div>
              </form>
            )}

            {/* ========================================================================= */}
            {/* VIEW 2: AUTOMATIC FIRST-TIME STUDENT PASSWORD CREATION */}
            {/* ========================================================================= */}
            {mode === 'first-time-setup' && (
              <form onSubmit={handleFirstTimeSubmit} className="space-y-4.5">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">
                    Student Login ID
                  </Label>
                  <Input
                    type="email"
                    disabled
                    value={firstTimeData?.email || email}
                    className="h-11 text-xs px-3.5 rounded-xl bg-slate-100/70 border border-slate-200 text-slate-600 cursor-not-allowed"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="new-password" className="text-xs font-semibold text-slate-700">
                    Create Your Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 6 characters..."
                      className="h-12 text-sm px-3.5 pr-10 rounded-xl bg-slate-50/50 border border-slate-200 focus-visible:ring-[#2563eb]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confirm-password" className="text-xs font-semibold text-slate-700">
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter your password..."
                      className="h-12 text-sm px-3.5 pr-10 rounded-xl bg-slate-50/50 border border-slate-200 focus-visible:ring-[#2563eb]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={setupLoading}
                  className="w-full h-12 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-semibold text-[15px] rounded-xl shadow-md transition-all mt-2.5 gap-2 cursor-pointer"
                >
                  {setupLoading ? (
                    <span>Activating Account...</span>
                  ) : (
                    <>
                      <span>Set Password & Enter Portal</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>

                <div className="pt-1 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setError('');
                    }}
                    className="inline-flex items-center justify-center gap-1.5 text-xs font-medium text-slate-500 hover:text-[#2563eb] transition-colors py-1.5 px-3 rounded-lg hover:bg-slate-50 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Sign In</span>
                  </button>
                </div>
              </form>
            )}

            {/* ========================================================================= */}
            {/* VIEW 3: FORGOT PASSWORD REQUEST */}
            {/* ========================================================================= */}
            {mode === 'forgot' && (
              <div className="space-y-4">
                {forgotSuccess ? (
                  <div className="py-2 space-y-4 text-center">
                    <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs text-left">
                      <p className="font-semibold text-sm mb-1 text-blue-950">Password Link Dispatched!</p>
                      <p className="text-blue-800 leading-relaxed">
                        A password reset link has been dispatched to <strong className="text-blue-950">{forgotEmail.trim().toLowerCase()}</strong>. Please check your inbox and spam folder to set your new password.
                      </p>
                    </div>

                    <div className="pt-2 flex flex-col gap-2">
                      <Button
                        type="button"
                        onClick={() => {
                          setMode('login');
                          setForgotSuccess(false);
                        }}
                        className="w-full h-11 bg-slate-900 hover:bg-black text-white text-xs font-semibold rounded-xl"
                      >
                        <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
                        <span>Return to Sign In</span>
                      </Button>
                      <button
                        type="button"
                        onClick={() => setForgotSuccess(false)}
                        className="text-xs text-slate-500 hover:text-slate-800 py-1"
                      >
                        Try another email address
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleForgotSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="forgot-email" className="text-sm font-semibold text-slate-700">
                        Registered Email Address
                      </Label>
                      <Input
                        id="forgot-email"
                        type="email"
                        required
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="name@dexar.com"
                        className="h-12 text-[15px] px-3.5 rounded-xl bg-slate-50/50 border-slate-200 focus-visible:ring-[#2563eb]"
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={forgotLoading}
                      className="w-full h-12 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-semibold text-[15px] rounded-xl shadow-md transition-all gap-2 cursor-pointer"
                    >
                      {forgotLoading ? (
                        <span>Sending Link...</span>
                      ) : (
                        <>
                          <span>Send Password Reset Link</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </Button>

                    <div className="pt-2 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          setMode('login');
                          setError('');
                        }}
                        className="inline-flex items-center justify-center gap-1.5 text-xs font-medium text-slate-500 hover:text-[#2563eb] transition-colors py-1.5 px-3 rounded-lg hover:bg-slate-50 cursor-pointer"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Back to Sign In</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <p className="px-6 text-center text-xs text-slate-500">
        By logging in, you agree to Dexar&apos;s{' '}
        <Link href="#" className="underline hover:text-slate-800">Terms of Service</Link>{' '}
        and{' '}
        <Link href="#" className="underline hover:text-slate-800">Privacy Policy</Link>.
      </p>
    </div>
  );
}
