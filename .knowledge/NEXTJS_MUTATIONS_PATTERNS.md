# Next.js フォームとミューテーションパターンリファレンス

## Next.js でフォームとミューテーションを実装したいとき

### Server Actions を使ったデータ更新の流れ

Next.jsでフォーム送信やデータ更新を行う際の基本的な流れ：

1. **Action（エントリーポイント）** → 2. **Usecase（ビジネスロジック）** → 3. **Mutation（データ更新）**

```
クライアント → Server Action → Usecase → Mutation/Query → DB
                     ↓
                revalidateTag（キャッシュ更新）
```

### Server Actions の実装パターン

#### 認証が必要なアクションの定義

```typescript
// src/lib/actions/todos.ts
'use server';

import { revalidateTag } from 'next/cache';
import { createTodoFormSchema } from '@/lib/schemas';
import { createTodoUsecase } from '@/lib/usecases/todos';
import { CACHE_TAGS } from '@/lib/utils/cache-tags';
import { privateActionClient } from '@/lib/utils/safe-action';

export const createTodoAction = privateActionClient
  .metadata({ actionName: 'createTodo' })
  .inputSchema(createTodoFormSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { userId } = ctx;

    // Usecaseを呼び出し（ビジネスロジックはUsecaseに委譲）
    await createTodoUsecase(parsedInput, { userId });

    // キャッシュを更新
    revalidateTag(CACHE_TAGS.TODOS.USER(userId));
  });
```

#### privateActionClient の仕組み

```typescript
// src/lib/utils/safe-action.ts
export const privateActionClient = actionClient.use(async ({ next }) => {
  const session = await getSession();
  
  return next({ ctx: { userId: session.user.id, user: session.user } });
});
```

privateActionClientを使うことで：
- 自動的に認証チェックが行われる
- `ctx`から`userId`や`user`情報にアクセスできる
- 未認証の場合はエラーが返される

### Actionの重要なルール

1. **ActionからはUsecaseのみを呼ぶ**
   - ビジネスロジックはUsecaseに委譲
   - 直接Query/Mutationを呼ばない

2. **revalidateTagはActionで行う**
   - データ更新後のキャッシュ無効化
   - Usecaseではなく、Actionの責務

3. **エラーハンドリングは自動**
   - safe-actionがエラーを捕捉
   - Sentryに自動送信される

## サーバーサイドの処理フローとレイヤードアーキテクチャ

### Action → Usecase → Query/Mutation の流れ

サーバーサイドでのデータ処理は、明確に責務が分離された3つの層で構成されます：

```
1. Action層（エントリーポイント）
   ↓
2. Usecase層（ビジネスロジック）
   ↓
3. Query/Mutation層（データアクセス）
```

### Usecase層の実装

Usecaseは、ビジネスロジックとバリデーションを担当します：

```typescript
// src/lib/usecases/todos.ts
import "server-only";
import { returnValidationErrors } from "next-safe-action";
import { isValidTodoTitle, TODO_MESSAGES } from "@/lib/domain/todos";
import { createTodo } from "@/lib/mutations/todos";
import { getTodoByUserIdAndTitle } from "@/lib/queries/todos";
import { createTodoFormSchema } from "@/lib/schemas";

interface UsecaseContext {
  userId: string;
}

export async function createTodoUsecase(
  input: CreateTodoInput,
  context: UsecaseContext
): Promise<void> {
  const { title } = input;
  const { userId } = context;

  // ドメインバリデーション
  if (!isValidTodoTitle(title)) {
    // returnValidationErrorsを使う理由：
    // ビジネスロジックエラーでthrowするとSentryに送信されてしまうため
    returnValidationErrors(createTodoFormSchema, {
      title: {
        _errors: [TODO_MESSAGES.TITLE_INVALID_CHARS],
      },
    });
  }

  // ビジネスルール：重複チェック
  const existingTodo = await getTodoByUserIdAndTitle(userId, title);
  if (existingTodo) {
    returnValidationErrors(createTodoFormSchema, {
      title: {
        _errors: [TODO_MESSAGES.DUPLICATE_TITLE],
      },
    });
  }

  // データ作成はMutation層に委譲
  await createTodo({
    userId,
    title,
    completed: false,
  });
}
```

