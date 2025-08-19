# Next.js Template 実装パターンガイド

実装したい機能から必要なファイルを素早く見つけるためのインデックスです。
**ここに記載されているルールは必ず守ってください。**

## GitMCPでの使い方

このガイドはGitMCP（git-mcp-template）と連携して使用することを前提としています。

### 重要：GitMCPの使用ルール

1. **searchは使用禁止** - 適切なクエリ作成が困難なため、searchツールは使用しません
2. **fetchのみ使用** - このガイドに記載されたファイルを`fetch_url_content`で直接取得します
3. **目的** - GitMCPは探し物のコードを見つけるためではなく、**Next.jsの実装パターンを学ぶため**に使用します

### 基本的な使用方法

1. **全体ドキュメント取得**: `fetch_nextjs-template_documentation()` - README等の基本情報
2. **特定ファイル取得**: `fetch_url_content("https://raw.githubusercontent.com/sa-morishita/nextjs-template/main/ファイルパス")`

### 学習すべき内容

取得したファイルから以下のパターンを学習してください：

- **Next.jsのベストプラクティス** - RSC、Container/Presentational、Server Actions等
- **データフローのパターン** - action → usecase → query/mutation
- **エラーハンドリング** - next-safe-actionによる統一的なエラー処理
- **ディレクトリ構造と命名規則** - プロジェクト全体で統一されたルール

学んだパターンを忠実に再現して実装することで、コード品質を保つことができます。

## パターン1: ページ作成とルーティング

### 🎯 こんな時に参照

- 新しいページを作る
- データ取得を含むページを実装する
- ローディング状態を適切に表示したい

### ⚠️ 絶対に守るべきルール

- **page.tsx** → 必ず`app`ディレクトリに配置する
- **Container/Presentationalパターンの遵守** → データ取得とUI表示を必ず分離する
- **RSC（Server Component）がデフォルト** → インタラクティブな部分のみ`'use client'`を付ける
- **Suspenseは必須** → 非同期データ取得は必ずSuspenseで囲む
- **Skeletonフォールバック** → Suspenseのfallbackには必ずSkeletonを用意する
- **\_componentsへの切り分け** → UIコンポーネントは`_components`、コンテナは`_containers`に配置
- **RSCでのsessionとデータquery取得** → 認証情報とデータ取得は必ずServer Component内で行う

### 📁 参照ファイル

#### GitMCPで取得すべきファイル

```javascript
// パターン1を実装する時は、以下のファイルを必ず取得してください：

// 1. 基本的なページ構成
fetch_url_content(
  "https://raw.githubusercontent.com/sa-morishita/nextjs-template/main/src/app/(protected)/dashboard/tasks/page.tsx"
);
// → Suspense、Skeleton、dynamic = 'force-dynamic'の使い方

// 2. Container/Presentationalパターン
fetch_url_content(
  "https://raw.githubusercontent.com/sa-morishita/nextjs-template/main/src/app/(protected)/dashboard/tasks/_containers/task-form/index.tsx"
);
fetch_url_content(
  "https://raw.githubusercontent.com/sa-morishita/nextjs-template/main/src/app/(protected)/dashboard/tasks/_containers/task-form/container.tsx"
);
fetch_url_content(
  "https://raw.githubusercontent.com/sa-morishita/nextjs-template/main/src/app/(protected)/dashboard/tasks/_containers/task-form/presentational.tsx"
);
// → データ取得とUI表示の分離パターン

// 3. Client Component例
fetch_url_content(
  "https://raw.githubusercontent.com/sa-morishita/nextjs-template/main/src/app/(protected)/dashboard/tasks/_components/task-form.tsx"
);
// → 'use client'の使用例

// 4. データ取得（RSCでのquery実行）
fetch_url_content(
  "https://raw.githubusercontent.com/sa-morishita/nextjs-template/main/src/lib/queries/todos.ts"
);
// → Server Componentでのデータ取得パターン
```

---

## パターン2: フォーム実装

### 🎯 こんな時に参照

- バリデーション付きフォームを作る
- Server Actionsでフォーム送信を処理する
- エラーハンドリングを適切に行いたい
- ビジネスロジックを含むフォームを実装する

### ⚠️ 絶対に守るべきルール

- **useHookFormAction** → フォーム実装では必ずこれを使う（useActionは使わない）
- **next-safe-action** → Server Actionは必ずこれで定義する
- **bind** → IDなど画面に表示しない値は`bindArgsSchemas`で渡す
- **クライアント/サーバー共通schema** → バリデーションスキーマは必ず共通化する
- **privateActionClient** → 認証が必要なアクションは必ずこれを使う
- **actionからはusecaseを呼ぶ** → actionから直接query/mutationを呼ばない
- **query/mutationはusecaseからのみ** → 必ずusecaseを経由する
- **'use server'** → actionファイルの先頭に必ず記述
- **'server-only'** → usecase/query/mutationファイルは必ずこれをimport
- **空文字禁止** → Zodスキーマでは必ず`.min(1)`を付ける
- **domainにビジネスロジック集約** → ビジネスルールは必ずdomainディレクトリに
- **returnValidationErrors** → usecaseでのバリデーションエラーは必ずこれで返す
- **try-catch禁止** → action/usecase/query/mutationではよほどの理由がない限り使わない
- **handleServerError** → エラーハンドリングは必ずnext-safe-actionに任せる

