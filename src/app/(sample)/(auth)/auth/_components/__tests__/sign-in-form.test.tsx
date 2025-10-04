import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SignInForm } from '../sign-in-form';

// Mock the server actions
vi.mock('@/lib/actions/auth', () => ({
  signInAction: vi.fn(),
  resendVerificationEmailAction: vi.fn(),
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe('SignInForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows validation error when submitting empty form', async () => {
    const user = userEvent.setup();
    render(<SignInForm />);

    // Submit empty form
    const submitButton = screen.getByRole('button', { name: 'サインイン' });
    await user.click(submitButton);

    // Check validation errors appear
    await waitFor(() => {
      expect(
        screen.getByText('メールアドレスを入力してください'),
      ).toBeInTheDocument();
    });

    // Server action should not be called
    const { signInAction } = await import('@/lib/actions/auth');
    expect(signInAction).not.toHaveBeenCalled();
  });

  it('calls server action with correct data when form is valid', async () => {
    const user = userEvent.setup();

    // Get mocked function
    const { signInAction } = await import('@/lib/actions/auth');
    const mockSignInAction = vi.mocked(signInAction);

    // Mock successful response
    mockSignInAction.mockResolvedValue({
      data: undefined,
      serverError: undefined,
      validationErrors: undefined,
    });

    render(<SignInForm />);

    // Fill form with valid data
    const emailInput = screen.getByLabelText('メールアドレス');
    await user.type(emailInput, 'test@example.com');

    const passwordInput = screen.getByLabelText('パスワード');
    await user.type(passwordInput, 'ValidPassword123!');

    // Submit form
    const submitButton = screen.getByRole('button', { name: 'サインイン' });
    await user.click(submitButton);

    // Check server action was called with correct data
    await waitFor(() => {
      expect(mockSignInAction).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'ValidPassword123!',
      });
    });
  });
});
