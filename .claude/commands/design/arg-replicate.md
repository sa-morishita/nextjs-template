Playwright MCPで参考サイトのデザインを再現

---

allowed-tools: ["mcp__playwright__browser_navigate", "mcp__playwright__browser_take_screenshot", "mcp__playwright__browser_snapshot", "mcp__playwright__browser_evaluate", "mcp__playwright__browser_click", "mcp__playwright__browser_hover", "mcp__playwright__browser_resize", "mcp__playwright__browser_network_requests", "mcp__playwright__browser_wait_for", "Write", "Edit", "Read", "LS", "Bash"]

description: "Playwright MCPでDOM/CSS抽出し、Next.jsコンポーネントとして高精度デザイン再現を実行"

---

# arg-replicate

参考サイトのURLを指定すると、Playwright MCPを使ってDOM構造とCSS情報を抽出し、Next.js App Router形式の高精度なデザイン再現コンポーネントを生成します。

## 機能概要

このコマンドは以下のワークフローを自動実行します：

1. **高精度DOM抽出**: Playwright MCPでDOM構造とCSS情報を取得
2. **視覚的分析**: スクリーンショット撮影による視覚的確認
3. **Next.js生成**: App Router対応のTailwind CSS + TypeScriptコンポーネント作成
4. **自動配置**: `src/app/design-sample`に構造化されたファイルを生成

## 使用方法

```
/design:arg-replicate https://example.com/design-page
```

## Instructions

### Step 1: URL検証と初期設定

参考サイトURL: $ARGUMENTS

1. 引数が有効なURLか確認
2. `src/app/design-sample`ディレクトリの存在確認（なければ作成）
3. サンプル名を現在時刻から自動生成（例：`sample-20250913-143022`）

### Step 2: Playwright MCPによるデータ抽出

以下を順次実行：

1. **サイトナビゲーション**:

   ```
   mcp__playwright__browser_navigate でサイトにアクセス
   必要に応じて mcp__playwright__browser_wait_for でページ読み込み待機
   ```

2. **ブラウザ環境設定**:

   ```
   mcp__playwright__browser_resize でデスクトップサイズに設定
   レスポンシブ確認のため複数サイズでの撮影準備
   ```

3. **視覚的分析**:

   ```
   mcp__playwright__browser_take_screenshot でフルページスクリーンショット撮影
   fullPage: true オプションでページ全体を取得
   ```

4. **DOM構造とアクセシビリティ情報取得**:

   ```
   mcp__playwright__browser_snapshot でHTML構造とアクセシビリティツリーを取得
   （セマンティック構造、要素の階層関係、ARIA情報を含む）
   ```

5. **CSS計算値とスタイル情報取得**:

   ```
   mcp__playwright__browser_evaluate でJavaScript実行
   - getComputedStyle() で各要素の計算済みスタイルを取得
   - フォント、カラー、サイズ、間隔の詳細情報を収集
   - レスポンシブブレークポイントの検出
   ```

6. **ネットワーク情報取得**:

   ```
   mcp__playwright__browser_network_requests でリソース読み込み情報を取得
   フォント、画像、CSSファイルのURL情報を抽出
   ```

### Step 3: データ分析と構造化

抽出データから以下を分析：

1. **レイアウト構造**: Grid/Flexboxの使用パターン → Tailwind gridとflexクラスに変換
2. **カラーパレット**: 使用色の抽出 → Tailwind color-\*クラスまたはカスタムカラー定義
3. **タイポグラフィ**: フォントサイズ、行間、フォントファミリー → text-_, leading-_, font-\*クラス
4. **間隔設計**: margin、paddingの一貫性 → m-_, p-_, space-\*クラス
5. **レスポンシブ**: ブレークポイントとメディアクエリ → sm:, md:, lg:, xl: prefixで実装
6. **コンポーネント分割**: 再利用可能な部品の特定

**CSS → Tailwind 変換ルール:**

- `display: flex` → `flex`
- `justify-content: center` → `justify-center`
- `margin: 16px` → `m-4`
- `color: #3b82f6` → `text-blue-500`
- `font-size: 1.125rem` → `text-lg`
- メディアクエリ → レスポンシブprefix（`md:text-xl`など）

### Step 4: Next.js コンポーネント生成

以下を参考にファイル・フォルダ構造を生成：