### 📁 参照ファイル

#### GitMCPで取得すべきファイル

```javascript
// パターン2（フォーム実装）を実装する時は、以下のファイルを必ず取得してください：

// 1. フォームコンポーネント例
fetch_url_content(
  "https://raw.githubusercontent.com/sa-morishita/nextjs-template/main/src/app/(protected)/dashboard/tasks/_components/task-form.tsx"
);
// → useHookFormAction、zodResolver、toast通知の実装

// 2. Server Actions（データフロー全体を理解）
fetch_url_content(
  "https://raw.githubusercontent.com/sa-morishita/nextjs-template/main/src/lib/actions/todos.ts"
);
// → privateActionClient、bindArgsSchemas、'use server'の使い方

// 3. Usecase層
fetch_url_content(
  "https://raw.githubusercontent.com/sa-morishita/nextjs-template/main/src/lib/usecases/todos.ts"
);
// → returnValidationErrors、ビジネスロジック、権限チェック

// 4. Domain層（ビジネスルール）
fetch_url_content(
  "https://raw.githubusercontent.com/sa-morishita/nextjs-template/main/src/lib/domain/todos/constants.ts"
);
fetch_url_content(
  "https://raw.githubusercontent.com/sa-morishita/nextjs-template/main/src/lib/domain/todos/validators.ts"
);
// → ビジネスロジックの集約

// 5. データアクセス層
fetch_url_content(
  "https://raw.githubusercontent.com/sa-morishita/nextjs-template/main/src/lib/queries/todos.ts"
);
fetch_url_content(
  "https://raw.githubusercontent.com/sa-morishita/nextjs-template/main/src/lib/mutations/todos.ts"
);
// → DB操作の実装

// 6. Zodスキーマ
fetch_url_content(
  "https://raw.githubusercontent.com/sa-morishita/nextjs-template/main/src/lib/schemas/auth.ts"
);
// → バリデーションスキーマの定義方法
```

---

## パターン3: 認証実装

### 🎯 こんな時に参照

- メール/パスワード認証を実装する
- パスワードリセット機能を作る
- メール認証を実装する
- ソーシャルログイン（LINE）を追加する
- ページの認証保護を行う

### ⚠️ 絶対に守るべきルール

- **better-auth** → 認証は必ずこれを使う
- **getSession** → Server Componentでのセッション取得は必ずこれを使う
- **メール認証必須** → `requireEmailVerification: true`を必ず設定
- **パスワードリセット** → トークン有効期限を必ず設定する
- **resendとReact Email** → メール送信は必ずこの組み合わせ
- **LINEログイン時のプロフィール画像永続化** → 必ず実装する
- **middlewareは最低限のガード** → セッション有無のチェックのみ
- **middlewareではNode.js使えない** → 詳細な権限チェックは不可
- **詳細なガードはlayout.tsx** → ロール権限などは各ページのlayout.tsxで実装

### 📁 参照ファイル

#### GitMCPで取得すべきファイル

```javascript
// パターン3（認証実装）を実装する時は、以下のファイルを必ず取得してください：

// 1. Better Auth設定
fetch_url_content(
  "https://raw.githubusercontent.com/sa-morishita/nextjs-template/main/src/lib/services/auth/config.ts"
);
// → メール認証必須設定、LINE OAuth、プロフィール画像永続化

// 2. 認証サービス
fetch_url_content(
  "https://raw.githubusercontent.com/sa-morishita/nextjs-template/main/src/lib/services/auth/service.ts"
);
// → signIn/signUp、getSessionの実装

// 3. メールテンプレート例
fetch_url_content(
  "https://raw.githubusercontent.com/sa-morishita/nextjs-template/main/src/lib/utils/email-templates/auth/email-verification.tsx"
);
fetch_url_content(
  "https://raw.githubusercontent.com/sa-morishita/nextjs-template/main/src/lib/utils/email-templates/auth/password-reset.tsx"
);
// → React Emailテンプレート

// 4. Middleware
fetch_url_content(
  "https://raw.githubusercontent.com/sa-morishita/nextjs-template/main/src/middleware.ts"
);
// → セッション有無のチェック

// 5. 保護されたルートのlayout
fetch_url_content(
  "https://raw.githubusercontent.com/sa-morishita/nextjs-template/main/src/app/(protected)/layout.tsx"
);
// → 詳細な権限チェックの実装
```