#### Usecaseの重要なポイント

1. **'server-only'インポートは必須** - クライアントバンドルに含まれることを防ぐ
2. **returnValidationErrors** - ドメインロジックエラー時に使用（正常な処理なのでSentryに送信しない）
3. **ビジネスロジックの集約** - 重複チェックなどの業務ルール
4. **Query/Mutation/Servicesの呼び出し** - データアクセスは別層に委譲
5. **try-catchは使わない** - エラーは投げるだけで、ActionClientのhandleServerErrorに処理を委譲

### Query層の実装

データ取得とキャッシュ管理を担当：

```typescript
// src/lib/queries/todos.ts
import "server-only"; // 必須：クライアントバンドルに含まれることを防ぐ
import { unstable_cache } from "next/cache";
import { db } from "@/db";
import { todos } from "@/db/schema";
import { CACHE_TAGS } from "@/lib/utils/cache-tags";

export function getTodosByUserId(userId: string) {
  return unstable_cache(
    async (): Promise<Todo[]> => {
      const userTodos = await db
        .select()
        .from(todos)
        .where(eq(todos.userId, userId))
        .orderBy(desc(todos.createdAt));

      return userTodos;
    },
    [`getTodosByUserId-${userId}`],
    {
      tags: [CACHE_TAGS.TODOS.USER(userId)],
      revalidate: 3600, // 1時間キャッシュ
    }
  )();
}
```

#### Queryパターンの特徴

1. **unstable_cacheによるキャッシュ** - パフォーマンス最適化
2. **キャッシュタグの使用** - 細かい無効化制御
3. **型安全なクエリ** - Drizzle ORMによる型推論
4. **try-catchは使わない** - DBエラーはそのまま投げる

#### Usecase専用のQuery関数

以下のような権限チェック付きの関数は、**Usecase層からのみ呼ばれる専用関数**です。キャッシュがないため、通常のデータ表示には使用しません：

```typescript
// キャッシュなし、Usecase専用
export async function getTodoByIdWithAuth(
  id: string,
  userId: string
): Promise<Todo | null> {
  const todo = await getTodoById(id, userId);

  if (!todo) {
    return null;
  }

  // アクセス制御
  if (todo.userId !== userId) {
    throw new Error("このTODOにアクセスする権限がありません");
  }

  return todo;
}
```

これらの関数は：

- **キャッシュなし** - ビジネスロジック検証用なので最新データが必要
- **Usecase専用** - 画面表示用のQueryとは別管理
- **権限チェック込み** - セキュリティを確保

### Mutation層の実装

データ更新を担当：

```typescript
// src/lib/mutations/todos.ts
import "server-only"; // 必須：クライアントバンドルに含まれることを防ぐ
import { db } from "@/db";
import { todos } from "@/db/schema";

export type TodoInsert = Omit<NewTodo, "id" | "createdAt" | "updatedAt">;

export async function createTodo(data: TodoInsert): Promise<Todo> {
  const [newTodo] = await db.insert(todos).values(data).returning();

  if (!newTodo) {
    throw new Error("Failed to create todo");
  }

  return newTodo;
}

export async function updateTodo(
  id: string,
  data: TodoUpdate,
  userId: string
): Promise<Todo> {
  const [updatedTodo] = await db
    .update(todos)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(and(eq(todos.id, id), eq(todos.userId, userId)))
    .returning();

  if (!updatedTodo) {
    throw new Error("TODO not found or access denied");
  }

  return updatedTodo;
}
```

#### Mutationの責務

1. **純粋なデータ操作** - ビジネスロジックは含まない
2. **エラーハンドリング** - DB操作の失敗を適切に処理
3. **権限チェック** - WHERE句でユーザーIDを確認
4. **型安全な操作** - 入力型と戻り値型を明確に定義
5. **try-catchは使わない** - エラーはそのまま投げる

### ドメイン層の役割

ビジネスルールと定数を管理：

