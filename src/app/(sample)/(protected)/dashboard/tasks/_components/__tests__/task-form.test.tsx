import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TaskForm } from '../task-form';

// Mock the server actions
vi.mock('@/lib/sample/actions/todos', () => ({
  createTodoAction: vi.fn(),
}));

describe('TaskForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('バリデーション', () => {
    it('空のフォームを送信したときにエラーを表示する', async () => {
      const user = userEvent.setup();
      render(<TaskForm />);

      // Submit empty form
      const submitButton = screen.getByRole('button', { name: 'タスクを追加' });
      await user.click(submitButton);

      // Check validation error appears
      await waitFor(() => {
        expect(
          screen.getByText('タイトルを入力してください'),
        ).toBeInTheDocument();
      });

      // Server action should not be called
      const { createTodoAction } = await import('@/lib/sample/actions/todos');
      expect(createTodoAction).not.toHaveBeenCalled();
    });

    it('タイトルが255文字を超えるときにエラーを表示する', async () => {
      const user = userEvent.setup();
      render(<TaskForm />);

      // Type a very long title (256 characters)
      const titleInput = screen.getByLabelText('タスクのタイトル');
      const longTitle = 'あ'.repeat(256);
      await user.type(titleInput, longTitle);

      // Submit form
      const submitButton = screen.getByRole('button', { name: 'タスクを追加' });
      await user.click(submitButton);

      // Check validation error appears
      await waitFor(() => {
        expect(
          screen.getByText('タイトルは255文字以内で入力してください'),
        ).toBeInTheDocument();
      });

      // Server action should not be called
      const { createTodoAction } = await import('@/lib/sample/actions/todos');
      expect(createTodoAction).not.toHaveBeenCalled();
    });
  });

  describe('正常系', () => {
    it('有効なデータでサーバーアクションを呼び出す', async () => {
      const user = userEvent.setup();

      // Get mocked function
      const { createTodoAction } = await import('@/lib/sample/actions/todos');
      const mockCreateTodoAction = vi.mocked(createTodoAction);

      // Mock successful response
      mockCreateTodoAction.mockResolvedValue({
        data: undefined,
        serverError: undefined,
        validationErrors: undefined,
      });

      render(<TaskForm />);

      // Fill form with valid data
      const titleInput = screen.getByLabelText('タスクのタイトル');
      await user.type(titleInput, 'Test Task');

      // Submit form
      const submitButton = screen.getByRole('button', { name: 'タスクを追加' });
      await user.click(submitButton);

      // Check server action was called with correct data
      await waitFor(() => {
        expect(mockCreateTodoAction).toHaveBeenCalledWith({
          title: 'Test Task',
        });
      });
    });
  });

  describe('送信中の状態', () => {
    it('送信中はボタンを無効化して送信中のテキストを表示する', async () => {
      const user = userEvent.setup();

      // Get mocked function
      const { createTodoAction } = await import('@/lib/sample/actions/todos');
      const mockCreateTodoAction = vi.mocked(createTodoAction);

      // Mock a delayed response
      mockCreateTodoAction.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve({
                data: undefined,
                serverError: undefined,
                validationErrors: undefined,
              });
            }, 100);
          }),
      );

      render(<TaskForm />);

      // Fill form with valid data
      const titleInput = screen.getByLabelText('タスクのタイトル');
      await user.type(titleInput, 'Test Task');

      // Submit form
      const submitButton = screen.getByRole('button', { name: 'タスクを追加' });
      await user.click(submitButton);

      // Check button is disabled and shows loading text
      expect(submitButton).toBeDisabled();
      expect(submitButton).toHaveTextContent('追加中...');

      // Wait for submission to complete
      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
        expect(submitButton).toHaveTextContent('タスクを追加');
      });
    });
  });
});