---

## パターン4: ファイルアップロード・Storage

### 🎯 こんな時に参照

- 画像アップロード機能を実装する
- Supabase Storageを使う
- 大きなファイルをアップロードする
- アップロードのテストを書く

### ⚠️ 絶対に守るべきルール

- **supabaseClient** → Storage操作は必ずsupabaseAdminを使う
- **巨大ファイルはServer Actionに送れない** → 必ずgenerateUploadUrlを使う
- **アップロードフロー** → 以下の3ステップを必ず守る：
  1. Server ActionでgenerateUploadUrlを呼び、プリサインドURLを発行
  2. クライアントから直接Supabase Storageへアップロード
  3. アップロード成功後、ファイルURLをDBに保存
- **image-upload.service.ts** → URL発行とファイル削除の実装を参照
- **upload.ts (usecase)** → URL発行からDB保存までのフロー実装を参照
- **diary-form.tsx** → フロントエンドでの実装パターンを参照
- **storageの結合テスト** → 必ずmemfsでモックする
- **GitHub Actions** → Supabaseのバケット作成設定が必要

### 📁 参照ファイル

#### GitMCPで取得すべきファイル

```javascript
// パターン4（ファイルアップロード）を実装する時は、以下のファイルを必ず取得してください：

// 1. Supabase Storage設定
fetch_url_content(
  "https://raw.githubusercontent.com/sa-morishita/nextjs-template/main/src/lib/supabase/storage.ts"
);
// → supabaseAdminの設定

// 2. アップロードサービス（URL発行パターン）
fetch_url_content(
  "https://raw.githubusercontent.com/sa-morishita/nextjs-template/main/src/lib/services/image-upload.service.ts"
);
// → generateUploadUrlでプリサインドURL発行

// 3. アップロードのusecase
fetch_url_content(
  "https://raw.githubusercontent.com/sa-morishita/nextjs-template/main/src/lib/usecases/upload.ts"
);
// → URL発行からDB保存までのフロー

// 4. 画像アップロード付きフォームの例（diary機能）
fetch_url_content(
  "https://raw.githubusercontent.com/sa-morishita/nextjs-template/main/src/app/(protected)/dashboard/diary/_components/diary-form.tsx"
);
// → クライアントから直接アップロード→DB保存の実装

// 5. Storageテスト
fetch_url_content(
  "https://raw.githubusercontent.com/sa-morishita/nextjs-template/main/src/lib/services/__tests__/profile-image.storage.test.ts"
);
// → memfsを使ったテスト

// 6. CI設定
fetch_url_content(
  "https://raw.githubusercontent.com/sa-morishita/nextjs-template/main/.github/workflows/ci.yml"
);
fetch_url_content(
  "https://raw.githubusercontent.com/sa-morishita/nextjs-template/main/supabase/config.toml"
);
// → バケット作成の設定
```

---

## パターン5: テスト実装

### 🎯 こんな時に参照

- 単体テストを書く
- 統合テストを書く
- テスト環境をセットアップする
- GitHub Actionsでテストを実行する

### ⚠️ 絶対に守るべきルール

- **単体テストと結合テスト、ストレージテスト** → 必ず分ける
- **configとsetupを分ける** → vitest.config.mtsは用途別に作成
- **テスト用env** → `.env.test`を必ず用意する
- **GitHub Actions実行** → GitHub Secretsに環境変数登録が必須
- **テスト対象を絞る** → バリデーションとビジネスロジックに集中
- **結合テストは正常系と異常系** → 必ず両方書く
- **ファイル命名規則**：
  - ユニットテスト: `*.test.tsx` または `*.test.ts`
  - 結合テスト: `*.integration.test.ts`
  - ストレージテスト: `*.storage.test.ts`

### 📁 参照ファイル

#### GitMCPで取得すべきファイル

##### 1. ユニットテスト（コンポーネント・純粋な関数のテスト）

```javascript
// ユニットテストを実装する時に必要なファイル：

// 基本設定
fetch_url_content(
  "https://raw.githubusercontent.com/sa-morishita/nextjs-template/main/vitest.config.mts"
);
fetch_url_content(
  "https://raw.githubusercontent.com/sa-morishita/nextjs-template/main/src/test/setup.ts"
);
// → Vitestの基本設定とセットアップ

// コンポーネントテストの例
fetch_url_content(
  "https://raw.githubusercontent.com/sa-morishita/nextjs-template/main/src/app/(auth)/auth/_components/__tests__/sign-up-form.test.tsx"
);
fetch_url_content(
  "https://raw.githubusercontent.com/sa-morishita/nextjs-template/main/src/app/(protected)/dashboard/tasks/_components/__tests__/task-form.test.tsx"
);
// → React Testing Library、フォームのモック、イベントハンドリング

// テスト対象のコンポーネント（参考用）
fetch_url_content(
  "https://raw.githubusercontent.com/sa-morishita/nextjs-template/main/src/app/(auth)/auth/_components/sign-up-form.tsx"
);
// → どのようにコンポーネントがテストされているか理解するため
```

