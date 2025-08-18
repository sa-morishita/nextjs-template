import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SignUpForm } from '../sign-up-form';

// Mock the server action
vi.mock('@/lib/actions/auth', () => ({
  signUpAction: vi.fn(),
}));

describe('SignUpForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows validation error for weak password', async () => {
    const user = userEvent.setup();
    render(<SignUpForm />);

    // Fill form with weak password
    const emailInput = screen.getByLabelText('メールアドレス');
    await user.type(emailInput, 'test@example.com');

    const nameInput = screen.getByLabelText('名前');
    await user.type(nameInput, 'テストユーザー');

    const passwordInput = screen.getByLabelText('パスワード');
    await user.type(passwordInput, 'weak'); // 弱いパスワード

    const confirmPasswordInput = screen.getByLabelText('パスワード（確認）');
    await user.type(confirmPasswordInput, 'weak');

    // Submit form
    const submitButton = screen.getByRole('button', {
      name: 'アカウントを作成',
    });
    await user.click(submitButton);

    // Check password validation error (multiple errors expected)
    await waitFor(() => {
      const errors = screen.getAllByText(
        'パスワードは12文字以上128文字以下で、大文字、小文字、数字、記号をそれぞれ1文字以上含めてください',
      );
      expect(errors.length).toBeGreaterThan(0);
    });

    // Server action should not be called
    const { signUpAction } = await import('@/lib/actions/auth');
    expect(signUpAction).not.toHaveBeenCalled();
  });

  it('shows error when passwords do not match', async () => {
    const user = userEvent.setup();
    render(<SignUpForm />);

    // Fill form with mismatched passwords
    const emailInput = screen.getByLabelText('メールアドレス');
    await user.type(emailInput, 'test@example.com');

    const nameInput = screen.getByLabelText('名前');
    await user.type(nameInput, 'テストユーザー');

    const passwordInput = screen.getByLabelText('パスワード');
    await user.type(passwordInput, 'ValidPassword123!');

    const confirmPasswordInput = screen.getByLabelText('パスワード（確認）');
    await user.type(confirmPasswordInput, 'DifferentPassword123!');

    // Submit form
    const submitButton = screen.getByRole('button', {
      name: 'アカウントを作成',
    });
    await user.click(submitButton);

    // Check password mismatch error
    await waitFor(() => {
      expect(screen.getByText('パスワードが一致しません')).toBeInTheDocument();
    });

    // Server action should not be called
    const { signUpAction } = await import('@/lib/actions/auth');
    expect(signUpAction).not.toHaveBeenCalled();
  });

  it('calls server action with correct data when form is valid', async () => {
    const user = userEvent.setup();

    // Get mocked function
    const { signUpAction } = await import('@/lib/actions/auth');
    const mockSignUpAction = vi.mocked(signUpAction);

    // Mock successful response
    mockSignUpAction.mockResolvedValue({
      data: undefined,
      serverError: undefined,
      validationErrors: undefined,
    });

    render(<SignUpForm />);

    // Fill form with valid data
    const emailInput = screen.getByLabelText('メールアドレス');
    await user.type(emailInput, 'test@example.com');

    const nameInput = screen.getByLabelText('名前');
    await user.type(nameInput, 'テストユーザー');

    const passwordInput = screen.getByLabelText('パスワード');
    await user.type(passwordInput, 'ValidPassword123!');

    const confirmPasswordInput = screen.getByLabelText('パスワード（確認）');
    await user.type(confirmPasswordInput, 'ValidPassword123!');

    // Submit form
    const submitButton = screen.getByRole('button', {
      name: 'アカウントを作成',
    });
    await user.click(submitButton);

    // Check server action was called with correct data
    await waitFor(() => {
      expect(mockSignUpAction).toHaveBeenCalledWith({
        email: 'test@example.com',
        name: 'テストユーザー',
        password: 'ValidPassword123!',
        confirmPassword: 'ValidPassword123!',
      });
    });
  });
});
