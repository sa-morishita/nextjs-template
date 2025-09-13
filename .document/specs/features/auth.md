# 認証機能仕様書

## 概要

Better Authを使用したユーザー認証システム。メール認証、パスワードリセット、セッション管理を提供。

## 実装概要

### Server Actions

**ファイル**: `src/lib/actions/auth.ts`

#### 主要アクション

1. **signInAction**
   - ユーザーログイン処理
   - 成功時: `/dashboard`にリダイレクト
   - バリデーション: `signInSchema`

2. **signUpAction** 
   - ユーザー登録処理
   - メール認証が必要
   - 成功時: `/auth/verify-email/check-email`にリダイレクト
   - バリデーション: `signUpSchema`

3. **resendVerificationEmailAction**
   - 認証メール再送信
   - バリデーション: `resendVerificationEmailSchema`

4. **forgotPasswordAction**
   - パスワードリセット要求
   - バリデーション: `forgotPasswordSchema`

5. **resetPasswordAction**
   - パスワードリセット実行
   - 成功時: `/auth/login`にリダイレクト
   - バリデーション: `resetPasswordSchema`

6. **signOutAction**
   - ログアウト処理
   - 成功時: `/auth/login`にリダイレクト

## 画面構成

### 1. ログイン画面 (`/auth/login`)
- **コンポーネント**: `src/app/(auth)/auth/_components/sign-in-form.tsx`
- **機能**: 
  - メール/パスワード入力
  - ログイン実行
  - パスワード忘れリンク

### 2. サインアップ画面 (`/auth/signup`)
- **コンポーネント**: `src/app/(auth)/auth/_components/sign-up-form.tsx`
- **機能**:
  - 名前、メール、パスワード入力
  - アカウント作成実行

### 3. メール認証画面 (`/auth/verify-email`)
- **サブページ**:
  - `/check-email`: メール確認待ち画面
  - `/success`: 認証成功画面
  - `/error`: 認証エラー画面
- **コンポーネント**: `src/app/(auth)/auth/verify-email/_components/verification-message.tsx`

### 4. パスワード関連画面
- **忘れた場合** (`/auth/forgot-password`): `forgot-password-form.tsx`
- **リセット** (`/auth/reset-password`): `reset-password-form.tsx`

## データフロー

```
UI Component → Server Action → Service Layer → Better Auth
```

### サービス層

**ファイル**: `src/lib/services/auth/`

主要サービス関数:
- `signInWithEmail()`
- `signUpWithEmail()`
- `resendVerificationEmail()`
- `requestPasswordReset()`
- `resetPassword()`

## バリデーション

**ファイル**: `src/lib/schemas/`

- `signInSchema`: ログインフォーム検証
- `signUpSchema`: サインアップフォーム検証
- `forgotPasswordSchema`: パスワード忘れフォーム検証
- `resetPasswordSchema`: パスワードリセットフォーム検証
- `resendVerificationEmailSchema`: メール再送信フォーム検証

## セキュリティ考慮事項

1. **メール認証必須**: 登録時にメール認証が必要
2. **パスワード強度**: Zodスキーマによる検証
3. **トークンベース**: リセット時の一時的なトークン使用
4. **セッション管理**: Better Authによる安全なセッション管理

## テスト

**ファイル**: `src/app/(auth)/auth/_components/__tests__/`

- `sign-in-form.test.tsx`
- `sign-up-form.test.tsx`
- `forgot-password-form.test.tsx`
- `reset-password-form.test.tsx`

## エラーハンドリング

- `next-safe-action`による自動エラーキャッチ
- フラットバリデーションエラー処理
- 日本語エラーメッセージ対応