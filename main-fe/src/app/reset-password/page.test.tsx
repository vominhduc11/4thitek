// @vitest-environment jsdom
import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ResetPasswordPage from './page';

const { searchParamsState, fetchMock } = vi.hoisted(() => ({
    searchParamsState: { value: '' },
    fetchMock: vi.fn()
}));

vi.mock('next/navigation', () => ({
    useSearchParams: () => new URLSearchParams(searchParamsState.value)
}));

vi.mock('next/link', () => ({
    default: ({
        href,
        children,
        ...props
    }: {
        href: string;
        children: React.ReactNode;
    }) => (
        <a href={href} {...props}>
            {children}
        </a>
    )
}));

const jsonResponse = (body: unknown, init?: ResponseInit) =>
    new Response(JSON.stringify(body), {
        status: 200,
        headers: {
            'Content-Type': 'application/json'
        },
        ...init
    });

describe('ResetPasswordPage', () => {
    beforeEach(() => {
        searchParamsState.value = '';
        fetchMock.mockReset();
        vi.stubGlobal('fetch', fetchMock);
    });

    afterEach(() => {
        cleanup();
        vi.unstubAllGlobals();
    });

    it('states that this page is for public, dealer, and general accounts only', () => {
        render(<ResetPasswordPage />);

        expect(
            screen.getByText((content) =>
                content.includes('public, dealer') && content.includes('admin portal')
            )
        ).toBeTruthy();
    });

    it('validates the request form before calling forgot-password', async () => {
        render(<ResetPasswordPage />);

        const emailInput = screen.getByPlaceholderText('name@example.com');
        const form = emailInput.closest('form');

        expect(form).toBeTruthy();
        fireEvent.submit(form!);

        expect(fetchMock).not.toHaveBeenCalled();
        expect(
            screen.getByText('Vui lòng nhập email tài khoản cần đặt lại mật khẩu.')
        ).toBeTruthy();
    });

    it('submits the forgot-password request and shows the success message', async () => {
        fetchMock.mockResolvedValueOnce(
            jsonResponse({
                success: true,
                data: 'Reset request queued'
            })
        );

        const user = userEvent.setup();
        render(<ResetPasswordPage />);

        const emailInput = screen.getByPlaceholderText('name@example.com');
        await user.type(emailInput, 'dealer@example.com');
        fireEvent.submit(emailInput.closest('form')!);

        await waitFor(() => {
            expect(fetchMock).toHaveBeenCalledWith(
                expect.stringContaining('/auth/forgot-password'),
                expect.objectContaining({
                    method: 'POST'
                })
            );
        });

        expect(screen.getByText('Reset request queued')).toBeTruthy();
    });

    it('shows the invalid-token state and hides the reset form when validation fails', async () => {
        searchParamsState.value = 'token=bad-token';
        fetchMock.mockResolvedValueOnce(
            jsonResponse({
                success: true,
                data: {
                    valid: false,
                    status: 'invalid',
                    message: 'Token invalid'
                }
            })
        );

        const { container } = render(<ResetPasswordPage />);

        await screen.findByText('Token invalid');

        expect(fetchMock).toHaveBeenCalledWith(
            expect.stringContaining('/auth/reset-password/validate?token=bad-token'),
            expect.objectContaining({
                method: 'GET'
            })
        );
        expect(container.querySelectorAll('input[type="password"]')).toHaveLength(0);
    });

    it('validates password rules before posting the reset request', async () => {
        searchParamsState.value = 'token=valid-token';
        fetchMock.mockResolvedValueOnce(
            jsonResponse({
                success: true,
                data: {
                    valid: true,
                    status: 'valid',
                    message: 'Token valid'
                }
            })
        );

        const user = userEvent.setup();
        const { container } = render(<ResetPasswordPage />);

        await screen.findByText('Token valid');

        const passwordInputs = container.querySelectorAll<HTMLInputElement>('input[type="password"]');
        expect(passwordInputs).toHaveLength(2);

        await user.type(passwordInputs[0], 'short');
        await user.type(passwordInputs[1], 'short');
        fireEvent.submit(passwordInputs[0].closest('form')!);

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(screen.getByText('Mật khẩu mới phải có ít nhất 8 ký tự.')).toBeTruthy();
    });

    it('submits a valid reset request and clears the password inputs on success', async () => {
        searchParamsState.value = 'token=valid-token';
        fetchMock
            .mockResolvedValueOnce(
                jsonResponse({
                    success: true,
                    data: {
                        valid: true,
                        status: 'valid',
                        message: 'Token valid'
                    }
                })
            )
            .mockResolvedValueOnce(
                jsonResponse({
                    success: true,
                    data: 'Password updated'
                })
            );

        const user = userEvent.setup();
        const { container } = render(<ResetPasswordPage />);

        await screen.findByText('Token valid');

        const passwordInputs = container.querySelectorAll<HTMLInputElement>('input[type="password"]');
        await user.type(passwordInputs[0], 'ChangedPass#456');
        await user.type(passwordInputs[1], 'ChangedPass#456');
        fireEvent.submit(passwordInputs[0].closest('form')!);

        await waitFor(() => {
            expect(fetchMock).toHaveBeenNthCalledWith(
                2,
                expect.stringContaining('/auth/reset-password'),
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify({
                        token: 'valid-token',
                        newPassword: 'ChangedPass#456'
                    })
                })
            );
        });

        expect(screen.getByText('Password updated')).toBeTruthy();
        expect(passwordInputs[0].value).toBe('');
        expect(passwordInputs[1].value).toBe('');
    });

    it('surfaces reset API failures and updates expired-token state when needed', async () => {
        searchParamsState.value = 'token=expired-token';
        fetchMock
            .mockResolvedValueOnce(
                jsonResponse({
                    success: true,
                    data: {
                        valid: true,
                        status: 'valid',
                        message: 'Token valid'
                    }
                })
            )
            .mockResolvedValueOnce(
                jsonResponse(
                    {
                        success: false,
                        error: 'Token expired'
                    },
                    { status: 400 }
                )
            );

        const user = userEvent.setup();
        const { container } = render(<ResetPasswordPage />);

        await screen.findByText('Token valid');

        const passwordInputs = container.querySelectorAll<HTMLInputElement>('input[type="password"]');
        await user.type(passwordInputs[0], 'ChangedPass#456');
        await user.type(passwordInputs[1], 'ChangedPass#456');
        fireEvent.submit(passwordInputs[0].closest('form')!);

        await screen.findByText('Token expired');
        expect(screen.getByText('Liên kết đã hết hạn')).toBeTruthy();
    });
});