```typescript
// src/lib/domain/todos/constants.ts
export const TODO_VALIDATION = {
  MIN_TITLE_LENGTH: 1,
  MAX_TITLE_LENGTH: 100,
  containsControlCharacters: (text: string): boolean => {
    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i);
      if (charCode <= 0x1f || charCode === 0x7f) {
        return true;
      }
    }
    return false;
  },
} as const;

// src/lib/domain/todos/validators.ts
export function isValidTodoTitle(title: string): boolean {
  if (title.length < TODO_VALIDATION.MIN_TITLE_LENGTH) {
    return false;
  }
  if (title.length > TODO_VALIDATION.MAX_TITLE_LENGTH) {
    return false;
  }
  return !TODO_VALIDATION.containsControlCharacters(title);
}
```

### Services層の役割

外部サービスとの連携を担当：

```typescript
// src/lib/services/email.ts
import "server-only"; // 必須：クライアントバンドルに含まれることを防ぐ
import { Resend } from "resend";

export const resend = new Resend(env.RESEND_API_KEY);

export async function sendVerificationEmailWithReact(params: {
  to: string;
  userName?: string;
  verificationUrl: string;
}) {
  // 外部APIの呼び出し
  const result = await resend.emails.send({
    from: "noreply@example.com",
    to: params.to,
    subject: "メールアドレスを認証してください",
    html,
    text,
  });

  // エラーは投げるだけ、try-catchは使わない
  if (result.error) {
    throw new Error(`Resend APIエラー: ${result.error.message}`);
  }

  return result;
}
```

#### Servicesに含まれるもの

1. **外部API連携** - メール送信、SMS、プッシュ通知
2. **認証サービス** - Better Auth、Auth.js等
3. **ストレージサービス** - S3、Cloudinary等
4. **決済サービス** - Stripe、PayPal等
5. **AI/ML サービス** - OpenAI、Claude API等

#### Services層の注意点

- **try-catchは使わない** - 外部APIのエラーはそのまま投げる
- エラーメッセージは必要に応じて変換してから投げる

### 各層の依存関係とserver-only要件

```
Action → Usecase → Query/Mutation/Services
           ↓
        Domain
```

#### 各層の責務と要件

| 層       | server-only | 責務                                           |
| -------- | ----------- | ---------------------------------------------- |
| Action   | 必須        | エントリーポイント、認証、キャッシュ無効化     |
| Usecase  | 必須        | ビジネスロジック、バリデーション               |
| Query    | 必須        | データ取得、キャッシュ管理                     |
| Mutation | 必須        | データ更新                                     |
| Services | 必須        | 外部サービス連携（メール、認証、ストレージ等） |
| Domain   | 不要        | ビジネスルール、定数、バリデーター             |

#### 依存関係のルール

- Actionは**Usecaseのみ**を呼ぶ
- UsecaseはQuery/Mutation/Services/Domainを使用
- Query/MutationはDBアクセスのみ
- ServicesはDB以外の外部リソースアクセス
- Domainは他の層に依存しない（純粋な関数のみ）

## クライアントサイドのフォーム実装

### React Hook Form + Server Actions の基本実装

Next.jsのクライアントフォームは、React Hook FormとServer Actionsを組み合わせて実装します：

```tsx
// src/app/(protected)/dashboard/tasks/_components/task-form.tsx
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useHookFormAction } from '@next-safe-action/adapter-react-hook-form/hooks';
import { toast } from 'sonner';
import { createTodoAction } from '@/lib/actions/todos';
import { createTodoFormSchema } from '@/lib/schemas';

export function TaskForm() {
  const titleInputId = useId();

  const { form, handleSubmitWithAction } = useHookFormAction(
    createTodoAction,
    zodResolver(createTodoFormSchema),
    {
      formProps: {
        mode: 'onSubmit',
        defaultValues: {
          title: '',
        },
      },
      actionProps: {
        onSuccess: () => {
          form.reset();
          toast.success(TODO_MESSAGES.CREATION_SUCCESS);
        },
        onError: ({ error }) => {
          const message = convertActionErrorToMessage(
            error,
            TODO_MESSAGES.CREATION_ERROR,
          );
          toast.error(message);
        },
      },
    },
  );

  return (
    <Form {...form}>
      <form onSubmit={handleSubmitWithAction} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor={titleInputId}>タスクのタイトル</FormLabel>
              <FormControl>
                <Input
                  id={titleInputId}
                  placeholder="例: プレゼン資料の作成"
                  autoFocus
                  {...field}
                />
              </FormControl>
              <FormDescription>
                取り組むタスクの内容を入力してください
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? '追加中...' : 'タスクを追加'}
        </Button>
      </form>
    </Form>
  );
}
```