##### 2. 結合テスト（usecase/query/mutation/serviceのテスト）

```javascript
// 結合テストを実装する時に必要なファイル：

// 結合テスト設定
fetch_url_content(
  "https://raw.githubusercontent.com/sa-morishita/nextjs-template/main/vitest.integration.config.mts"
);
fetch_url_content(
  "https://raw.githubusercontent.com/sa-morishita/nextjs-template/main/src/test/integration-setup.ts"
);
fetch_url_content(
  "https://raw.githubusercontent.com/sa-morishita/nextjs-template/main/src/test/integration-setup-env.ts"
);
// → PGLiteを使った結合テスト環境

// データベース設定とヘルパー
fetch_url_content(
  "https://raw.githubusercontent.com/sa-morishita/nextjs-template/main/src/test/helpers/database-setup.ts"
);
fetch_url_content(
  "https://raw.githubusercontent.com/sa-morishita/nextjs-template/main/src/test/helpers/validation-error-assertions.ts"
);
// → PGLiteセットアップ、バリデーションエラーのアサーション

// テストファクトリー
fetch_url_content(
  "https://raw.githubusercontent.com/sa-morishita/nextjs-template/main/src/test/factories/index.ts"
);
fetch_url_content(
  "https://raw.githubusercontent.com/sa-morishita/nextjs-template/main/src/test/factories/fishery-factory.ts"
);
// → Fisheryを使ったテストデータ生成

// 結合テストの例
fetch_url_content(
  "https://raw.githubusercontent.com/sa-morishita/nextjs-template/main/src/lib/usecases/__tests__/todos.integration.test.ts"
);
fetch_url_content(
  "https://raw.githubusercontent.com/sa-morishita/nextjs-template/main/src/lib/queries/__tests__/todos.integration.test.ts"
);
fetch_url_content(
  "https://raw.githubusercontent.com/sa-morishita/nextjs-template/main/src/lib/mutations/__tests__/todos.integration.test.ts"
);
// → 正常系・異常系のテストパターン
```

##### 3. ストレージテスト（ファイルアップロード関連のテスト）

```javascript
// ストレージテストを実装する時に必要なファイル：

// ストレージテスト設定
fetch_url_content(
  "https://raw.githubusercontent.com/sa-morishita/nextjs-template/main/vitest.storage.config.mts"
);
fetch_url_content(
  "https://raw.githubusercontent.com/sa-morishita/nextjs-template/main/src/test/storage-setup.ts"
);
fetch_url_content(
  "https://raw.githubusercontent.com/sa-morishita/nextjs-template/main/src/test/storage-setup-env.ts"
);
// → memfsを使ったファイルシステムのモック

// ストレージテストの例
fetch_url_content(
  "https://raw.githubusercontent.com/sa-morishita/nextjs-template/main/src/lib/services/__tests__/profile-image.storage.test.ts"
);
// → Supabase Storage操作のテスト方法

// server-onlyのモック
fetch_url_content(
  "https://raw.githubusercontent.com/sa-morishita/nextjs-template/main/src/test/mocks/server-only.ts"
);
// → server-only importのモック方法
```

##### 4. CI/CD設定

```javascript
// GitHub Actionsでテストを実行する時に必要なファイル：

// GitHub Actions設定
fetch_url_content(
  "https://raw.githubusercontent.com/sa-morishita/nextjs-template/main/.github/workflows/ci.yml"
);
// → 並列実行、環境変数、Supabaseセットアップ

// 環境変数の例
fetch_url_content(
  "https://raw.githubusercontent.com/sa-morishita/nextjs-template/main/.env.test.local.example"
);
// → テスト用環境変数のテンプレート
```

---

## 💡 使い方のヒント

1. **作りたい機能を決める** → 該当パターンを選ぶ
2. **絶対に守るべきルール** → 赤字の項目は必須
3. **参照ファイルを開く** → 実装例を確認
4. **パターンを組み合わせる** → 例：認証付きフォームなら パターン2 + パターン3

## 🔍 クイックリファレンス

- **新規ページ**: パターン1でContainer/Presentationalパターンを確認
- **フォーム追加**: パターン2でaction→usecase→query/mutationフローを理解
- **認証追加**: パターン3でBetter AuthとgetSessionの使い方を確認
- **画像アップロード**: パターン4でgenerateUploadUrlの実装を参照
- **テスト追加**: パターン5で単体/統合/ストレージの分け方を確認
