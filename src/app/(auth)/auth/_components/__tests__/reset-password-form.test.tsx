import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ResetPasswordForm } from '../reset-password-form';

// Mock the server action
vi.mock('@/lib/actions/auth', () => ({
  resetPasswordAction: vi.fn(),
}));

// Mock useSearchParams to control token
const mockSearchParams = new URLSearchParams();
vi.mock('next/navigation', () => ({
  useSearchParams: () => mockSearchParams,
}));

describe('ResetPasswordForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams.delete('token');
  });

  it('shows error message when no token is provided', () => {
    render(<ResetPasswordForm />);

    // Check error message
    expect(screen.getByText('無効なリンクです')).toBeInTheDocument();
    expect(
      screen.getByText('パスワードリセットリンクが無効または期限切れです。'),
    ).toBeInTheDocument();

    // Check link to request new token
    expect(
      screen.getByRole('link', { name: '新しいリセットリンクを要求' }),
    ).toHaveAttribute('href', '/auth/forgot-password');
  });

  it('shows error when passwords do not match', async () => {
    const user = userEvent.setup();

    // Set token in search params
    mockSearchParams.set('token', 'valid-token-123');

    render(<ResetPasswordForm />);

    // Fill form with mismatched passwords
    const passwordInput = screen.getByLabelText('新しいパスワード');
    await user.type(passwordInput, 'ValidPassword123!');

    const confirmPasswordInput = screen.getByLabelText('パスワード（確認）');
    await user.type(confirmPasswordInput, 'DifferentPassword123!');

    // Submit form
    const submitButton = screen.getByRole('button', {
      name: 'パスワードを更新',
    });
    await user.click(submitButton);

    // Check password mismatch error
    await waitFor(() => {
      expect(screen.getByText('パスワードが一致しません')).toBeInTheDocument();
    });

    // Server action should not be called
    const { resetPasswordAction } = await import('@/lib/actions/auth');
    expect(resetPasswordAction).not.toHaveBeenCalled();
  });

  it('calls server action with correct data when form is valid', async () => {
    const user = userEvent.setup();

    // Set token in search params
    mockSearchParams.set('token', 'valid-token-123');

    // Get mocked function
    const { resetPasswordAction } = await import('@/lib/actions/auth');
    const mockResetPasswordAction = vi.mocked(resetPasswordAction);

    // Mock successful response
    mockResetPasswordAction.mockResolvedValue({
      data: undefined,
      serverError: undefined,
      validationErrors: undefined,
    });

    render(<ResetPasswordForm />);

    // Fill form with valid data
    const passwordInput = screen.getByLabelText('新しいパスワード');
    await user.type(passwordInput, 'ValidPassword123!');

    const confirmPasswordInput = screen.getByLabelText('パスワード（確認）');
    await user.type(confirmPasswordInput, 'ValidPassword123!');

    // Submit form
    const submitButton = screen.getByRole('button', {
      name: 'パスワードを更新',
    });
    await user.click(submitButton);

    // Check server action was called with correct data
    await waitFor(() => {
      expect(mockResetPasswordAction).toHaveBeenCalledWith({
        password: 'ValidPassword123!',
        confirmPassword: 'ValidPassword123!',
        token: 'valid-token-123',
      });
    });
  });
});
