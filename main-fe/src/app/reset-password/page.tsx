'use client';

import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { API_BASE_URL } from '@/constants/api';

type ApiResponse<T> = {
    success?: boolean;
    data?: T;
    error?: string | null;
};

const genericRequestMessage = 'If the email exists in our system, a password reset link has been sent.';

const actionButtonClass =
    'inline-flex h-12 items-center justify-center rounded-full px-5 text-sm font-semibold uppercase tracking-[0.08em] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-blue)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#06111B] disabled:cursor-not-allowed disabled:opacity-60';

function ResetPasswordContent() {
    const searchParams = useSearchParams();
    const token = searchParams.get('token')?.trim() ?? '';
    const requestedEmail = searchParams.get('email')?.trim() ?? '';

    const [email, setEmail] = useState(requestedEmail);
    const [requestStatus, setRequestStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
    const [requestMessage, setRequestMessage] = useState('');
    const [tokenStatus, setTokenStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>(
        token ? 'checking' : 'idle'
    );
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
        <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,rgba(41,171,226,0.2),rgba(6,17,27,0.94)_42%,#03070d_100%)] text-white">
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute inset-0 bg-topo opacity-35" />
                <div className="absolute left-[-8rem] top-20 h-72 w-72 rounded-full bg-[rgba(41,171,226,0.14)] blur-3xl" />
                <div className="absolute bottom-12 right-[-6rem] h-80 w-80 rounded-full bg-[rgba(0,113,188,0.16)] blur-3xl" />
            </div>

            <div className="ml-0 sm:ml-16 md:ml-20 flex min-h-screen items-center py-16">
                <div className="brand-shell">
                    <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
                        <section className="brand-card rounded-[2rem] p-8 lg:p-10">
                            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-[var(--brand-blue)]">
                                TK HiTek Account
                            </p>
                            <h1 className="mt-4 font-serif text-4xl font-semibold leading-tight text-[var(--text-primary)] sm:text-5xl">
                                Dat lai mat khau
                                <span className="mt-2 block font-sans text-xl font-medium text-[var(--text-secondary)] sm:text-2xl">
                                    Reset password
                                </span>
                            </h1>
                            <p className="mt-6 max-w-xl text-base leading-7 text-[var(--text-secondary)]">
                                Request a reset email, open the secure link, then set a new password without leaving the
                                TK HiTek flow.
                            </p>

                            <div className="mt-10 grid gap-4 sm:grid-cols-3">
                                <div className="rounded-[1.5rem] border border-[var(--brand-border-strong)] bg-[rgba(41,171,226,0.12)] p-4">
                                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--brand-blue)]">
                                        1. Request
                                    </p>
                                    <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                                        Enter the email used for your customer, dealer or staff account.
                                    </p>
                                </div>
                                <div className="rounded-[1.5rem] border border-[var(--brand-border)] bg-[rgba(7,17,27,0.62)] p-4">
                                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--text-primary)]">
                                        2. Open email
                                    </p>
                                    <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                                        Use the reset link from your inbox or spam folder within 30 minutes.
                                    </p>
                                </div>
                                <div className="rounded-[1.5rem] border border-[var(--brand-border)] bg-[rgba(7,17,27,0.62)] p-4">
                                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--text-primary)]">
                                        3. Set password
                                    </p>
                                    <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                                        Save a new password, then continue back to the app or website.
                                    </p>
                                </div>
                            </div>
                        </section>

                        <section className="brand-card rounded-[2rem] p-8 lg:p-10">
                            {!token && (
                                <>
                                    <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[var(--brand-blue)]">
                                        Request Reset Link
                                    </p>
                                    <h2 className="mt-4 font-serif text-3xl font-semibold text-[var(--text-primary)]">
                                        Send reset email
                                    </h2>
                                    <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
                                        We will send a secure reset link if the address exists in our system.
                                    </p>

                                    <form onSubmit={handleRequestReset} className="mt-8 space-y-5">
                                        <div>
                                            <label
                                                htmlFor="email"
                                                className="mb-2 block text-sm font-medium text-[var(--text-primary)]"
                                            >
                                                Email
                                            </label>
                                            <Input
                                                id="email"
                                                type="email"
                                                value={email}
                                                onChange={(event) => setEmail(event.target.value)}
                                                placeholder="name@example.com"
                                                className="rounded-[1.25rem]"
                                                autoComplete="email"
                                                required
                                            />
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={requestStatus === 'submitting'}
                                            className={`${actionButtonClass} brand-button-primary w-full text-[var(--text-primary)] hover:-translate-y-0.5 hover:brightness-105`}
                                        >
                                            {requestStatus === 'submitting' ? 'Sending...' : 'Send reset link'}
                                        </button>
                                    </form>

                                    {requestMessage && (
                                        <div
                                            className={`mt-5 rounded-[1.5rem] border px-4 py-4 text-sm leading-6 ${
                                                requestStatus === 'success'
                                                    ? 'border-[rgba(43,224,134,0.24)] bg-[rgba(43,224,134,0.1)] text-[#c9f8e0]'
                                                    : 'border-[rgba(239,95,120,0.24)] bg-[rgba(239,95,120,0.1)] text-[var(--destructive-text)]'
                                            }`}
                                        >
                                            {requestMessage}
                                        </div>
                                    )}
                                </>
                            )}

                            {token && (
                                <>
                                    <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[var(--brand-blue)]">
                                        Set New Password
                                    </p>
                                    <h2 className="mt-4 font-serif text-3xl font-semibold text-[var(--text-primary)]">
                                        Complete reset
                                    </h2>
                                    <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
                                        This screen validates the email link before saving your new password.
                                    </p>

                                    {tokenStatus === 'checking' && (
                                        <div className="mt-8 rounded-[1.5rem] border border-[var(--brand-border)] bg-[rgba(7,17,27,0.62)] px-4 py-5 text-sm text-[var(--text-secondary)]">
                                            Checking reset link...
                                        </div>
                                    )}

                                    {tokenStatus === 'invalid' && (
                                        <div className="mt-8 rounded-[1.5rem] border border-[rgba(239,95,120,0.24)] bg-[rgba(239,95,120,0.1)] px-4 py-5 text-sm text-[var(--destructive-text)]">
                                            <p>{resetMessage || 'This reset link is invalid or has expired.'}</p>
                                            <Link
                                                href="/reset-password"
                                                className="mt-4 inline-flex text-sm font-semibold text-[var(--brand-blue)] transition-colors hover:text-white"
                                            >
                                                Request a new link
                                            </Link>
                                        </div>
                                    )}

                                    {tokenStatus === 'valid' && resetStatus !== 'success' && (
                                        <form onSubmit={handleResetPassword} className="mt-8 space-y-5">
                                            <div>
                                                <label
                                                    htmlFor="password"
                                                    className="mb-2 block text-sm font-medium text-[var(--text-primary)]"
                                                >
                                                    New password
                                                </label>
                                                <Input
                                                    id="password"
                                                    type="password"
                                                    value={password}
                                                    onChange={(event) => setPassword(event.target.value)}
                                                    className="rounded-[1.25rem]"
                                                    minLength={6}
                                                    autoComplete="new-password"
                                                    required
                                                />
                                            </div>

                                            <div>
                                                <label
                                                    htmlFor="confirmPassword"
                                                    className="mb-2 block text-sm font-medium text-[var(--text-primary)]"
                                                >
                                                    Confirm new password
                                                </label>
                                                <Input
                                                    id="confirmPassword"
                                                    type="password"
                                                    value={confirmPassword}
                                                    onChange={(event) => setConfirmPassword(event.target.value)}
                                                    className="rounded-[1.25rem]"
                                                    minLength={6}
                                                    autoComplete="new-password"
                                                    required
                                                />
                                            </div>

                                            <button
                                                type="submit"
                                                disabled={resetStatus === 'submitting'}
                                                className={`${actionButtonClass} brand-button-primary w-full text-[var(--text-primary)] hover:-translate-y-0.5 hover:brightness-105`}
                                            >
                                                {resetStatus === 'submitting' ? 'Saving...' : 'Save new password'}
                                            </button>
                                        </form>
                                    )}

                                    {resetMessage && tokenStatus === 'valid' && resetStatus !== 'success' && (
                                        <div
                                            className={`mt-5 rounded-[1.5rem] border px-4 py-4 text-sm leading-6 ${
                                                resetStatus === 'error'
                                                    ? 'border-[rgba(239,95,120,0.24)] bg-[rgba(239,95,120,0.1)] text-[var(--destructive-text)]'
                                                    : 'border-[var(--brand-border)] bg-[rgba(7,17,27,0.62)] text-[var(--text-secondary)]'
                                            }`}
                                        >
                                            {resetMessage}
                                        </div>
                                    )}

                                    {resetStatus === 'success' && (
                                        <div className="mt-8 rounded-[1.5rem] border border-[rgba(43,224,134,0.24)] bg-[rgba(43,224,134,0.1)] px-4 py-5 text-sm text-[#c9f8e0]">
                                            <p>{resetMessage}</p>
                                            <div className="mt-4 flex flex-wrap gap-3">
                                                <Link
                                                    href="/"
                                                    className={`${actionButtonClass} brand-button-primary px-4 text-[var(--text-primary)] hover:-translate-y-0.5 hover:brightness-105`}
                                                >
                                                    Back to homepage
                                                </Link>
                                                <Link
                                                    href="/reset-password"
                                                    className={`${actionButtonClass} brand-button-secondary px-4 text-[var(--text-primary)] hover:-translate-y-0.5 hover:border-[var(--brand-blue)] hover:bg-[rgba(41,171,226,0.14)]`}
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
        </div>
    );
}

function ResetPasswordFallback() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,rgba(41,171,226,0.2),rgba(6,17,27,0.94)_42%,#03070d_100%)] px-4 text-white">
            <div className="brand-card rounded-[28px] px-8 py-10 text-center">
                <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-[var(--brand-blue)] border-t-transparent" />
                <p className="mt-4 text-sm text-[var(--text-secondary)]">Loading reset form...</p>
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
