# 🔐 認証・認可実装

Next.js 15 App RouterとSupabaseを使用した認証・認可の実装パターン。

## Supabaseクライアントの使い分け

プロジェクトでは3種類のSupabaseクライアントを用途に応じて使い分ける。

### 1. createClient() - ブラウザクライアント
```typescript
// Client Components用
const supabase = createClient();
```

### 2. createServerClient() - サーバークライアント
```typescript
// Server Components/Actions用
// キャッシュタグとキャッシュ戦略を指定可能
const supabase = await createClient(
  ['todos-user-${userId}', 'todos-all'],
  'force-cache'
);
```

### 3. updateSession() - ミドルウェアクライアント
```typescript
// middleware.ts専用
// セッション管理と認証状態の更新
return await updateSession(request);
```

## Server Actionsでの認証パターン

### actionClient - 認証不要なアクション
```typescript
export const signInAction = actionClient
  .metadata({ actionName: 'signin' })
  .inputSchema(signInSchema)
  .action(async ({ parsedInput }) => {
    // 認証不要な処理
  });
```

### privateActionClient - 認証必須アクション
```typescript
export const createTodoAction = privateActionClient
  .metadata({ actionName: 'createTodo' })
  .inputSchema(createTodoSchema)
  .action(async ({ parsedInput, ctx }) => {
    // ctx.userId が自動的に利用可能
    const todo = await createTodo({
      ...parsedInput,
      user_id: ctx.userId,
    });
  });
```

## 多層防御による認可実装

### 1. ミドルウェア層 - ルートレベル保護
```typescript
// middleware.ts
const isProtectedRoute =
  request.nextUrl.pathname.startsWith('/dashboard/mypage') ||
  request.nextUrl.pathname.startsWith('/protected');

if (!user && isProtectedRoute) {
  return NextResponse.redirect('/auth/sign-in');
}
```

### 2. Server Action層 - アクション実行前チェック
```typescript
// privateActionClientが自動的に認証チェック
if (error) {
  throw new Error('認証が確認できませんでした。再度ログインしてください。');
}
```

### 3. Query/Mutation層 - データアクセス認可
```typescript
// queries/todos.ts
export async function getTodoByIdWithAuth(
  id: string,
  userId: string,
) {
  const todo = await getTodoById(id);

  if (todo.user_id !== userId) {
    throw new Error('このTODOにアクセスする権限がありません');
  }

  return todo;
}
```

### 4. データベース層 - RLS (Row Level Security)
```sql
-- ユーザーは自分のTODOのみ読み取り可能
CREATE POLICY "Users can read own todos" ON sample_todos
  FOR SELECT USING (
    user_id IN (
      SELECT id FROM sample_users WHERE auth.uid()::text = id::text
    )
  );
```

## エラーハンドリング戦略

### Server Actionsでのエラー処理
```typescript
// ❌ 避けるべき：throwするとerror.tsxに遷移しフォーム入力が失われる
throw new Error('エラーが発生しました');

// ✅ 推奨：エラーを戻り値として返す
return {
  error: 'エラーが発生しました',
  isSuccess: false,
};
```

### 認証・認可エラーの処理
- **401 Unauthorized**: 認証が必要（ミドルウェアでリダイレクト）
- **403 Forbidden**: アクセス権限なし（エラーをthrowまたは戻り値で返す）

### エラーページの実装
```typescript
// error.tsx - サーバーエラー（認証・認可エラーを含む）
// not-found.tsx - 404エラー
```

## キャッシュ戦略

### ユーザー情報のキャッシュ
```typescript
const supabase = await createClient(
  ['users-all'], // キャッシュタグ
  'force-cache'  // キャッシュ戦略
);
```

### キャッシュ無効化パターン
```typescript
// ユーザー情報更新時
revalidateTag('users-all');

// TODO作成時
revalidateTag(`todos-user-${userId}`);
revalidateTag('todos-all');
```

## セッション管理の重要ポイント

### ミドルウェアでの注意事項
```typescript
// IMPORTANT: auth.getUser()の呼び出しは必須
// これがないとセッションが更新されない
const { data: { user } } = await supabase.auth.getUser();
```

### Supabase Middlewareの重要な警告
```typescript
// ⚠️ 重要: createServerClientとauth.getUser()の間でコードを実行しない
const supabaseResponse = NextResponse.next({ request });
const supabase = createServerClient(request, supabaseResponse);

// ここにコードを書かない！

const { data: { user } } = await supabase.auth.getUser();
```