```
src/app/design-sample/[sample-name]/
├── page.tsx              # メインページ
├── layout.tsx            # レイアウト（必要に応じて）
├── components/
│   ├── Header.tsx        # ヘッダーコンポーネント
│   ├── Navigation.tsx    # ナビゲーション
│   ├── MainContent.tsx   # メインコンテンツ
│   ├── Sidebar.tsx       # サイドバー（必要に応じて）
│   └── Footer.tsx        # フッター
├── styles/
│   └── globals.css       # カスタムCSS（Tailwindで表現困難な部分のみ）
└── README.md             # 再現の詳細情報と元URL
```

**重要: CSSスタイリングの方針**

- **最優先**: Tailwind CSSクラスでの実装（color-_, spacing-_, typography-*, layout-*など）
- **Tailwind変換**: 抽出したCSS値をTailwindユーティリティクラスに可能な限り変換
- **カスタムCSS最小化**: `styles/globals.css`は以下の場合のみ使用
  - 複雑なアニメーション（keyframes）
  - 特殊な擬似要素やセレクター
  - Tailwindで表現不可能な特殊プロパティ
- **CSS変数活用**: 繰り返し使用する値はTailwind設定やCSS変数で管理

### Step 5: 品質担保とドキュメント化

1. **コード品質**:
   - TypeScript厳格型付け
   - アクセシビリティ対応（aria属性、セマンティックHTML）
   - SEO最適化（meta、structured data）

2. **パフォーマンス**:
   - Next.js Image最適化
   - 適切なローディング戦略
   - CSS-in-JS最小化

3. **ドキュメント**:
   - README.mdに元サイトとの差分説明
   - 使用したTailwindクラスの解説
   - カスタマイズ方法の記載

### Step 6: 検証と完了確認

1. **生成ファイル確認**: 全ファイルが正常に作成されたか
2. **構文チェック**: TypeScriptエラーがないか
3. **アクセス情報**: 生成されたページのローカルパス表示
4. **次のステップ**: ブラウザでの確認方法を案内

### 画像素材の処理

**重要**: 画像は全て[Lorem Picsum](https://picsum.photos/)でプレースホルダー画像に置き換える

```tsx
// 基本: https://picsum.photos/width/height
<Image src="https://picsum.photos/800/600" alt="placeholder" width={800} height={600} />

// 同じ画像を使い回す場合はseedを指定
<Image src="https://picsum.photos/seed/hero/1920/1080" alt="hero" width={1920} height={1080} />
```

### Step 7: コード品質検証

生成されたコードの品質を確認するため、以下のコマンドを実行：

1. **Biome検証**: コードフォーマットとリント確認

   ```
   pnpm biome check --write .
   ```

2. **TypeScript検証**: 型チェック実行

   ```
   pnpm typecheck
   ```

3. **エラー対応**: 検証で問題が見つかった場合は修正を実行

## 出力フォーマット例

実行完了時のメッセージ例：

```
✅ デザイン再現完了！

📁 生成場所: src/app/design-sample/sample-20250913-143022/
🌐 元サイト: https://example.com/design-page
📄 生成ファイル: 8個のコンポーネント + スタイル

🔍 確認方法:
1. pnpm dev でサーバー起動
2. http://localhost:3000/design-sample/sample-20250913-143022 でアクセス

📋 含まれる機能:
- レスポンシブデザイン対応
- アクセシビリティ準拠
- TypeScript厳格型付け
- Tailwind CSS最適化
```

## 高度な機能

### レスポンシブ対応

- 自動的にモバイル/タブレット/デスクトップのブレークポイント検出
- Tailwindのresponsive prefixで適切に実装

### アニメーション保持

- CSS transitionsとanimationsを可能な限り再現
- Framer Motion使用の提案（必要に応じて）

### 画像最適化

- 画像URLを検出してNext.js Image コンポーネントで最適化
- placeholder="blur"適用の提案

## エラーハンドリング

- **アクセス不可**: robots.txtやCORSエラー時の代替手法
- **複雑なJS**: SPA動的コンテンツの静的再現方法
- **フォント**: Google Fonts等の外部フォント適切処理

## セキュリティ考慮

- 外部URLへの安全なアクセスのみ
- 機密情報を含む可能性があるサイトへの警告
- 生成コードのサニタイジング

## パフォーマンス最適化

- 必要最小限のCSS生成
- 重複コンポーネントの統合提案
- バンドルサイズ最適化の提案
