import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ForgotPasswordForm } from '../forgot-password-form';

// Mock the server action
vi.mock('@/lib/actions/auth', () => ({
  forgotPasswordAction: vi.fn(),
}));

describe('ForgotPasswordForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows validation error when submitting empty form', async () => {
    const user = userEvent.setup();
    render(<ForgotPasswordForm />);

    // Submit empty form
    const submitButton = screen.getByRole('button', {
      name: 'パスワードリセットメールを送信',
    });
    await user.click(submitButton);

    // Check validation error appears
    await waitFor(() => {
      expect(
        screen.getByText('メールアドレスを入力してください'),
      ).toBeInTheDocument();
    });

    // Server action should not be called
    const { forgotPasswordAction } = await import('@/lib/actions/auth');
    expect(forgotPasswordAction).not.toHaveBeenCalled();
  });

  it('calls server action with email when form is submitted', async () => {
    const user = userEvent.setup();

    // Get mocked function
    const { forgotPasswordAction } = await import('@/lib/actions/auth');
    const mockForgotPasswordAction = vi.mocked(forgotPasswordAction);

    // Mock successful response
    mockForgotPasswordAction.mockResolvedValue({
      data: undefined,
      serverError: undefined,
      validationErrors: undefined,
    });

    render(<ForgotPasswordForm />);

    // Fill and submit form
    const emailInput = screen.getByLabelText('メールアドレス');
    await user.type(emailInput, 'test@example.com');

    const submitButton = screen.getByRole('button', {
      name: 'パスワードリセットメールを送信',
    });
    await user.click(submitButton);

    // Check server action was called
    await waitFor(() => {
      expect(mockForgotPasswordAction).toHaveBeenCalledWith({
        email: 'test@example.com',
      });
    });
  });
});