### カスタムレスポンス作成時の必須ルール
```typescript
// カスタムレスポンスを作成する場合は以下の3つのルールを厳守：

// 1. リクエストを渡す
const myNewResponse = NextResponse.next({ request });

// 2. Cookieをコピーする
myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll());

// 3. Cookieは変更しない
// ❌ myNewResponse.cookies.set('custom', 'value'); // 禁止
```

### レスポンスオブジェクトの扱い
```typescript
// supabaseResponseをそのまま返すことが重要
// cookieの同期を保つため
return supabaseResponse;

// ブラウザとサーバーのセッション同期を保つため、
// 上記のルールを必ず守ること
```

## 自動ユーザー作成の仕組み

### データベーストリガーによる実装
```sql
-- SECURITY DEFINER で権限昇格
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.sample_users (id, email, name)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'name', 'ユーザー')
  );
  RETURN new;
END;
$$;

-- auth.users テーブルへの挿入時に自動実行
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

## サインイン・サインアップ実装

### フォームコンポーネントの構成
```typescript
// 'use client' 必須 - フォームインタラクションのため
const { form, action, handleSubmitWithAction, resetFormAndAction } =
  useHookFormAction(signInAction, zodResolver(signInSchema), {
    formProps: {
      mode: 'onSubmit',
      defaultValues: { email: '', password: '' },
    },
    actionProps: {
      onSuccess: () => {
        toast.success('サインインしました');
        resetFormAndAction();
        router.push('/dashboard/mypage');
      },
      onError: ({ error }) => {
        toast.error(error.serverError || '予期せぬエラーが発生しました');
      },
    },
  });
```

### パスワード表示切り替えの実装
```typescript
// アクセシビリティを考慮したパスワード表示切り替え
<Button
  type="button"
  variant="ghost"
  onClick={() => setShowPassword((s) => !s)}
>
  {showPassword ? <EyeOff /> : <Eye />}
  <span className="sr-only">
    {showPassword ? 'パスワードを隠す' : 'パスワードを表示'}
  </span>
</Button>
```

### バリデーションスキーマ
```typescript
// 強力なパスワード要件を正規表現で実装
const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,32}$/;

// パスワード確認の一致チェック
.refine((data) => data.password === data.confirmPassword, {
  message: 'パスワードが一致しません',
  path: ['confirmPassword'],
});
```

### メール確認フロー
```typescript
// auth/confirm/route.ts - OTP検証
const { error } = await supabase.auth.verifyOtp({
  type,
  token_hash,
});

// エラー時はクエリパラメータで通知
return NextResponse.redirect(
  new URL('/auth/login?error=invalid-token', request.url)
);
```

## サインアウト実装

### シンプルなServer Action
```typescript
// フォームから直接呼び出し可能
export async function signOutSimpleAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/auth/login');
}
```

### Protected Layoutでの実装
```typescript
// Protected Layoutのヘッダーにサインアウトボタンを配置
<form action={signOutSimpleAction}>
  <Button variant="ghost" size="sm" type="submit">
    ログアウト
  </Button>
</form>
```

## フォームエラー処理

### フィールド別エラー表示
```typescript
// FormErrorコンポーネントで一貫したエラー表示
<FormError error={form.formState.errors.email} label="メールアドレス" />
```

### サーバーエラーの処理
```typescript
// flattenValidationErrorsでフィールド別エラーを返す
.inputSchema(signInSchema, {
  handleValidationErrorsShape: async (ve) =>
    flattenValidationErrors(ve).fieldErrors,
})
```

## 実装チェックリスト

- [ ] privateActionClientを使用して認証が必要なアクションを保護
- [ ] Query層でgetTodoByIdWithAuth()のような認可チェック付き関数を実装
- [ ] Mutation層でもupdateTodoWithAuth()のような認可チェックを実装
- [ ] エラーはthrowせず戻り値で返す（フォーム入力保持のため）
- [ ] 401/403エラーに対応するページを実装
- [ ] ミドルウェアでauth.getUser()を必ず呼び出す
- [ ] RLSポリシーを適切に設定
- [ ] キャッシュタグを適切に設定して無効化戦略を実装
- [ ] サインアップ時の自動ユーザー作成トリガーを設定
- [ ] Server Actionsにmetadataを必ず設定（Sentry統合のため）
- [ ] フォームにはuseHookFormActionを使用して型安全な実装
- [ ] パスワード表示切り替えにsr-onlyでアクセシビリティ対応
- [ ] 実行中はボタンをdisabledに設定してUX向上
- [ ] resetFormAndAction()でフォームをリセット
- [ ] toast通知で操作結果をフィードバック
