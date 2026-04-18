'use client';

import Link from 'next/link';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { API_BASE_URL } from '@/constants/api';

type ApiResponse<T> = {
    success?: boolean;
    data?: T;
    error?: string | null;
};

type TokenValidationPayload = {
    valid?: boolean;
    status?: string;
    message?: string;
};

type RequestStatus = 'idle' | 'submitting' | 'success' | 'error';
type TokenStatus = 'idle' | 'checking' | 'valid' | 'invalid' | 'expired';
type ResetStatus = 'idle' | 'submitting' | 'success' | 'error';

const actionButtonClass =
    'inline-flex h-12 items-center justify-center rounded-full px-5 text-sm font-semibold uppercase tracking-[0.08em] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-blue)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#06111B] disabled:cursor-not-allowed disabled:opacity-60';

const genericRequestMessage =
    'Nếu email tồn tại trong hệ thống, chúng tôi đã gửi liên kết đặt lại mật khẩu tới hộp thư của bạn.';

function ResetPasswordContent() {
    const searchParams = useSearchParams();
    const token = searchParams.get('token')?.trim() ?? '';
    const requestedEmail = searchParams.get('email')?.trim() ?? '';

    const [email, setEmail] = useState(requestedEmail);
    const [requestStatus, setRequestStatus] = useState<RequestStatus>('idle');
    const [requestMessage, setRequestMessage] = useState('');
    const [tokenStatus, setTokenStatus] = useState<TokenStatus>(token ? 'checking' : 'idle');
    const [tokenMessage, setTokenMessage] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [resetStatus, setResetStatus] = useState<ResetStatus>('idle');
    const [resetMessage, setResetMessage] = useState('');
    const [validationNonce, setValidationNonce] = useState(0);

    useEffect(() => {
        setEmail(requestedEmail);
    }, [requestedEmail]);

    useEffect(() => {
        let ignore = false;

        if (!token) {
            setTokenStatus('idle');
            setTokenMessage('');
            return () => {
                ignore = true;
            };
        }

        const validateToken = async () => {
            setTokenStatus('checking');
            setTokenMessage('Đang kiểm tra liên kết đặt lại mật khẩu...');
            setResetStatus('idle');
            setResetMessage('');

            try {
                const response = await fetch(
                    `${API_BASE_URL}/auth/reset-password/validate?token=${encodeURIComponent(token)}`,
                    {
                        method: 'GET',
                        cache: 'no-store'
                    }
                );

                const payload = (await response.json().catch(() => null)) as ApiResponse<TokenValidationPayload> | null;
                const validationStatus = payload?.data?.status?.trim() || 'invalid';
                const isValid = Boolean(payload?.success && payload.data?.valid);

                if (ignore) {
                    return;
                }

                setTokenStatus(
                    isValid ? 'valid' : validationStatus === 'expired' ? 'expired' : 'invalid'
                );
                setTokenMessage(
                    payload?.data?.message?.trim() ||
                        (isValid
                            ? 'Liên kết hợp lệ. Bạn có thể đặt mật khẩu mới ngay bây giờ.'
                            : validationStatus === 'expired'
                              ? 'Liên kết đã hết hạn. Vui lòng yêu cầu email mới.'
                              : 'Liên kết không hợp lệ.')
                );
            } catch {
                if (!ignore) {
                    setTokenStatus('invalid');
                    setTokenMessage('Không thể xác thực liên kết lúc này. Vui lòng yêu cầu liên kết mới.');
                }
            }
        };

        void validateToken();

        return () => {
            ignore = true;
        };
    }, [token, validationNonce]);

    const isResetFormDisabled = useMemo(
        () => tokenStatus !== 'valid' || resetStatus === 'submitting',
        [tokenStatus, resetStatus]
    );

    const handleRequestReset = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const trimmedEmail = email.trim();
        if (!trimmedEmail) {
            setRequestStatus('error');
            setRequestMessage('Vui lòng nhập email tài khoản cần đặt lại mật khẩu.');
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
                body: JSON.stringify({ email: trimmedEmail })
            });

            const payload = (await response.json().catch(() => null)) as ApiResponse<string> | null;
            if (!response.ok || payload?.success === false) {
                setRequestStatus('error');
                setRequestMessage(payload?.error?.trim() || 'Không thể gửi email đặt lại mật khẩu.');
                return;
            }

            setRequestStatus('success');
            setRequestMessage(payload?.data?.trim() || genericRequestMessage);
        } catch {
            setRequestStatus('error');
            setRequestMessage('Không thể gửi email đặt lại mật khẩu.');
        }
    };

    const handleResetPassword = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const nextPassword = password.trim();
        const nextConfirmPassword = confirmPassword.trim();

        if (nextPassword.length < 8) {
            setResetStatus('error');
            setResetMessage('Mật khẩu mới phải có ít nhất 8 ký tự.');
            return;
        }

        if (nextPassword !== nextConfirmPassword) {
            setResetStatus('error');
            setResetMessage('Mật khẩu xác nhận chưa khớp.');
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
                const normalizedError = payload?.error?.trim() || 'Không thể đặt lại mật khẩu.';
                if (/expired/i.test(normalizedError)) {
                    setTokenStatus('expired');
                } else if (/invalid/i.test(normalizedError)) {
                    setTokenStatus('invalid');
                }
                setResetStatus('error');
                setResetMessage(normalizedError);
                return;
            }

            setResetStatus('success');
            setResetMessage(payload?.data?.trim() || 'Đặt lại mật khẩu thành công.');
            setPassword('');
            setConfirmPassword('');
        } catch {
            setResetStatus('error');
            setResetMessage('Không thể đặt lại mật khẩu.');
        }
    };

    return (
        <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,rgba(41,171,226,0.2),rgba(6,17,27,0.94)_42%,#03070d_100%)] text-white">
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute inset-0 bg-topo opacity-35" />
                <div className="absolute left-[-8rem] top-20 h-72 w-72 rounded-full bg-[rgba(41,171,226,0.14)] blur-3xl" />
                <div className="absolute bottom-12 right-[-6rem] h-80 w-80 rounded-full bg-[rgba(0,113,188,0.16)] blur-3xl" />
            </div>

            <div className="ml-0 flex min-h-screen items-center py-16 sm:ml-16 md:ml-20">
                <div className="brand-shell">
                    <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
                        <section className="brand-card rounded-[2rem] p-8 lg:p-10">
                            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-[var(--brand-blue)]">
                                4T HITEK Public Account Recovery
                            </p>
                            <h1 className="mt-4 font-serif text-4xl font-semibold leading-tight text-[var(--text-primary)] sm:text-5xl">
                                Đặt lại mật khẩu
                            </h1>
                            <p className="mt-6 max-w-xl text-base leading-7 text-[var(--text-secondary)]">
                                Đây là trang chính thức để hoàn tất đặt lại mật khẩu cho tài khoản public, dealer và
                                tài khoản chung. Tài khoản admin và staff dùng trang reset riêng trong admin portal.
                            </p>

                            <div className="mt-10 grid gap-4 sm:grid-cols-3">
                                <StepCard
                                    title="1. Yêu cầu liên kết"
                                    body="Nhập email tài khoản public, dealer hoặc tài khoản chung để hệ thống gửi liên kết đặt lại mật khẩu."
                                    emphasis
                                />
                                <StepCard
                                    title="2. Mở email"
                                    body="Kiểm tra hộp thư đến hoặc spam và mở liên kết trong vòng 30 phút."
                                />
                                <StepCard
                                    title="3. Đặt mật khẩu mới"
                                    body="Xác thực token, lưu mật khẩu mới, rồi đăng nhập lại trên web hoặc ứng dụng."
                                />
                            </div>
                        </section>

                        <section className="brand-card rounded-[2rem] p-8 lg:p-10">
                            {!token ? (
                                <>
                                    <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[var(--brand-blue)]">
                                        Yêu cầu liên kết
                                    </p>
                                    <h2 className="mt-4 font-serif text-3xl font-semibold text-[var(--text-primary)]">
                                        Gửi email đặt lại mật khẩu
                                    </h2>
                                    <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
                                        Liên kết đặt lại mật khẩu sẽ được gửi nếu email tồn tại trong hệ thống. Trang này
                                        dành cho public/dealer/general accounts, không dùng cho admin/staff.
                                    </p>

                                    <form onSubmit={handleRequestReset} className="mt-8 space-y-5">
                                        <label className="block text-sm font-medium text-[var(--text-primary)]">
                                            Email tài khoản
                                            <Input
                                                id="email"
                                                type="email"
                                                value={email}
                                                onChange={(event) => setEmail(event.target.value)}
                                                placeholder="name@example.com"
                                                className="mt-2 rounded-[1.25rem]"
                                                autoComplete="email"
                                            />
                                        </label>

                                        <button
                                            type="submit"
                                            className={`${actionButtonClass} w-full bg-[var(--brand-blue)] text-[#041521] hover:brightness-110`}
                                            disabled={requestStatus === 'submitting'}
                                        >
                                            {requestStatus === 'submitting' ? 'Đang gửi...' : 'Gửi liên kết đặt lại'}
                                        </button>
                                    </form>

                                    {requestMessage ? (
                                        <StatusPanel
                                            tone={requestStatus === 'success' ? 'success' : 'error'}
                                            title={requestStatus === 'success' ? 'Đã ghi nhận yêu cầu' : 'Không thể gửi yêu cầu'}
                                            message={requestMessage}
                                        />
                                    ) : null}
                                </>
                            ) : (
                                <>
                                    <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[var(--brand-blue)]">
                                        Hoàn tất đặt lại mật khẩu
                                    </p>
                                    <h2 className="mt-4 font-serif text-3xl font-semibold text-[var(--text-primary)]">
                                        Xác thực liên kết và lưu mật khẩu mới
                                    </h2>
                                    <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
                                        Liên kết trong email sẽ được xác thực trước khi bạn lưu mật khẩu mới cho tài khoản
                                        public/dealer/general. Admin và staff dùng trang reset riêng trong admin portal.
                                    </p>

                                    <StatusPanel
                                        tone={
                                            tokenStatus === 'valid'
                                                ? 'success'
                                                : tokenStatus === 'checking'
                                                  ? 'neutral'
                                                  : tokenStatus === 'expired'
                                                    ? 'warning'
                                                  : 'warning'
                                        }
                                        title={
                                            tokenStatus === 'valid'
                                                ? 'Liên kết hợp lệ'
                                                : tokenStatus === 'checking'
                                                  ? 'Đang xác thực liên kết'
                                                  : tokenStatus === 'expired'
                                                    ? 'Liên kết đã hết hạn'
                                                    : 'Liên kết không hợp lệ'
                                        }
                                        message={tokenMessage}
                                    />

                                    {tokenStatus === 'valid' ? (
                                        <form onSubmit={handleResetPassword} className="mt-6 space-y-5">
                                            <label className="block text-sm font-medium text-[var(--text-primary)]">
                                                Mật khẩu mới
                                                <Input
                                                    type="password"
                                                    value={password}
                                                    onChange={(event) => setPassword(event.target.value)}
                                                    placeholder="Tối thiểu 8 ký tự"
                                                    className="mt-2 rounded-[1.25rem]"
                                                    autoComplete="new-password"
                                                    disabled={isResetFormDisabled}
                                                />
                                            </label>

                                            <label className="block text-sm font-medium text-[var(--text-primary)]">
                                                Xác nhận mật khẩu mới
                                                <Input
                                                    type="password"
                                                    value={confirmPassword}
                                                    onChange={(event) => setConfirmPassword(event.target.value)}
                                                    placeholder="Nhập lại mật khẩu mới"
                                                    className="mt-2 rounded-[1.25rem]"
                                                    autoComplete="new-password"
                                                    disabled={isResetFormDisabled}
                                                />
                                            </label>

                                            <button
                                                type="submit"
                                                className={`${actionButtonClass} w-full bg-[var(--brand-blue)] text-[#041521] hover:brightness-110`}
                                                disabled={isResetFormDisabled}
                                            >
                                                {resetStatus === 'submitting' ? 'Đang lưu...' : 'Lưu mật khẩu mới'}
                                            </button>
                                        </form>
                                    ) : null}

                                    {resetMessage ? (
                                        <StatusPanel
                                            tone={resetStatus === 'success' ? 'success' : 'error'}
                                            title={resetStatus === 'success' ? 'Đặt lại mật khẩu thành công' : 'Không thể đặt lại mật khẩu'}
                                            message={resetMessage}
                                        />
                                    ) : null}
                                </>
                            )}

                            <div className="mt-8 flex flex-wrap gap-3">
                                <Link
                                    href="/"
                                    className={`${actionButtonClass} border border-[var(--brand-border)] bg-transparent text-[var(--text-primary)] hover:bg-[rgba(255,255,255,0.06)]`}
                                >
                                    Về trang chủ
                                </Link>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setRequestStatus('idle');
                                        setRequestMessage('');
                                        setTokenStatus(token ? 'checking' : 'idle');
                                        setTokenMessage('');
                                        setResetStatus('idle');
                                        setResetMessage('');
                                        if (token) {
                                            setValidationNonce((current) => current + 1);
                                        }
                                    }}
                                    className={`${actionButtonClass} border border-[var(--brand-border)] bg-transparent text-[var(--text-primary)] hover:bg-[rgba(255,255,255,0.06)]`}
                                >
                                    Làm mới trạng thái
                                </button>
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StepCard({
    title,
    body,
    emphasis = false
}: {
    title: string;
    body: string;
    emphasis?: boolean;
}) {
    return (
        <div
            className={`rounded-[1.5rem] border p-4 ${
                emphasis
                    ? 'border-[var(--brand-border-strong)] bg-[rgba(41,171,226,0.12)]'
                    : 'border-[var(--brand-border)] bg-[rgba(7,17,27,0.62)]'
            }`}
        >
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--text-primary)]">{title}</p>
            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{body}</p>
        </div>
    );
}

function StatusPanel({
    tone,
    title,
    message
}: {
    tone: 'success' | 'error' | 'warning' | 'neutral';
    title: string;
    message: string;
}) {
    const toneClass = {
        success: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-100',
        error: 'border-rose-400/30 bg-rose-400/10 text-rose-100',
        warning: 'border-amber-400/30 bg-amber-400/10 text-amber-100',
        neutral: 'border-[var(--brand-border)] bg-[rgba(255,255,255,0.04)] text-[var(--text-secondary)]'
    }[tone];

    return (
        <div className={`mt-6 rounded-[1.5rem] border p-4 ${toneClass}`}>
            <p className="text-sm font-semibold uppercase tracking-[0.18em]">{title}</p>
            <p className="mt-2 text-sm leading-6">{message}</p>
        </div>
    );
}

function ResetPasswordFallback() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-[#06111B] text-white">
            <p className="text-sm text-[var(--text-secondary)]">Đang tải trang đặt lại mật khẩu...</p>
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

