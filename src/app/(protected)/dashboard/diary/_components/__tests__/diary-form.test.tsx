import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DiaryForm } from '../diary-form';

// Mock the server actions
vi.mock('@/lib/actions/diary', () => ({
  createDiaryAction: vi.fn(),
  getSignedUploadUrlAction: vi.fn(),
}));

// Mock the image upload service
vi.mock('@/lib/services/image-upload-client.service', () => ({
  uploadFileWithSignedUrl: vi.fn(),
}));

// Mock next/image
vi.mock('next/image', () => ({
  default: vi.fn().mockImplementation(({ src, alt, ...props }) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} {...props} />;
  }),
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('DiaryForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-preview-url');
  });

  it('必須フィールドが未入力の場合エラーを表示', async () => {
    const user = userEvent.setup();
    render(<DiaryForm hasTodaysDiary={false} />);

    // フォーム送信
    const submitButton = screen.getByRole('button', { name: '日記を作成' });
    await user.click(submitButton);

    // バリデーションエラーの確認
    await waitFor(() => {
      expect(
        screen.getByText('タイトルを入力してください'),
      ).toBeInTheDocument();
      expect(screen.getByText('本文を入力してください')).toBeInTheDocument();
    });

    // サーバーアクションが呼ばれていないことを確認
    const { createDiaryAction } = await import('@/lib/actions/diary');
    expect(createDiaryAction).not.toHaveBeenCalled();
  });

  it('有効な入力でフォームを送信するとサーバーアクションが呼ばれる', async () => {
    const user = userEvent.setup();
    const { createDiaryAction } = await import('@/lib/actions/diary');

    const mockCreateDiaryAction = vi.mocked(createDiaryAction);
    mockCreateDiaryAction.mockResolvedValue({
      data: undefined,
      serverError: undefined,
      validationErrors: undefined,
    });

    render(<DiaryForm hasTodaysDiary={false} />);

    // フォームに入力
    const titleInput = screen.getByLabelText('タイトル');
    await user.type(titleInput, 'テストタイトル');

    const contentTextarea = screen.getByLabelText('内容');
    await user.type(contentTextarea, 'テスト内容');

    // フォーム送信
    const submitButton = screen.getByRole('button', { name: '日記を作成' });
    await user.click(submitButton);

    // サーバーアクションが正しいデータで呼ばれることを確認
    await waitFor(() => {
      expect(mockCreateDiaryAction).toHaveBeenCalledWith({
        title: 'テストタイトル',
        content: 'テスト内容',
        imageUrl: '',
        blurDataUrl: '',
      });
    });
  });

  it('hasTodaysDiary=trueの場合、フォームが無効化される', () => {
    render(<DiaryForm hasTodaysDiary={true} />);

    // すべての入力フィールドが無効化されていることを確認
    expect(screen.getByLabelText('タイトル')).toBeDisabled();
    expect(screen.getByLabelText('内容')).toBeDisabled();
    expect(document.querySelector('input[type="file"]')).toBeDisabled();

    // ボタンが無効化され、テキストが変更されていることを確認
    expect(
      screen.getByRole('button', { name: '本日の日記は作成済みです' }),
    ).toBeDisabled();
  });
});
