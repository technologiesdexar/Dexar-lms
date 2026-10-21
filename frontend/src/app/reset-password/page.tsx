'use client';

import React, { useState, useEffect, Suspense } from 'react';
import NextLink from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/services/api';
import {
  isFirebaseConfigured,
  sendFirebasePasswordReset,
  verifyFirebaseCode,
  confirmFirebaseReset,
} from '@/lib/firebase';
import {
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const tokenParam = searchParams.get('token') || '';
  const emailParam = searchParams.get('email') || '';
  const oobCodeParam = searchParams.get('oobCode') || searchParams.get('code') || '';
  const isFirstTimeParam = searchParams.get('firstTime') === 'true';

  // Form states
  const [token, setToken] = useState(tokenParam);
  const [email, setEmail] = useState(emailParam);
  const [oobCode, setOobCode] = useState(oobCodeParam);
  const [isFirstTime, setIsFirstTime] = useState(isFirstTimeParam);

  // Password fields
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Request link states (when token is missing or expired)
  const [requestEmail, setRequestEmail] = useState('');
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestSent, setRequestSent] = useState(false);

  // Status
  const [verifying, setVerifying] = useState(Boolean((tokenParam && emailParam) || oobCodeParam));
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [studentName, setStudentName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Verify token or Firebase oobCode on mount
  useEffect(() => {
    // 1. Check Firebase Auth oobCode if present in URL
    if (oobCodeParam) {
      setVerifying(true);
      verifyFirebaseCode(oobCodeParam)
        .then((userEmail) => {
          setTokenValid(true);
          if (userEmail) setEmail(userEmail);
          setOobCode(oobCodeParam);
        })
        .catch((err) => {
          console.warn('Firebase oobCode verification error:', err);
          // If Firebase check fails, check if tokenParam exists as fallback
          if (tokenParam && emailParam) {
            verifyDexarToken(tokenParam, emailParam);
          } else {
            setTokenValid(false);
            setError('This password reset link is invalid or has expired. Please request a new link.');
          }
        })
        .finally(() => {
          setVerifying(false);
        });
      return;
    }

    // 2. Check Dexar LMS token
    if (tokenParam && emailParam) {
      verifyDexarToken(tokenParam, emailParam);
    } else {
      setVerifying(false);
      setTokenValid(null);
    }
  }, [tokenParam, emailParam, oobCodeParam]);

  const verifyDexarToken = (t: string, e: string) => {
    setVerifying(true);
    api
      .verifyResetToken(t, e)
      .then((res: any) => {
        if (res.valid) {
          setTokenValid(true);
          setStudentName(res.name || '');
          if (res.isFirstTime) setIsFirstTime(true);
        } else {
          setTokenValid(false);
          setError(res.message || 'Password reset link is invalid or has expired.');
        }
      })
      .catch((err: any) => {
        console.error('Token verification error:', err);
        setTokenValid(false);
        setError('Unable to verify reset link. The link might be expired or already used.');
      })
      .finally(() => {
        setVerifying(false);
      });
  };

  // Handle setting/resetting password
  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify and try again.');
      return;
    }

    setLoading(true);

    try {
      // 1. If Firebase oobCode was used
      if (oobCode) {
        await confirmFirebaseReset(oobCode, password);
      }

      // 2. Always sync password with Dexar LMS backend so user can log in with Dexar credentials
      const res = await api.resetPassword({
        token: token || oobCode || 'firebase_reset',
        email,
        password,
      });

      if (res.success && res.token) {
        localStorage.setItem('dexar_token', res.token);
        if (res.user) {
          localStorage.setItem('dexar_user', JSON.stringify(res.user));
        }
        setSuccess(true);
        setTimeout(() => {
          router.push('/portal');
        }, 2000);
      } else if (oobCode) {
        // Firebase reset succeeded even if backend sync token differed
        setSuccess(true);
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else {
        setError(res.message || 'Failed to update password. Please try again.');
      }
    } catch (err: any) {
      console.error('Reset error:', err);
      // If Firebase succeeded, direct to login
      if (oobCode && !err?.code?.startsWith('auth/')) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else {
        setError(err.message || 'Error occurred while saving your password.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle requesting a new link
  const handleRequestLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestEmail || !requestEmail.trim()) {
      setError('Please enter your registered email address.');
      return;
    }

    const cleanEmail = requestEmail.trim().toLowerCase();
    setRequestLoading(true);
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
        setRequestSent(true);
      } else if (lmsErrorMessage && lmsErrorMessage.toLowerCase().includes('not exist')) {
        setError('No registered user account found with this email. Please check your spelling or contact your administrator.');
      } else {
        setRequestSent(true);
      }
    } catch (err: any) {
      console.error('Request link submission error:', err);
      if (fbDispatched || lmsDispatched) {
        setRequestSent(true);
      } else {
        setError('Could not dispatch password setup link. Please try again or contact support.');
      }
    } finally {
      setRequestLoading(false);
    }
  };


  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#f8fafc] p-4 sm:p-6 md:p-10 text-[#0f172a] antialiased">
      <div className="w-full max-w-md">
        {/* Centered Logo Outside the Box on Top */}
        <div className="flex justify-center mb-6">
          <NextLink href="/" className="inline-block group">
            <img
              src="/images/dexar-logo-clean.png"
              alt="Dexar Technologies"
              className="h-10 w-auto object-contain transition-transform duration-200 group-hover:scale-105"
            />
          </NextLink>
        </div>

        <div className="overflow-hidden p-0 border-0 shadow-none rounded-2xl bg-white">
          <div className="p-6 sm:p-8 lg:p-9 flex flex-col justify-between">
            {/* Title */}
            <div className="flex flex-col items-center text-center mb-6">
              {verifying ? (
                <>
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0a2540]">
                    Validating Link...
                  </h1>
                  <p className="text-xs text-slate-500 mt-1">
                    Verifying your account details
                  </p>
                </>
              ) : success ? (
                <>
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0a2540]">
                    Password Saved!
                  </h1>
                  <p className="text-xs text-slate-500 mt-1">
                    Logging you in to Dexar LMS Learning Portal...
                  </p>
                </>
              ) : tokenValid === true ? (
                <>
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0a2540]">
                    {isFirstTime ? 'Set Your Password' : 'Reset Your Password'}
                  </h1>
                  <p className="text-xs text-slate-500 mt-1">
                    {studentName ? `Welcome, ${studentName}! ` : ''}
                    {isFirstTime
                      ? 'Create your password to activate your student account'
                      : 'Choose a strong password for your account'}
                  </p>
                </>
              ) : (
                <>
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0a2540]">
                    Dexar LMS — Password Reset
                  </h1>
                  <p className="text-xs text-slate-500 mt-1">
                    Enter your registered email to receive a secure setup link
                  </p>
                </>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* SUCCESS STATE */}
            {success && (
              <div className="text-center py-4 space-y-4">
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs text-left">
                  <p className="font-semibold mb-1">✓ Account Ready & Secured</p>
                  <p className="text-emerald-700">
                    Your password has been successfully established. You will be redirected to your courses automatically in a few seconds.
                  </p>
                </div>
                <NextLink
                  href="/portal"
                  className="w-full inline-flex items-center justify-center gap-2 h-12 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-semibold text-sm rounded-xl shadow-md transition-all"
                >
                  <span>Go to Learning Portal Now</span>
                  <ArrowRight className="w-4 h-4" />
                </NextLink>
              </div>
            )}

            {/* TOKEN VALID: ENTER NEW PASSWORD FORM */}
            {!success && !verifying && tokenValid === true && (
              <form onSubmit={handleResetSubmit} className="space-y-4.5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Account Email
                  </label>
                  <input
                    type="email"
                    disabled
                    value={email}
                    className="w-full h-11 text-xs px-3.5 rounded-xl bg-slate-100/70 border border-slate-200 text-slate-500 cursor-not-allowed"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimum 6 characters..."
                      className="w-full h-12 text-sm px-3.5 pr-10 rounded-xl bg-slate-50/50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password..."
                      className="w-full h-12 text-sm px-3.5 pr-10 rounded-xl bg-slate-50/50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20"
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

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-semibold text-sm rounded-xl shadow-md transition-all mt-3 gap-2 flex items-center justify-center cursor-pointer disabled:opacity-60"
                >
                  {loading ? (
                    <span>Saving Password...</span>
                  ) : (
                    <>
                      <span>{isFirstTime ? 'Set Password & Enter Portal' : 'Update Password & Sign In'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* TOKEN INVALID OR MISSING: REQUEST LINK FORM */}
            {!success && !verifying && tokenValid !== true && (
              <div>
                {requestSent ? (
                  <div className="text-center py-3 space-y-4">
                    <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs text-left">
                      <p className="font-semibold mb-1">📩 Password Link Dispatched</p>
                      <p className="text-blue-700 leading-relaxed">
                        A setup and password reset link has been dispatched to <strong className="text-blue-900">{requestEmail.trim().toLowerCase()}</strong>.
                        Please check your inbox and spam folder and click the link to continue.
                      </p>
                    </div>

                    <div className="pt-2 flex flex-col gap-2">
                      <NextLink
                        href="/login"
                        className="w-full h-11 bg-slate-900 hover:bg-black text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Return to Login</span>
                      </NextLink>
                      <button
                        type="button"
                        onClick={() => {
                          setRequestSent(false);
                        }}
                        className="text-xs text-slate-500 hover:text-slate-800 py-1"
                      >
                        Try another email address
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleRequestLink} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">
                        Registered Email Address
                      </label>
                      <input
                        type="email"
                        required
                        value={requestEmail}
                        onChange={(e) => setRequestEmail(e.target.value)}
                        placeholder="your.email@example.com"
                        className="w-full h-12 text-sm px-3.5 rounded-xl bg-slate-50/50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={requestLoading}
                      className="w-full h-12 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-semibold text-sm rounded-xl shadow-md transition-all gap-2 flex items-center justify-center cursor-pointer disabled:opacity-60"
                    >
                      {requestLoading ? (
                        <span>Sending Link...</span>
                      ) : (
                        <>
                          <span>Send Password Setup Link</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>

                    <div className="pt-2 text-center">
                      <NextLink
                        href="/login"
                        className="inline-flex items-center justify-center gap-1.5 text-xs font-medium text-slate-500 hover:text-[#2563eb] transition-colors py-1.5 px-3 rounded-lg hover:bg-slate-50"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Back to Login</span>
                      </NextLink>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>

        <p className="px-6 text-center text-xs text-slate-500 mt-6">
          Need help accessing your courses? Contact{' '}
          <a href="mailto:support@dexartechnologies.in" className="underline hover:text-slate-800">
            Dexar LMS Support
          </a>
        </p>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#f8fafc]">
          <div className="text-sm text-slate-500 animate-pulse">Loading password reset portal...</div>
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
