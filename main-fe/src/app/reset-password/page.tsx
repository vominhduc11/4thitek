'use client';

import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { API_BASE_URL } from '@/constants/api';

type ApiResponse<T> = {
    success?: boolean;
    data?: T;
    error?: string | null;
};

const genericRequestMessage =
    'If the email exists in our system, a password reset link has been sent.';

function ResetPasswordContent() {
    const searchParams = useSearchParams();
    const token = searchParams.get('token')?.trim() ?? '';
    const requestedEmail = searchParams.get('email')?.trim() ?? '';

    const [email, setEmail] = useState(requestedEmail);
    const [requestStatus, setRequestStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
    const [requestMessage, setRequestMessage] = useState('');
    const [tokenStatus, setTokenStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>(token ? 'checking' : 'idle');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [resetStatus, setResetStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
    const [resetMessage, setResetMessage] = useState('');

    useEffect(() => {
        setEmail(requestedEmail);
    }, [requestedEmail]);

    useEffect(() => {
        let ignore = false;

        if (!token) {
            setTokenStatus('idle');
            return () => {
                ignore = true;
            };
        }

        const validateToken = async () => {
            setTokenStatus('checking');
            setResetMessage('');

            try {
                const response = await fetch(
                    `${API_BASE_URL}/auth/reset-password/validate?token=${encodeURIComponent(token)}`,
                    {
                        method: 'GET',
                        cache: 'no-store'
                    }
                );

                const payload = (await response.json().catch(() => null)) as ApiResponse<{ valid?: boolean }> | null;
                const isValid = Boolean(payload?.success && payload.data?.valid);

                if (!ignore) {
                    setTokenStatus(isValid ? 'valid' : 'invalid');
                    if (!isValid) {
                        setResetMessage(payload?.error?.trim() || 'This reset link is invalid or has expired.');
                    }
                }
            } catch {
                if (!ignore) {
                    setTokenStatus('invalid');
                    setResetMessage('Could not validate the reset link right now.');
                }
            }
        };

        void validateToken();

        return () => {
            ignore = true;
        };
    }, [token]);

    const handleRequestReset = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const trimmedEmail = email.trim();
        if (!trimmedEmail) {
            setRequestStatus('error');
            setRequestMessage('Please enter the email address for your account.');
            return;
        }

        setRequestStatus('submitting');
        setRequestMessage('');

        try {
            const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: trimmedEmail
                })
            });

            const payload = (await response.json().catch(() => null)) as ApiResponse<string> | null;

            if (!response.ok || payload?.success === false) {
                setRequestStatus('error');
                setRequestMessage(payload?.error?.trim() || 'Could not send the reset email.');
                return;
            }

            setRequestStatus('success');
            setRequestMessage(payload?.data?.trim() || genericRequestMessage);
        } catch {
            setRequestStatus('error');
            setRequestMessage('Could not send the reset email.');
        }
    };

    const handleResetPassword = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const nextPassword = password.trim();
        const nextConfirmPassword = confirmPassword.trim();

        if (nextPassword.length < 6) {
            setResetStatus('error');
            setResetMessage('New password must be at least 6 characters.');
            return;
        }

        if (nextPassword !== nextConfirmPassword) {
            setResetStatus('error');
            setResetMessage('Password confirmation does not match.');
            return;
        }

        setResetStatus('submitting');
        setResetMessage('');

        try {
            const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    token,
                    newPassword: nextPassword
                })
            });

            const payload = (await response.json().catch(() => null)) as ApiResponse<string> | null;

            if (!response.ok || payload?.success === false) {
                setResetStatus('error');
                setResetMessage(payload?.error?.trim() || 'Could not reset the password.');
                return;
            }

            setResetStatus('success');
            setResetMessage(payload?.data?.trim() || 'Password reset successful.');
            setPassword('');
            setConfirmPassword('');
        } catch {
            setResetStatus('error');
            setResetMessage('Could not reset the password.');
        }
    };

    return (
        <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(0,212,255,0.18),_rgba(12,19,29,0.96)_42%,_#05070b_100%)] text-white">
            <div className="ml-0 sm:ml-20 flex min-h-screen items-center px-4 py-16 sm:px-6 md:px-8 lg:px-12">
                <div className="grid w-full max-w-6xl gap-8 lg:grid-cols-[1.05fr_0.95fr]">
                    <section className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-[0_24px_90px_rgba(0,0,0,0.35)] backdrop-blur">
                        <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">4ThiTek Account</p>
                        <h1 className="mt-4 text-4xl font-semibold leading-tight sm:text-5xl">
                            Dat lai mat khau
                            <span className="block text-slate-300">Reset password</span>
                        </h1>
                        <p className="mt-6 max-w-xl text-base leading-7 text-slate-300">
                            Request a reset email, then open the link we send you to set a new password.
                            The link is valid for 30 minutes.
                        </p>

                        <div className="mt-10 grid gap-4 sm:grid-cols-3">
                            <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4">
                                <p className="text-sm font-semibold text-cyan-200">1. Request</p>
                                <p className="mt-2 text-sm leading-6 text-slate-300">
                                    Enter the email used for your dealer or staff account.
                                </p>
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                                <p className="text-sm font-semibold text-white">2. Open email</p>
                                <p className="mt-2 text-sm leading-6 text-slate-300">
                                    Use the reset link from your inbox or spam folder.
                                </p>
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                                <p className="text-sm font-semibold text-white">3. Set password</p>
                                <p className="mt-2 text-sm leading-6 text-slate-300">
                                    Choose a new password and sign in again from the app or website.
                                </p>
                            </div>
                        </div>
                    </section>

                    <section className="rounded-[2rem] border border-white/10 bg-[#111827]/90 p-8 shadow-[0_24px_90px_rgba(0,0,0,0.35)]">
                        {!token && (
                            <>
                                <p className="text-sm uppercase tracking-[0.28em] text-cyan-300">Request Reset Link</p>
                                <h2 className="mt-4 text-2xl font-semibold text-white">Send reset email</h2>
                                <p className="mt-3 text-sm leading-6 text-slate-400">
                                    We will send a secure reset link if the address exists in our system.
                                </p>

                                <form onSubmit={handleRequestReset} className="mt-8 space-y-5">
                                    <div>
                                        <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-200">
                                            Email
                                        </label>
                                        <input
                                            id="email"
                                            type="email"
                                            value={email}
                                            onChange={(event) => setEmail(event.target.value)}
                                            placeholder="name@example.com"
                                            className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
                                            autoComplete="email"
                                            required
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={requestStatus === 'submitting'}
                                        className="w-full rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {requestStatus === 'submitting' ? 'Sending...' : 'Send reset link'}
                                    </button>
                                </form>

                                {requestMessage && (
                                    <div
                                        className={`mt-5 rounded-2xl border px-4 py-3 text-sm leading-6 ${
                                            requestStatus === 'success'
                                                ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-100'
                                                : 'border-rose-400/30 bg-rose-400/10 text-rose-100'
                                        }`}
                                    >
                                        {requestMessage}
                                    </div>
                                )}
                            </>
                        )}

                        {token && (
                            <>
                                <p className="text-sm uppercase tracking-[0.28em] text-cyan-300">Set New Password</p>
                                <h2 className="mt-4 text-2xl font-semibold text-white">Complete reset</h2>
                                <p className="mt-3 text-sm leading-6 text-slate-400">
                                    This screen validates the email link before saving your new password.
                                </p>

                                {tokenStatus === 'checking' && (
                                    <div className="mt-8 rounded-2xl border border-white/10 bg-black/20 px-4 py-5 text-sm text-slate-300">
                                        Checking reset link...
                                    </div>
                                )}

                                {tokenStatus === 'invalid' && (
                                    <div className="mt-8 rounded-2xl border border-rose-400/30 bg-rose-400/10 px-4 py-5 text-sm text-rose-100">
                                        <p>{resetMessage || 'This reset link is invalid or has expired.'}</p>
                                        <Link href="/reset-password" className="mt-4 inline-flex text-sm font-semibold text-cyan-300 hover:text-cyan-200">
                                            Request a new link
                                        </Link>
                                    </div>
                                )}

                                {tokenStatus === 'valid' && resetStatus !== 'success' && (
                                    <form onSubmit={handleResetPassword} className="mt-8 space-y-5">
                                        <div>
                                            <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-200">
                                                New password
                                            </label>
                                            <input
                                                id="password"
                                                type="password"
                                                value={password}
                                                onChange={(event) => setPassword(event.target.value)}
                                                className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
                                                minLength={6}
                                                autoComplete="new-password"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label htmlFor="confirmPassword" className="mb-2 block text-sm font-medium text-slate-200">
                                                Confirm new password
                                            </label>
                                            <input
                                                id="confirmPassword"
                                                type="password"
                                                value={confirmPassword}
                                                onChange={(event) => setConfirmPassword(event.target.value)}
                                                className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
                                                minLength={6}
                                                autoComplete="new-password"
                                                required
                                            />
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={resetStatus === 'submitting'}
                                            className="w-full rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            {resetStatus === 'submitting' ? 'Saving...' : 'Save new password'}
                                        </button>
                                    </form>
                                )}

                                {resetMessage && tokenStatus === 'valid' && resetStatus !== 'success' && (
                                    <div
                                        className={`mt-5 rounded-2xl border px-4 py-3 text-sm leading-6 ${
                                            resetStatus === 'error'
                                                ? 'border-rose-400/30 bg-rose-400/10 text-rose-100'
                                                : 'border-white/10 bg-black/20 text-slate-300'
                                        }`}
                                    >
                                        {resetMessage}
                                    </div>
                                )}

                                {resetStatus === 'success' && (
                                    <div className="mt-8 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-5 text-sm text-emerald-100">
                                        <p>{resetMessage}</p>
                                        <div className="mt-4 flex flex-wrap gap-3">
                                            <Link
                                                href="/"
                                                className="inline-flex items-center rounded-full bg-cyan-400 px-4 py-2 font-semibold text-slate-950 transition hover:bg-cyan-300"
                                            >
                                                Back to homepage
                                            </Link>
                                            <Link
                                                href="/reset-password"
                                                className="inline-flex items-center rounded-full border border-white/15 px-4 py-2 font-semibold text-white transition hover:border-cyan-300 hover:text-cyan-200"
                                            >
                                                Request another link
                                            </Link>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </section>
                </div>
            </div>
        </div>
    );
}

function ResetPasswordFallback() {
    return (
        <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(0,212,255,0.18),_rgba(12,19,29,0.96)_42%,_#05070b_100%)] text-white">
            <div className="ml-0 sm:ml-20 flex min-h-screen items-center justify-center px-4 py-16 sm:px-6 md:px-8 lg:px-12">
                <div className="rounded-3xl border border-white/10 bg-[#111827]/80 px-8 py-10 text-center shadow-[0_24px_90px_rgba(0,0,0,0.35)]">
                    <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-cyan-300"></div>
                    <p className="mt-4 text-sm text-slate-300">Loading reset form...</p>
                </div>
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<ResetPasswordFallback />}>
            <ResetPasswordContent />
        </Suspense>
    );
}