### useHookFormAction の利点

1. **型安全** - ActionのスキーマとFormの型が自動的に同期
2. **バリデーション統合** - クライアントとサーバーで同じスキーマを使用
3. **エラーハンドリング** - サーバーエラーがフォームフィールドに自動マッピング
4. **状態管理** - 送信中の状態を自動管理

### スキーマ定義

フォームのバリデーションスキーマは、クライアントとサーバーで共有：

```typescript
// src/lib/schemas/todos.ts
import { z } from 'zod';

export const createTodoFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'タイトルを入力してください')
    .max(255, 'タイトルは255文字以内で入力してください'),
});

export const updateTodoFormSchema = z.object({
  id: z.string().min(1),
  title: z.string().trim().min(1).max(255).optional(),
  completed: z.boolean().optional(),
});
```

#### スキーマの役割

- **クライアント側** - React Hook Formのバリデーション
- **サーバー側** - Server Actionの入力検証
- **型推論** - TypeScriptの型を自動生成

### フォームUIの実装

shadcn/uiのFormコンポーネントを使用した実装：

```tsx
import { useId } from 'react';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function TaskForm() {
  const titleInputId = useId();
  const { form, handleSubmitWithAction } = useHookFormAction(...);

  return (
    <Form {...form}>
      <form onSubmit={handleSubmitWithAction} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor={titleInputId}>タスクのタイトル</FormLabel>
              <FormControl>
                <Input
                  id={titleInputId}
                  placeholder="例: プレゼン資料の作成"
                  autoFocus
                  {...field}
                />
              </FormControl>
              <FormDescription>
                取り組むタスクの内容を入力してください
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? '追加中...' : 'タスクを追加'}
        </Button>
      </form>
    </Form>
  );
}
```

#### アクセシビリティのポイント

1. **useId()** - 一意のIDを生成してlabelとinputを関連付け
2. **FormDescription** - 入力補助のための説明文
3. **FormMessage** - エラーメッセージの表示
4. **disabled状態** - 送信中はボタンを無効化

### ベストプラクティス

1. **'use client'は必須** - クライアントコンポーネントであることを明示
2. **defaultValuesを設定** - フォームの初期値を明確に
3. **送信中の状態を表示** - isSubmittingでUXを向上
4. **成功時にフォームをリセット** - form.reset()で次の入力に備える
5. **エラーメッセージを具体的に** - ユーザーが対処方法を理解できるように

## 高度なパターン：bindArgsSchemaとファイルアップロード

### bindArgsSchemaパターン

パラメータを事前にバインドして、特定の値を固定したActionを作成：

```typescript
// src/lib/actions/todos.ts
export const toggleTodoAction = privateActionClient
  .metadata({ actionName: 'toggleTodo' })
  .bindArgsSchemas<[todoId: z.ZodString]>([
    z.string().min(1, 'TODO IDが不正です'),
  ])
  .inputSchema(z.object({ completed: z.boolean() }))
  .action(async ({ parsedInput, bindArgsParsedInputs: [todoId], ctx }) => {
    const { userId } = ctx;

    // todoIdは事前にバインドされ、completedのみが実行時に渡される
    await updateTodoUsecase(
      { id: todoId, completed: parsedInput.completed },
      { userId },
    );

    revalidateTag(CACHE_TAGS.TODOS.USER(userId));
  });
```

#### クライアントでの使用方法

```tsx
// バインドされたActionの呼び出し
const boundAction = toggleTodoAction.bind(null, todo.id);

// 実行時はcompletedのみを渡す
await boundAction({ completed: !todo.completed });
```

#### bindArgsSchemaの利点

