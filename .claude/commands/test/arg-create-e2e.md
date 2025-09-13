指定URLのE2Eテストを自動生成・デバッグまで一括実行

---
allowed-tools: ["mcp__playwright__browser_navigate", "mcp__playwright__browser_snapshot", "mcp__playwright__browser_close", "Write", "Read", "Edit", "Bash", "Glob"]
description: "Playwright MCPでPage Object + テストケース生成 + 自動デバッグを一括実行"
---

# arg-create-e2e

URLまたは自然言語のテストケースから、Page Object Model生成・テスト実装・デバッグまでを一括で実行します。

## Important Notes

**作業内容が曖昧な場合は、必ずユーザーに確認してから実行すること。**
- 不明確な要件や複雑なテストケースの場合
- 複数の解釈が可能な指示の場合  
- 対象URLや機能範囲が特定しきれない場合

ユーザーと共同で以下を明確にする：
- 具体的なテスト対象URL
- 期待するテストシナリオ
- 検証すべきポイント
- Page Objectの粒度・分割方針

## Instructions

入力: $ARGUMENTS

### Phase 1: 入力の解析と Page Object 生成

1. 引数を解析
   - URLが含まれる場合 → Page Object生成フェーズへ
   - テストケースのみの場合 → 既存Page Objectを確認

2. **Page Object Model の自動生成**（URLがある場合）
   - Playwright MCPでURLにアクセス
   - Accessibility Snapshotを取得
   - DOM構造を分析してロケーター抽出
   
   生成例:
   ```typescript
   export class LoginPage {
     constructor(private page: Page) {}
     
     get emailInput() { 
       return this.page.getByRole('textbox', { name: 'メールアドレス' });
     }
     get passwordInput() {
       return this.page.getByRole('textbox', { name: 'パスワード' });
     }
     get loginButton() {
       return this.page.getByRole('button', { name: 'ログイン' });
     }
     
     async login(email: string, password: string) {
       await this.emailInput.fill(email);
       await this.passwordInput.fill(password);
       await this.loginButton.click();
     }
   }
   ```

   ファイル配置: e2e/pages/ ディレクトリに保存

### Phase 2: テストケース実装

3. **既存Page Objectの確認**
   - e2e/pages/ を検索
   - 利用可能なページクラスを特定

4. **テストコードの自動生成**
   - 自然言語からPlaywrightコードに変換
   - Page Object Modelを活用
   - テストファイル生成（e2e/specs/）

   生成例:
   ```typescript
   import { test, expect } from '@playwright/test';
   import { LoginPage } from '../pages/LoginPage';
   
   test.describe('ユーザー認証', () => {
     test('ログインできる', async ({ page }) => {
       const loginPage = new LoginPage(page);
       await page.goto('/login');
       await loginPage.login('test@example.com', 'password');
       await expect(page).toHaveURL('/dashboard');
     });
   });
   ```

### Phase 3: 自動テスト実行・デバッグループ

5. **初回テスト実行**
   - !npx playwright test [生成したテストファイル] --reporter=html

6. **失敗時の自動デバッグ**
   - HTMLレポートを確認（http://localhost:9323）
   - Playwright MCPでレポート分析
   - Traceページから正確なDOM構造を取得
   - エラー原因の特定と修正を自動実行

7. **修正パターンの適用**
   ```typescript
   // 自動修正例
   
   // 問題: 要素が見つからない
   await page.click('button');
   // ↓ 修正
   await page.getByRole('button', { name: 'ログイン' }).click();
   
   // 問題: タイミング問題
   await page.click('.submit-btn');
   // ↓ 修正  
   await page.waitForLoadState('networkidle');
   await page.getByTestId('submit-btn').click();
   ```

8. **デバッグループの継続**
   - テスト実行 → 失敗確認 → 修正 → 再実行
   - 全テストがPASSするまで繰り返し

### 使用例

```bash
# URL + テストケース
/e2e:create "https://localhost:3000/login でログインしてダッシュボードに遷移"

# 既存ページのテストケース
/e2e:create "ユーザー設定でプロフィール名を変更できる"

# 複雑なフロー
/e2e:create "https://localhost:3000/register で新規登録→メール認証→初期設定完了"
```

### 完了時の報告

- 生成されたPage Objectファイル
- 生成されたテストファイル  
- 実行されたデバッグ修正の詳細
- 最終的なテスト実行結果
- 今後のメンテナンス提案

この統合コマンドにより、記事で紹介された「ロケーター記述→テストケース実装→デバッグ修正」の全工程を1コマンドで完結できます。