'use client';
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
    apiService,
    CustomerNotificationPayload,
    CustomerProfilePayload,
    CustomerWarrantySummaryPayload
} from '@/services/apiService';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useLoginModal } from '@/context/LoginModalContext';

const DEFAULT_PAGE_SIZE = 6;

const formatDate = (value: string | null | undefined, locale: string) => {
    if (!value) return '--';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '--';
    return new Intl.DateTimeFormat(locale, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    }).format(parsed);
};

const formatDateTime = (value: string | null | undefined, locale: string) => {
    if (!value) return '--';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '--';
    return new Intl.DateTimeFormat(locale, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(parsed);
};

const statusTone = (status: CustomerWarrantySummaryPayload['status']) => {
    switch (status) {
        case 'ACTIVE':
            return 'bg-emerald-500/15 text-emerald-300 border-emerald-400/40';
        case 'EXPIRED':
            return 'bg-amber-500/15 text-amber-300 border-amber-400/40';
        case 'VOID':
        default:
            return 'bg-rose-500/15 text-rose-300 border-rose-400/40';
    }
};

export default function AccountPage() {
    const { language, locale } = useLanguage();
    const { isAuthenticated, isHydrated, isLoading, getToken } = useAuth();
    const { openLoginModal } = useLoginModal();

    const [profile, setProfile] = useState<CustomerProfilePayload | null>(null);
    const [profileForm, setProfileForm] = useState({
        fullName: '',
        phone: '',
        email: ''
    });
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [warranties, setWarranties] = useState<CustomerWarrantySummaryPayload[]>([]);
    const [notifications, setNotifications] = useState<CustomerNotificationPayload[]>([]);
    const [warrantyPage, setWarrantyPage] = useState(0);
    const [notificationPage, setNotificationPage] = useState(0);
    const [warrantyTotalCount, setWarrantyTotalCount] = useState(0);
    const [warrantyTotalPages, setWarrantyTotalPages] = useState(1);
    const [notificationTotalPages, setNotificationTotalPages] = useState(1);
    const [loadingState, setLoadingState] = useState(true);
    const [profileSaving, setProfileSaving] = useState(false);
    const [passwordSaving, setPasswordSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const copy = useMemo(
        () =>
            language === 'vi'
                ? {
                      title: 'Tai khoan khach hang',
                      subtitle: 'Theo doi bao hanh, cap nhat thong tin va quan ly thong bao tren mot man hinh.',
                      signIn: 'Dang nhap de tiep tuc',
                      profile: 'Thong tin tai khoan',
                      fullName: 'Ho va ten',
                      phone: 'So dien thoai',
                      email: 'Email',
                      joinedAt: 'Ngay tao',
                      saveProfile: 'Luu thong tin',
                      password: 'Doi mat khau',
                      currentPassword: 'Mat khau hien tai',
                      newPassword: 'Mat khau moi',
                      confirmPassword: 'Xac nhan mat khau',
                      savePassword: 'Cap nhat mat khau',
                      warranties: 'Lich su bao hanh',
                      notifications: 'Thong bao',
                      active: 'Dang hieu luc',
                      expired: 'Da het han',
                      void: 'Khong hop le',
                      remainingDays: 'Ngay con lai',
                      serial: 'Serial',
                      dealer: 'Dai ly',
                      warrantyStart: 'Bat dau',
                      warrantyEnd: 'Ket thuc',
                      noWarranties: 'Chua co thong tin bao hanh.',
                      noNotifications: 'Chua co thong bao moi.',
                      read: 'Da doc',
                      unread: 'Chua doc',
                      markRead: 'Danh dau da doc',
                      markUnread: 'Danh dau chua doc',
                      markAllRead: 'Danh dau tat ca da doc',
                      previous: 'Trang truoc',
                      next: 'Trang sau',
                      supportCta: 'Can ho tro? Gui ticket cho doi van hanh.',
                      supportLink: 'Lien he 4ThiTek',
                      loadFailed: 'Khong the tai du lieu tai khoan.',
                      profileSaved: 'Da cap nhat thong tin tai khoan.',
                      passwordSaved: 'Da cap nhat mat khau.',
                      passwordMismatch: 'Mat khau moi va xac nhan mat khau khong khop.',
                      statsWarranty: 'Tong bao hanh',
                      statsActive: 'Bao hanh con hieu luc',
                      statsUnread: 'Thong bao chua doc'
                  }
                : {
                      title: 'Customer account',
                      subtitle: 'Track warranties, update profile details, and manage notifications in one place.',
                      signIn: 'Sign in to continue',
                      profile: 'Account profile',
                      fullName: 'Full name',
                      phone: 'Phone number',
                      email: 'Email',
                      joinedAt: 'Joined',
                      saveProfile: 'Save profile',
                      password: 'Change password',
                      currentPassword: 'Current password',
                      newPassword: 'New password',
                      confirmPassword: 'Confirm password',
                      savePassword: 'Update password',
                      warranties: 'Warranty history',
                      notifications: 'Notifications',
                      active: 'Active',
                      expired: 'Expired',
                      void: 'Void',
                      remainingDays: 'Days left',
                      serial: 'Serial',
                      dealer: 'Dealer',
                      warrantyStart: 'Start',
                      warrantyEnd: 'End',
                      noWarranties: 'No warranty records yet.',
                      noNotifications: 'No notifications yet.',
                      read: 'Read',
                      unread: 'Unread',
                      markRead: 'Mark as read',
                      markUnread: 'Mark as unread',
                      markAllRead: 'Mark all as read',
                      previous: 'Previous',
                      next: 'Next',
                      supportCta: 'Need support? Send a ticket to the operations team.',
                      supportLink: 'Contact support',
                      loadFailed: 'Unable to load account data.',
                      profileSaved: 'Profile updated.',
                      passwordSaved: 'Password updated.',
                      passwordMismatch: 'New password and confirmation do not match.',
                      statsWarranty: 'Total warranties',
                      statsActive: 'Active warranties',
                      statsUnread: 'Unread notifications'
                  },
        [language]
    );

    useEffect(() => {
        if (!isLoading && isHydrated && !isAuthenticated) {
            openLoginModal('/account');
        }
    }, [isAuthenticated, isHydrated, isLoading, openLoginModal]);

    useEffect(() => {
        const token = getToken();
        if (!token || !isAuthenticated) {
            return;
        }

        let isMounted = true;
        const load = async () => {
            try {
                setLoadingState(true);
                setError('');
                const [profileResponse, warrantyResponse, notificationResponse] = await Promise.all([
                    apiService.fetchCustomerProfile(token),
                    apiService.fetchCustomerWarrantiesPaged(token, { page: warrantyPage, size: DEFAULT_PAGE_SIZE }),
                    apiService.fetchCustomerNotificationsPaged(token, { page: notificationPage, size: DEFAULT_PAGE_SIZE })
                ]);

                if (!isMounted) {
                    return;
                }

                const nextProfile = profileResponse.data ?? null;
                setProfile(nextProfile);
                setProfileForm({
                    fullName: nextProfile?.fullName ?? '',
                    phone: nextProfile?.phone ?? '',
                    email: nextProfile?.email ?? ''
                });

                setWarranties(warrantyResponse.data?.items ?? []);
                setWarrantyTotalCount(warrantyResponse.data?.totalElements ?? 0);
                setWarrantyTotalPages(Math.max(1, warrantyResponse.data?.totalPages ?? 1));
                setNotifications(notificationResponse.data?.items ?? []);
                setNotificationTotalPages(Math.max(1, notificationResponse.data?.totalPages ?? 1));
            } catch {
                if (isMounted) {
                    setError(copy.loadFailed);
                }
            } finally {
                if (isMounted) {
                    setLoadingState(false);
                }
            }
        };

        load();
        return () => {
            isMounted = false;
        };
    }, [copy.loadFailed, getToken, isAuthenticated, notificationPage, warrantyPage]);

    const unreadCount = notifications.filter((item) => !item.isRead).length;
    const activeWarranties = warranties.filter((item) => item.status === 'ACTIVE').length;

    const handleProfileSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const token = getToken();
        if (!token) return;

        try {
            setProfileSaving(true);
            setMessage('');
            setError('');
            const response = await apiService.updateCustomerProfile(token, profileForm);
            const nextProfile = response.data ?? null;
            setProfile(nextProfile);
            if (nextProfile) {
                setProfileForm({
                    fullName: nextProfile.fullName ?? '',
                    phone: nextProfile.phone ?? '',
                    email: nextProfile.email ?? ''
                });
            }
            setMessage(copy.profileSaved);
        } catch (submitError) {
            setError(submitError instanceof Error ? submitError.message : copy.loadFailed);
        } finally {
            setProfileSaving(false);
        }
    };

    const handlePasswordSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const token = getToken();
        if (!token) return;

        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setError(copy.passwordMismatch);
            return;
        }

        try {
            setPasswordSaving(true);
            setMessage('');
            setError('');
            await apiService.changeCustomerPassword(token, {
                currentPassword: passwordForm.currentPassword,
                newPassword: passwordForm.newPassword
            });
            setPasswordForm({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });
            setMessage(copy.passwordSaved);
        } catch (submitError) {
            setError(submitError instanceof Error ? submitError.message : copy.loadFailed);
        } finally {
            setPasswordSaving(false);
        }
    };

    const handleNotificationToggle = async (notification: CustomerNotificationPayload) => {
        const token = getToken();
        if (!token) return;

        try {
            const response = notification.isRead
                ? await apiService.markCustomerNotificationUnread(token, notification.id)
                : await apiService.markCustomerNotificationRead(token, notification.id);
            const updated = response.data;
            setNotifications((current) =>
                current.map((item) => (item.id === updated?.id ? { ...item, ...updated } : item))
            );
        } catch (toggleError) {
            setError(toggleError instanceof Error ? toggleError.message : copy.loadFailed);
        }
    };

    const handleMarkAllRead = async () => {
        const token = getToken();
        if (!token) return;

        try {
            await apiService.markAllCustomerNotificationsRead(token);
            setNotifications((current) =>
                current.map((item) => ({
                    ...item,
                    isRead: true
                }))
            );
        } catch (markError) {
            setError(markError instanceof Error ? markError.message : copy.loadFailed);
        }
    };

    if (!isHydrated || isLoading || loadingState) {
        return (
            <div className="min-h-screen bg-[#0c131d] px-4 py-32 text-white sm:ml-20">
                <div className="mx-auto max-w-6xl animate-pulse space-y-6">
                    <div className="h-10 w-72 rounded bg-white/10" />
                    <div className="grid gap-6 lg:grid-cols-3">
                        <div className="h-56 rounded-3xl bg-white/10 lg:col-span-2" />
                        <div className="h-56 rounded-3xl bg-white/10" />
                    </div>
                    <div className="h-80 rounded-3xl bg-white/10" />
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-[#0c131d] px-4 py-32 text-white sm:ml-20">
                <div className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-white/5 p-10 text-center">
                    <h1 className="mb-4 text-3xl font-semibold">{copy.signIn}</h1>
                    <button
                        type="button"
                        onClick={() => openLoginModal('/account')}
                        className="rounded-full bg-cyan-400 px-6 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300"
                    >
                        {copy.signIn}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0c131d] px-4 pb-20 pt-28 text-white sm:ml-20 sm:px-8 lg:px-12">
            <div className="mx-auto max-w-7xl">
                <div className="mb-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300/80">
                            4ThiTek
                        </p>
                        <h1 className="text-3xl font-bold md:text-5xl">{copy.title}</h1>
                        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 md:text-base">
                            {copy.subtitle}
                        </p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                            <p className="text-xs uppercase tracking-[0.22em] text-slate-400">{copy.statsWarranty}</p>
                            <p className="mt-2 text-3xl font-semibold">{warrantyTotalCount}</p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                            <p className="text-xs uppercase tracking-[0.22em] text-slate-400">{copy.statsActive}</p>
                            <p className="mt-2 text-3xl font-semibold">{activeWarranties}</p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                            <p className="text-xs uppercase tracking-[0.22em] text-slate-400">{copy.statsUnread}</p>
                            <p className="mt-2 text-3xl font-semibold">{unreadCount}</p>
                        </div>
                    </div>
                </div>

                {(message || error) && (
                    <div
                        className={`mb-6 rounded-2xl border px-4 py-3 text-sm ${
                            error
                                ? 'border-rose-400/40 bg-rose-500/10 text-rose-200'
                                : 'border-emerald-400/40 bg-emerald-500/10 text-emerald-200'
                        }`}
                    >
                        {error || message}
                    </div>
                )}

                <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                    <div className="space-y-6">
                        <section className="rounded-[28px] border border-white/10 bg-[#101926]/85 p-6 shadow-[0_24px_80px_rgba(2,8,23,0.35)]">
                            <div className="mb-6 flex items-center gap-4">
                                <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/10">
                                    {profile?.avatarUrl ? (
                                        <img
                                            src={profile.avatarUrl}
                                            alt={profile.fullName || profile.email || 'Avatar'}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <span className="text-xl font-semibold text-cyan-200">
                                            {(profile?.fullName || profile?.email || 'U').slice(0, 1).toUpperCase()}
                                        </span>
                                    )}
                                </div>
                                <div>
                                    <h2 className="text-2xl font-semibold">{copy.profile}</h2>
                                    <p className="mt-1 text-sm text-slate-400">
                                        {copy.joinedAt}: {formatDate(profile?.createdAt, locale)}
                                    </p>
                                </div>
                            </div>

                            <form className="grid gap-4 md:grid-cols-2" onSubmit={handleProfileSubmit}>
                                <label className="block">
                                    <span className="mb-2 block text-sm text-slate-300">{copy.fullName}</span>
                                    <input
                                        value={profileForm.fullName}
                                        onChange={(event) =>
                                            setProfileForm((current) => ({ ...current, fullName: event.target.value }))
                                        }
                                        className="w-full rounded-2xl border border-white/10 bg-[#0c131d] px-4 py-3 text-white outline-none transition focus:border-cyan-400"
                                    />
                                </label>
                                <label className="block">
                                    <span className="mb-2 block text-sm text-slate-300">{copy.phone}</span>
                                    <input
                                        value={profileForm.phone}
                                        onChange={(event) =>
                                            setProfileForm((current) => ({ ...current, phone: event.target.value }))
                                        }
                                        className="w-full rounded-2xl border border-white/10 bg-[#0c131d] px-4 py-3 text-white outline-none transition focus:border-cyan-400"
                                    />
                                </label>
                                <label className="block md:col-span-2">
                                    <span className="mb-2 block text-sm text-slate-300">{copy.email}</span>
                                    <input
                                        type="email"
                                        value={profileForm.email}
                                        onChange={(event) =>
                                            setProfileForm((current) => ({ ...current, email: event.target.value }))
                                        }
                                        className="w-full rounded-2xl border border-white/10 bg-[#0c131d] px-4 py-3 text-white outline-none transition focus:border-cyan-400"
                                    />
                                </label>
                                <div className="md:col-span-2">
                                    <button
                                        type="submit"
                                        disabled={profileSaving}
                                        className="rounded-full bg-cyan-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {profileSaving ? '...' : copy.saveProfile}
                                    </button>
                                </div>
                            </form>
                        </section>

                        <section className="rounded-[28px] border border-white/10 bg-[#101926]/85 p-6 shadow-[0_24px_80px_rgba(2,8,23,0.35)]">
                            <div className="mb-5 flex items-center justify-between gap-4">
                                <h2 className="text-2xl font-semibold">{copy.warranties}</h2>
                                <Link
                                    href="/warranty-check"
                                    className="text-sm font-medium text-cyan-300 transition hover:text-cyan-200"
                                >
                                    Warranty check
                                </Link>
                            </div>

                            <div className="space-y-4">
                                {warranties.length === 0 && (
                                    <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 px-4 py-8 text-center text-slate-400">
                                        {copy.noWarranties}
                                    </div>
                                )}

                                {warranties.map((item) => (
                                    <article
                                        key={item.id}
                                        className="rounded-3xl border border-white/10 bg-white/[0.03] p-4"
                                    >
                                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                            <div className="flex gap-4">
                                                <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-white/10">
                                                    {item.productImage ? (
                                                        <img
                                                            src={item.productImage}
                                                            alt={item.productName}
                                                            className="h-full w-full object-cover"
                                                        />
                                                    ) : (
                                                        <span className="text-xs text-slate-400">SCS</span>
                                                    )}
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-semibold">{item.productName}</h3>
                                                    <p className="mt-1 text-sm text-slate-400">
                                                        {copy.serial}: {item.serialNumber}
                                                    </p>
                                                    <p className="mt-1 text-sm text-slate-400">
                                                        {copy.dealer}: {item.dealerName || '--'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div
                                                className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusTone(item.status)}`}
                                            >
                                                {item.status === 'ACTIVE'
                                                    ? copy.active
                                                    : item.status === 'EXPIRED'
                                                      ? copy.expired
                                                      : copy.void}
                                            </div>
                                        </div>

                                        <div className="mt-4 grid gap-3 text-sm text-slate-300 md:grid-cols-3">
                                            <div className="rounded-2xl bg-[#0c131d] px-4 py-3">
                                                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{copy.warrantyStart}</p>
                                                <p className="mt-2 font-medium">{formatDate(item.warrantyStart, locale)}</p>
                                            </div>
                                            <div className="rounded-2xl bg-[#0c131d] px-4 py-3">
                                                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{copy.warrantyEnd}</p>
                                                <p className="mt-2 font-medium">{formatDate(item.warrantyEnd, locale)}</p>
                                            </div>
                                            <div className="rounded-2xl bg-[#0c131d] px-4 py-3">
                                                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{copy.remainingDays}</p>
                                                <p className="mt-2 font-medium">{item.remainingDays}</p>
                                            </div>
                                        </div>
                                    </article>
                                ))}
                            </div>

                            <div className="mt-5 flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    disabled={warrantyPage === 0}
                                    onClick={() => setWarrantyPage((current) => Math.max(0, current - 1))}
                                    className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300 transition hover:border-cyan-400 hover:text-cyan-200 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    {copy.previous}
                                </button>
                                <button
                                    type="button"
                                    disabled={warrantyPage + 1 >= warrantyTotalPages}
                                    onClick={() =>
                                        setWarrantyPage((current) => Math.min(warrantyTotalPages - 1, current + 1))
                                    }
                                    className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300 transition hover:border-cyan-400 hover:text-cyan-200 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    {copy.next}
                                </button>
                            </div>
                        </section>
                    </div>

                    <div className="space-y-6">
                        <section className="rounded-[28px] border border-white/10 bg-[#101926]/85 p-6 shadow-[0_24px_80px_rgba(2,8,23,0.35)]">
                            <h2 className="mb-5 text-2xl font-semibold">{copy.password}</h2>
                            <form className="space-y-4" onSubmit={handlePasswordSubmit}>
                                <label className="block">
                                    <span className="mb-2 block text-sm text-slate-300">{copy.currentPassword}</span>
                                    <input
                                        type="password"
                                        value={passwordForm.currentPassword}
                                        onChange={(event) =>
                                            setPasswordForm((current) => ({ ...current, currentPassword: event.target.value }))
                                        }
                                        className="w-full rounded-2xl border border-white/10 bg-[#0c131d] px-4 py-3 text-white outline-none transition focus:border-cyan-400"
                                    />
                                </label>
                                <label className="block">
                                    <span className="mb-2 block text-sm text-slate-300">{copy.newPassword}</span>
                                    <input
                                        type="password"
                                        value={passwordForm.newPassword}
                                        onChange={(event) =>
                                            setPasswordForm((current) => ({ ...current, newPassword: event.target.value }))
                                        }
                                        className="w-full rounded-2xl border border-white/10 bg-[#0c131d] px-4 py-3 text-white outline-none transition focus:border-cyan-400"
                                    />
                                </label>
                                <label className="block">
                                    <span className="mb-2 block text-sm text-slate-300">{copy.confirmPassword}</span>
                                    <input
                                        type="password"
                                        value={passwordForm.confirmPassword}
                                        onChange={(event) =>
                                            setPasswordForm((current) => ({ ...current, confirmPassword: event.target.value }))
                                        }
                                        className="w-full rounded-2xl border border-white/10 bg-[#0c131d] px-4 py-3 text-white outline-none transition focus:border-cyan-400"
                                    />
                                </label>
                                <button
                                    type="submit"
                                    disabled={passwordSaving}
                                    className="rounded-full bg-white px-5 py-3 font-semibold text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {passwordSaving ? '...' : copy.savePassword}
                                </button>
                            </form>
                        </section>

                        <section className="rounded-[28px] border border-white/10 bg-[#101926]/85 p-6 shadow-[0_24px_80px_rgba(2,8,23,0.35)]">
                            <div className="mb-5 flex items-center justify-between gap-4">
                                <h2 className="text-2xl font-semibold">{copy.notifications}</h2>
                                <button
                                    type="button"
                                    onClick={handleMarkAllRead}
                                    className="text-sm font-medium text-cyan-300 transition hover:text-cyan-200"
                                >
                                    {copy.markAllRead}
                                </button>
                            </div>

                            <div className="space-y-3">
                                {notifications.length === 0 && (
                                    <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 px-4 py-8 text-center text-slate-400">
                                        {copy.noNotifications}
                                    </div>
                                )}

                                {notifications.map((item) => (
                                    <article
                                        key={item.id}
                                        className="rounded-3xl border border-white/10 bg-white/[0.03] p-4"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <h3 className="font-semibold">{item.title}</h3>
                                                <p className="mt-2 text-sm leading-6 text-slate-300">{item.content}</p>
                                                <p className="mt-3 text-xs uppercase tracking-[0.18em] text-slate-500">
                                                    {formatDateTime(item.createdAt, locale)}
                                                </p>
                                            </div>
                                            <span
                                                className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                                                    item.isRead
                                                        ? 'border-white/10 bg-white/5 text-slate-300'
                                                        : 'border-cyan-400/40 bg-cyan-400/10 text-cyan-200'
                                                }`}
                                            >
                                                {item.isRead ? copy.read : copy.unread}
                                            </span>
                                        </div>
                                        <div className="mt-4 flex items-center justify-end">
                                            <button
                                                type="button"
                                                onClick={() => handleNotificationToggle(item)}
                                                className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300 transition hover:border-cyan-400 hover:text-cyan-200"
                                            >
                                                {item.isRead ? copy.markUnread : copy.markRead}
                                            </button>
                                        </div>
                                    </article>
                                ))}
                            </div>

                            <div className="mt-5 flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    disabled={notificationPage === 0}
                                    onClick={() => setNotificationPage((current) => Math.max(0, current - 1))}
                                    className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300 transition hover:border-cyan-400 hover:text-cyan-200 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    {copy.previous}
                                </button>
                                <button
                                    type="button"
                                    disabled={notificationPage + 1 >= notificationTotalPages}
                                    onClick={() =>
                                        setNotificationPage((current) => Math.min(notificationTotalPages - 1, current + 1))
                                    }
                                    className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300 transition hover:border-cyan-400 hover:text-cyan-200 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    {copy.next}
                                </button>
                            </div>
                        </section>

                        <section className="rounded-[28px] border border-cyan-400/20 bg-cyan-400/10 p-6">
                            <h2 className="text-xl font-semibold text-white">{copy.supportCta}</h2>
                            <p className="mt-3 text-sm leading-7 text-cyan-100/90">
                                {language === 'vi'
                                    ? 'Neu ban can kich hoat bao hanh, doi serial hoac doi soat don hang, doi dealer support se tiep nhan qua cong thong tin B2B.'
                                    : 'If you need warranty activation, serial reconciliation, or order support, the dealer support team handles those requests in the B2B portal.'}
                            </p>
                            <Link
                                href="/contact"
                                className="mt-4 inline-flex rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
                            >
                                {copy.supportLink}
                            </Link>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}