1. **型安全なパラメータバインディング** - バインドする値も検証される
2. **再利用性の向上** - 同じActionを異なるコンテキストで使用
3. **クリーンなAPI** - 実行時に必要な引数が減る

### ストレージを使った画像アップロード

#### 1. Presigned URL生成Action

```typescript
// src/lib/actions/diary.ts
export const getSignedUploadUrlAction = privateActionClient
  .metadata({ actionName: 'getDiaryImageUploadUrl' })
  .inputSchema(getSignedUploadUrlSchema, {
    handleValidationErrorsShape: async (ve) =>
      flattenValidationErrors(ve).fieldErrors,
  })
  .action(async ({ parsedInput, ctx }) => {
    const { userId } = ctx;

    // Usecaseを呼び出し
    const result = await generateDiaryImageUploadUrl(parsedInput, { userId });

    return result; // signedUrl, publicUrl等を返す
  });
```

#### 2. ストレージサービスの実装

```typescript
// src/lib/services/image-upload.service.ts
import 'server-only';
import { supabaseAdmin } from '@/lib/supabase/storage';

export async function generateUploadUrl(
  input: GenerateUploadUrlInput,
): Promise<GenerateUploadUrlResult> {
  // ファイル形式検証
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!validTypes.includes(input.fileType)) {
    throw new Error(
      'サポートされていない画像形式です。JPEG、PNG、WebPのみ対応しています。',
    );
  }

  // ファイルサイズ検証（5MB制限）
  const maxSize = 5 * 1024 * 1024;
  if (input.fileSize > maxSize) {
    throw new Error('画像サイズは5MB以下にしてください');
  }

  // ユーザー別フォルダ構造でパス生成
  const date = new Date();
  const folderName = `${input.userId}/${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
  const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`;
  const filePath = `${folderName}/${uniqueFileName}`;

  // Presigned Upload URL生成
  const { data, error } = await supabaseAdmin.storage
    .from(input.bucket)
    .createSignedUploadUrl(filePath);

  if (error || !data) {
    throw new Error('アップロードURLの生成に失敗しました');
  }

  // 公開URLも事前生成
  const { data: { publicUrl } } = supabaseAdmin.storage
    .from(input.bucket)
    .getPublicUrl(filePath);

  return {
    signedUrl: data.signedUrl,
    token: data.token,
    path: data.path,
    publicUrl,
  };
}
```

#### 3. クライアントでの実装

```tsx
// src/app/(protected)/dashboard/diary/_components/diary-form.tsx
import { useAction } from 'next-safe-action/hooks';
import { uploadFileWithSignedUrl } from '@/lib/services/image-upload-client.service';

export function DiaryForm() {
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  
  const { execute: getSignedUrl } = useAction(getSignedUploadUrlAction, {
    onSuccess: async (result) => {
      if (result.data && pendingFile) {
        try {
          // クライアントから直接ストレージにアップロード
          await uploadFileWithSignedUrl(pendingFile, result.data.signedUrl);
          
          // フォームに公開URLをセット
          form.setValue('imageUrl', result.data.publicUrl);
          toast.success(UPLOAD_MESSAGES.UPLOAD_SUCCESS);
        } catch (error) {
          toast.error(UPLOAD_MESSAGES.UPLOAD_ERROR);
        }
      }
    },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPendingFile(file);
    
    // Presigned URLを取得
    await getSignedUrl({
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
    });
  };
}
```

#### 画像アップロードフローの利点

1. **セキュア** - Presigned URLで直接アップロード、サーバー経由不要
2. **パフォーマンス** - クライアントから直接ストレージへ
3. **検証** - サーバー側でファイルタイプ・サイズを事前検証
4. **構造化** - ユーザー別・日付別のフォルダ構造

### 実装時の注意点

#### bindArgsSchema使用時
- バインドする値もスキーマで検証される
- 型推論が正しく動作するよう、ジェネリクスを明示的に指定

#### ファイルアップロード時
- Presigned URLの有効期限に注意
- クライアント側でもファイルサイズを事前チェック
- アップロード中の状態管理を適切に行う
- エラー時のリトライ処理を検討