import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { getUserDiaries } from '@/lib/sample/queries/diaries';
import { createDiaryUsecase } from '@/lib/sample/usecases/diary';
import {
  createTestDiary,
  createTestUser,
  diaryFactory,
  userFactory,
} from '@/test/factories';
import { createTestDatabase } from '@/test/helpers/database-setup';
import {
  expectFieldValidationError,
  expectValidationError,
} from '@/test/helpers/validation-error-assertions';
import { setTestDbInstance } from '@/test/integration-setup';

interface UsecaseContext {
  userId: string;
}

describe('Diary Usecase 結合テスト', () => {
  let cleanup: () => Promise<void>;

  beforeEach(async () => {
    const setup = await createTestDatabase();
    setTestDbInstance(setup.testDb);
    cleanup = setup.cleanup;

    userFactory.rewindSequence();
    diaryFactory.rewindSequence();
  });

  afterEach(async () => {
    await cleanup();
    setTestDbInstance(null);
  });

  describe('createDiaryUsecase - 日記作成ビジネスロジック', () => {
    describe('正常系', () => {
      it('有効なタイトルと内容で日記を作成できること', async () => {
        // Given: 認証済みユーザー
        const user = await createTestUser();
        const context: UsecaseContext = { userId: user.id };

        // When: 正常な日記作成
        await createDiaryUsecase(
          {
            title: '今日の出来事',
            content: '今日は晴れていて気持ちが良かった。公園を散歩した。',
          },
          context,
        );

        // Then: 日記が作成される
        const diaries = await getUserDiaries(user.id, {});
        expect(diaries).toHaveLength(1);
        expect(diaries[0].title).toBe('今日の出来事');
        expect(diaries[0].content).toBe(
          '今日は晴れていて気持ちが良かった。公園を散歩した。',
        );
        expect(diaries[0].userId).toBe(user.id);
        expect(diaries[0].status).toBe('published');
        expect(diaries[0].type).toBe('diary');
      });

      it('短いタイトルでも日記を作成できること', async () => {
        // Given: 認証済みユーザー
        const user = await createTestUser();
        const context: UsecaseContext = { userId: user.id };

        // When: 短いタイトルで作成
        await createDiaryUsecase(
          {
            title: '今日',
            content: '今日の日記内容',
          },
          context,
        );

        // Then: 作成成功
        const diaries = await getUserDiaries(user.id, {});
        expect(diaries).toHaveLength(1);
        expect(diaries[0].title).toBe('今日');
        expect(diaries[0].content).toBe('今日の日記内容');
      });

      it('日をまたいだら同じユーザーでも日記を作成できること', async () => {
        // Given: 昨日の日記が存在（日本時間基準）
        const user = await createTestUser();
        // 日本時間での昨日の23:59:59を取得
        const { getJapanStartOfDay } = await import('@/lib/utils/date');
        const now = new Date();
        // 日本時間で今日の開始時刻を取得
        const todayStartJST = getJapanStartOfDay(now);
        // その2秒前（昨日の23:59:58）を計算 - 確実に昨日になるように余裕を持たせる
        const yesterdayEndJST = new Date(todayStartJST.getTime() - 2000);

        await createTestDiary({
          userId: user.id,
          title: '昨日の日記',
          content: '昨日の内容',
          createdAt: yesterdayEndJST,
        });

        const context: UsecaseContext = { userId: user.id };

        // When: 今日の日記を作成
        await createDiaryUsecase(
          {
            title: '今日の日記',
            content: '今日の内容',
          },
          context,
        );

        // Then: 作成成功
        const diaries = await getUserDiaries(user.id, {});
        expect(diaries).toHaveLength(2);
        const todaysDiary = diaries.find((d) => d.title === '今日の日記');
        expect(todaysDiary).toBeDefined();
      });
    });

    describe('異常系', () => {
      it('同じ日に2つ目の日記は作成できないこと', async () => {
        // Given: 今日の日記が既に存在
        const user = await createTestUser();
        await createTestDiary({
          userId: user.id,
          title: '朝の日記',
          content: '朝の内容',
          createdAt: new Date(),
        });
        const context: UsecaseContext = { userId: user.id };

        // When & Then: 同じ日に2つ目の日記を作成試行
        await expect(
          createDiaryUsecase(
            {
              title: '夜の日記',
              content: '夜の内容',
            },
            context,
          ),
        ).rejects.toThrow('Server Action server validation error');

        try {
          await createDiaryUsecase(
            {
              title: '夜の日記',
              content: '夜の内容',
            },
            context,
          );
          expect.fail('Expected error to be thrown');
        } catch (error) {
          expectValidationError(error, '本日の日記は既に作成されています');
        }
      });

      it('タイトルに制御文字を含む場合は拒否されること', async () => {
        // Given: 認証済みユーザー
        const user = await createTestUser();
        const context: UsecaseContext = { userId: user.id };

        // When & Then: 制御文字を含むタイトル
        const titleWithControlChar = '日記\x00テスト'; // NULL文字を含む
        await expect(
          createDiaryUsecase(
            {
              title: titleWithControlChar,
              content: '内容',
            },
            context,
          ),
        ).rejects.toThrow('Server Action server validation error');

        try {
          await createDiaryUsecase(
            {
              title: titleWithControlChar,
              content: '内容',
            },
            context,
          );
          expect.fail('Expected error to be thrown');
        } catch (error) {
          expectFieldValidationError(
            error,
            'title',
            'タイトルに使用できない文字が含まれています',
          );
        }
      });

      it('内容が空の場合は拒否されること', async () => {
        // Given: 認証済みユーザー
        const user = await createTestUser();
        const context: UsecaseContext = { userId: user.id };

        // When & Then: 空の内容
        await expect(
          createDiaryUsecase(
            {
              title: 'タイトル',
              content: '',
            },
            context,
          ),
        ).rejects.toThrow('Server Action server validation error');

        try {
          await createDiaryUsecase(
            {
              title: 'タイトル',
              content: '',
            },
            context,
          );
          expect.fail('Expected error to be thrown');
        } catch (error) {
          // 空文字は制御文字チェックで引っかかる
          expectFieldValidationError(
            error,
            'content',
            '本文に使用できない文字が含まれています',
          );
        }
      });

      it('内容に制御文字が含まれる場合は拒否されること', async () => {
        // Given: 認証済みユーザー
        const user = await createTestUser();
        const context: UsecaseContext = { userId: user.id };

        // When & Then: 制御文字を含む内容
        const contentWithControlChar = '今日は\x1f楽しかった'; // Unit Separator制御文字
        await expect(
          createDiaryUsecase(
            {
              title: '日記',
              content: contentWithControlChar,
            },
            context,
          ),
        ).rejects.toThrow('Server Action server validation error');

        try {
          await createDiaryUsecase(
            {
              title: '日記',
              content: contentWithControlChar,
            },
            context,
          );
          expect.fail('Expected error to be thrown');
        } catch (error) {
          expectFieldValidationError(
            error,
            'content',
            '本文に使用できない文字が含まれています',
          );
        }
      });

      it('内容が長すぎる場合は拒否されること', async () => {
        // Given: 認証済みユーザー
        const user = await createTestUser();
        const context: UsecaseContext = { userId: user.id };

        // When & Then: 非常に長い内容（1000文字以上）
        const longContent = 'あ'.repeat(1001);
        await expect(
          createDiaryUsecase(
            {
              title: '日記',
              content: longContent,
            },
            context,
          ),
        ).rejects.toThrow('Server Action server validation error');

        try {
          await createDiaryUsecase(
            {
              title: '日記',
              content: longContent,
            },
            context,
          );
          expect.fail('Expected error to be thrown');
        } catch (error) {
          // ドメインバリデーションではisValidDiaryContentがfalseを返すが、
          // エラーメッセージは常に"使用できない文字"になる
          expectFieldValidationError(
            error,
            'content',
            '本文に使用できない文字が含まれています',
          );
        }
      });

      it('タイトルが長すぎる場合は拒否されること', async () => {
        // Given: 認証済みユーザー
        const user = await createTestUser();
        const context: UsecaseContext = { userId: user.id };

        // When & Then: 非常に長いタイトル（100文字以上）
        const longTitle = 'あ'.repeat(101);
        await expect(
          createDiaryUsecase(
            {
              title: longTitle,
              content: '内容',
            },
            context,
          ),
        ).rejects.toThrow('Server Action server validation error');

        try {
          await createDiaryUsecase(
            {
              title: longTitle,
              content: '内容',
            },
            context,
          );
          expect.fail('Expected error to be thrown');
        } catch (error) {
          // ドメインバリデーションではisValidDiaryTitleがfalseを返すが、
          // エラーメッセージは常に"使用できない文字"になる
          expectFieldValidationError(
            error,
            'title',
            'タイトルに使用できない文字が含まれています',
          );
        }
      });
    });

    describe('境界値テスト', () => {
      it('日付の境界（23:59:59）で正しく判定されること', async () => {
        // Given: 今日の0:00:01に作成された日記（日本時間基準）
        const user = await createTestUser();
        const { getJapanStartOfDay } = await import('@/lib/utils/date');
        const now = new Date();
        const todayStartJST = getJapanStartOfDay(now);
        // 今日の0:00:01（日本時間）を設定して、確実に今日の日記として扱われるようにする
        const todayEarlyMorning = new Date(todayStartJST.getTime() + 1000);

        await createTestDiary({
          userId: user.id,
          title: '深夜の日記',
          content: '深夜の内容',
          createdAt: todayEarlyMorning,
        });

        const context: UsecaseContext = { userId: user.id };

        // When & Then: 同じ日に作成試行
        await expect(
          createDiaryUsecase(
            {
              title: '朝の日記',
              content: '朝の内容',
            },
            context,
          ),
        ).rejects.toThrow('Server Action server validation error');

        try {
          await createDiaryUsecase(
            {
              title: '朝の日記',
              content: '朝の内容',
            },
            context,
          );
          expect.fail('Expected error to be thrown');
        } catch (error) {
          expectValidationError(error, '本日の日記は既に作成されています');
        }
      });

      it('異なるユーザーは同じ日に日記を作成できること', async () => {
        // Given: user1が今日の日記を作成済み
        const user1 = await createTestUser();
        const user2 = await createTestUser();

        await createTestDiary({
          userId: user1.id,
          title: 'ユーザー1の日記',
          content: 'ユーザー1の内容',
        });

        const context: UsecaseContext = { userId: user2.id };

        // When: user2が同じ日に日記作成
        await createDiaryUsecase(
          {
            title: 'ユーザー2の日記',
            content: 'ユーザー2の内容',
          },
          context,
        );

        // Then: 作成成功
        const diaries = await getUserDiaries(user2.id, {});
        expect(diaries).toHaveLength(1);
        expect(diaries[0].userId).toBe(user2.id);
      });
    });
  });
});
