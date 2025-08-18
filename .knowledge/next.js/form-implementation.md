# Next.js App Router フォーム実装ガイド

## Server Components時代のフォーム設計

フォームコンポーネントは必ず`'use client'`を宣言する。理由：フォームはonChange、onSubmit、useState等のブラウザAPIとイベントハンドラを使用するため、Client Componentでなければ動作しない。Server Componentsはデータ取得とHTML生成のみを行い、インタラクティブな要素は扱えない。

## next-safe-action v8実装パターン

```tsx
// 必須の実装パターン
export const createTodoAction = privateActionClient
  .metadata({ actionName: 'createTodo' })  // 必須：Sentryトラッキング用
  .inputSchema(createTodoSchema)           // 必須：v8では.inputSchema()を使用
  .action(async ({ parsedInput, ctx }) => {
    // parsedInputは完全に型付けされたZod検証済みデータ
    // ctxにはミドルウェアで注入された認証情報等が含まれる
  })
```

v8での重要な変更：
- `.schema()`は廃止、`.inputSchema()`と`.outputSchema()`に分離
- `.metadata()`は必須、省略するとランタイムエラー
- Navigation actions（redirect()を含む）は`onSuccess`ではなく`onNavigation`コールバックをトリガー
- bindSchemaは廃止、bind値の型は自動推論される

## useHookFormActionによるフォーム統合

```tsx
const { form, action, handleSubmitWithAction, resetFormAndAction } =
  useHookFormAction(signInAction, zodResolver(signInSchema), {
    formProps: {
      mode: 'onSubmit',  // onChange, onBlur, onTouched, all も選択可能
      defaultValues: {    // 初期値は必ず設定（未定義を避ける）
        email: '',
        password: '',
      },
    },
    actionProps: {
      onSuccess: () => {
        // 成功時のみform.reset()を呼ぶ（エラー時は入力保持）
        toast.success('サインインしました')
        resetFormAndAction()  // フォームとアクション状態を同時にリセット
        router.push('/dashboard/mypage')
      },
      onError: ({ error }) => {
        // error.serverError: Safe Actionが返したエラー文字列
        // error.validationErrors: Zodバリデーションエラー
        // error.bindArgsValidationErrors: bind引数のバリデーションエラー
        toast.error(error.serverError || '予期せぬエラーが発生しました')
      },
      onNavigation: () => {
        // redirect()を含むアクションではこちらが呼ばれる
        toast.success('リダイレクトしています...')
      },
    },
  })

// action.isPending: 送信中の状態
// action.result: 最後の実行結果
// action.status: 'idle' | 'executing' | 'hasSucceeded' | 'hasErrored'
```

## Server Actionsのエラーハンドリング原則

Server Actionでthrowするとerror.tsxに遷移し、フォーム入力が失われる。必ず戻り値でエラーを表現する。next-safe-actionはこのパターンを自動化し、一貫性のあるエラーハンドリングを提供する。

## Safe Action Clientの詳細設定

```tsx
import { createSafeActionClient } from 'next-safe-action'
import * as Sentry from '@sentry/nextjs'
import { translateError } from './error-translator'

export const actionClient = createSafeActionClient({
  defineMetadataSchema() {
    return z.object({
      actionName: z.string(),  // Sentryイベント名として使用
    })
  },
  handleServerError(error, utils) {
    // 全てのServer Actionエラーがここを通る
    Sentry.captureException(error, {
      extra: {
        actionName: utils.metadata.actionName,
        clientInput: utils.clientInput,  // 注意：機密情報を含む可能性
      },
    })

    // 技術的エラーをユーザー向けメッセージに変換
    // 例：PGRST301 → "データの取得に失敗しました"
    return translateError(error)
  },
  // v8新機能：実行前後のフック
  async middleware(props) {
    const start = Date.now()
    const result = await props.next()
    const duration = Date.now() - start

    // パフォーマンスモニタリング
    if (duration > 1000) {
      console.warn(`Slow action: ${props.metadata.actionName} took ${duration}ms`)
    }

    return result
  },
})

// 認証が必要なアクション用クライアント
export const privateActionClient = actionClient.use(async ({ next, metadata }) => {
  const supabase = await createClient()
  const { error, data } = await supabase.auth.getUser()

  if (error || !data.user) {
    // 認証エラーは即座に返す（以降の処理を実行しない）
    throw new Error('認証が確認できませんでした。再度ログインしてください。')
  }

  // contextに認証情報を注入
  return next({
    ctx: {
      userId: data.user.id,
      userEmail: data.user.email,
      userRole: data.user.user_metadata?.role || 'user',
    }
  })
})
```

## bindパターンの使用方法

```tsx
// 編集フォームでIDを渡す場合
const updateTodoWithId = updateTodoAction.bind(null, todo.id)

// 複数の値をbindする場合
const updateWithContext = updateAction.bind(null, {
  todoId: todo.id,
  userId: user.id,
  timestamp: Date.now(),
})

// Server Action側での受け取り
export const updateTodoAction = privateActionClient
  .inputSchema(updateTodoSchema)
  .action(async ({ parsedInput, ctx }, todoId: string) => {
    // 第二引数以降でbind値を受け取る
    // bindされた値もサーバー側で検証可能
  })
```

bindパターンを使用する理由：
- フォーム要素以外の値をServer Actionに渡せる
- TypeScriptの型推論が効く
- Server Action実行時にサーバー側で値が束縛される

## キャッシュ無効化戦略

```tsx
// 作成時：ユーザーのリストと全体リストを無効化
revalidateTag(`todos-user-${userId}`)
revalidateTag('todos-all')

// 更新時：個別アイテムとユーザーリストを無効化
revalidateTag(`todo-${id}`)
revalidateTag(`todos-user-${userId}`)
// revalidatePath()は使わない（他のユーザーに影響しない）

// 削除時：全てのキャッシュを無効化
revalidateTag(`todo-${id}`)
revalidateTag(`todos-user-${userId}`)
revalidateTag('todos-all')

// 一括操作時：広範囲の無効化
revalidateTag(`todos-user-${userId}`)
revalidateTag('todos-all')
```

Next.js 15のキャッシュは非常にアグレッシブ。明示的に無効化しないと更新が反映されない。Request Memoizationも考慮し、同一リクエスト内でも最新データが必要な場合は`{ cache: 'no-store' }`を使用。

## Zodスキーマの二重使用パターン

Next.js App Routerでは、同一のZodスキーマをクライアント（zodResolver）とサーバー（.inputSchema()）の両方で使用する。これによりクライアント側の即座のフィードバックとサーバー側のセキュリティチェックを一貫性を持って実現。非同期バリデーション（DB重複チェック等）はサーバー側のみで実行される。


## 楽観的更新の実装

### useHookFormOptimisticActionの詳細な実装パターン

```tsx
// 完全な実装例（TodoItemコンポーネント）
export function TodoItemWithOptimistic({ todo, todos }: Props) {
  // フォーム不要な場合のuseHookFormOptimisticAction使用
  const { action } = useHookFormOptimisticAction(
    toggleTodoCompleteAction,
    zodResolver(toggleTodoCompleteSchema),
    {
      formProps: {
        defaultValues: {
          id: todo.id,
          completed: todo.completed,
        },
      },
      actionProps: {
        currentState: { todos },  // 現在の状態（必須）
        updateFn: (state, input) => ({
          // 楽観的に状態を更新する関数
          // inputは実行時に渡される値（Zodスキーマで検証済み）
          todos: state.todos.map((t) =>
            t.id === input.id
              ? { ...t, completed: input.completed, updatedAt: new Date() }
              : t
          ),
        }),
        onError: ({ error }) => {
          // エラー時は自動的に元の状態（currentState）に戻る
          // ユーザーに視覚的フィードバックを提供
          toast.error('更新に失敗しました。元の状態に戻しました。')
        },
      },
    },
  )

  // 重要：楽観的状態を優先的に表示
  // action.optimisticStateが存在する場合はそれを使用
  const displayTodos = action.optimisticState?.todos || todos
  const currentTodo = displayTodos.find(t => t.id === todo.id) || todo

  // アクションの実行状態
  const isPending = action.status === 'executing'

  // チェックボックスのハンドラー
  const handleToggle = () => {
    // action.execute()で楽観的更新を実行
    // フォームを経由せず直接実行可能
    action.execute({
      id: todo.id,
      completed: !currentTodo.completed,
    })
  }

  return (
    <div className={cn("flex items-center gap-3", isPending && "opacity-50")}>
      <Checkbox
        checked={currentTodo.completed}
        onCheckedChange={handleToggle}
        disabled={isPending}
        aria-label={`${currentTodo.title}を${currentTodo.completed ? '未完了' : '完了'}にする`}
      />
      <span className={cn(currentTodo.completed && "line-through")}>
        {currentTodo.title}
      </span>
      {isPending && <Spinner size="sm" />}
    </div>
  )
}
```

### 複数アイテムの楽観的更新

```tsx
// 削除操作での楽観的更新
const { action } = useHookFormOptimisticAction(
  deleteTodoAction,
  zodResolver(deleteTodoSchema),
  {
    actionProps: {
      currentState: { todos },
      updateFn: (state, input) => ({
        // 削除は即座に反映（UIから消える）
        todos: state.todos.filter(t => t.id !== input.id),
      }),
      onError: ({ error }) => {
        // エラー時は削除したアイテムが復活
        toast.error('削除に失敗しました。')
      },
    },
  },
)

// 並び替えでの楽観的更新
const { action } = useHookFormOptimisticAction(
  reorderTodosAction,
  zodResolver(reorderSchema),
  {
    actionProps: {
      currentState: { todos },
      updateFn: (state, input) => {
        // ドラッグ＆ドロップの結果を即座に反映
        const newTodos = [...state.todos]
        const [removed] = newTodos.splice(input.fromIndex, 1)
        newTodos.splice(input.toIndex, 0, removed)
        return { todos: newTodos }
      },
    },
  },
)
```

### 楽観的更新の重要なポイント

1. **`action.optimisticState`の存在確認**
   ```tsx
   // 常にoptimisticStateを優先、存在しない場合は元の状態を使用
   const displayData = action.optimisticState?.data || originalData
   ```

2. **`action.execute()`による直接実行**
   ```tsx
   // フォーム送信を経由せず、任意のタイミングで実行可能
   action.execute({ id: itemId, value: newValue })
   ```

3. **実行状態の管理**
   ```tsx
   // status: 'idle' | 'executing' | 'hasSucceeded' | 'hasErrored'
   const isLoading = action.status === 'executing'
   const hasError = action.status === 'hasErrored'
   ```

4. **エラー時の自動ロールバック**
   - Server Actionがエラーを返すと、自動的に`currentState`に戻る
   - 手動でのロールバック処理は不要
   - ユーザーへの通知のみ実装

5. **複数の楽観的更新の同時実行**
   ```tsx
   // 各アイテムが独立して楽観的更新を持つ場合
   todos.map(todo => (
     <TodoItemWithOptimistic
       key={todo.id}
       todo={todo}
       todos={todos}  // 全体の状態を渡す
     />
   ))
   ```

楽観的更新を使用すべきケース：
- チェックボックスのトグル
- いいねボタン
- ソート順の変更
- 表示/非表示の切り替え
- リストからの一時的な削除（確認ダイアログ後に確定）

使用を避けるべきケース：
- 決済処理
- 不可逆的なデータ削除
- 権限の変更
- 重要な設定の更新
- 他のユーザーに影響する操作

## Progressive Enhancement（useActionState）

useActionStateはJavaScript無効でも動作するフォームを実現。クリティカルな機能（ログイン、決済等）で使用。useHookFormActionと異なり、クライアント側バリデーションやリッチなUXは提供しないが、確実に動作する。defaultValue使用、FormData API依存、状態はサーバーから返却される形式。

## Container/Presentationalパターン実装

Next.js App RouterにおけるContainer/Presentationalパターンは、Server Components時代の必須アーキテクチャ。データフェッチ（Container）とUI表現（Presentational）を明確に分離し、React Server Componentsの利点を最大限活用する。

### ディレクトリ構造と責務分離

```
_containers/
├── todo-list/
│   ├── index.tsx          # Containerのみをexport（実装詳細を隠蔽）
│   ├── container.tsx      # Server Component - データフェッチ専門
│   ├── presentational.tsx # UI表示専門（Shared/Client Component）
│   └── __tests__/        # Container/Presentational別々にテスト
```

### Container Component（Server Component）の責務

```tsx
// container.tsx - データフェッチのみに専念
export async function TodoListContainer({ searchParams }: Props) {
  // データフェッチのコロケーション
  // Request Memoizationにより重複呼び出しは自動キャッシュ
  const currentUser = await getCurrentUser()
  let todos = await getTodosByUserId(currentUser.id)

  // サーバーサイドでのデータ変換・フィルタリング
  if (searchParams?.status === 'completed') {
    todos = todos.filter(todo => todo.completed)
  }

  // UI表現はPresentational Componentに委譲
  return <TodoListPresentation todos={todos} />
}
```

Container Componentの原則：
- async/awaitでデータフェッチ（Server Component専用機能）
- Props drillingを回避（使用場所で直接データ取得）
- データの前処理・変換・フィルタリングを実行
- クライアントへのJavaScript送信量ゼロ

### Presentational Componentの責務

```tsx
// presentational.tsx - UI表示のみに専念
export function TodoListPresentation({ todos }: Props) {
  return (
    <ul>
      {todos.map(todo => (
        <TodoItem key={todo.id} todo={todo} />
      ))}
    </ul>
  )
}
```

Presentational Componentの選択基準：
- Shared Component（'use client'なし）：イベントハンドラ不要な場合
- Client Component（'use client'あり）：対話的機能が必要な場合

### Compositionパターン（高度な組み合わせ）

```tsx
// Container内でvariantに応じてコンポーネントを選択
export function TodoItemContainer({ todo, variant }: Props) {
  if (variant === 'optimistic') {
    // Client ComponentにServer Component用データを渡す
    return <TodoItemOptimisticWrapper todo={todo} />
  }
  // デフォルトはShared Component
  return <TodoItemPresentation todo={todo} />
}

// Client ComponentにServer Componentをchildrenとして渡す
<TodoFilterWrapper todos={todos}>
  {(filteredTodos) => <TodoListPresentation todos={filteredTodos} />}
</TodoFilterWrapper>
```

### エクスポートパターン（Container 1st設計）

```tsx
// index.tsx - 外部からはContainerのみを公開
export { TodoListContainer } from './container'
// Presentationalは実装詳細として隠蔽
```

この設計により、使用側は常にContainerをインポートし、データフェッチの詳細を意識しない。

### テスト戦略の分離

```tsx
// Container Component Test - 関数として実行
const result = await TodoListContainer()
expect(result.type).toBe(TodoListPresentation)
expect(result.props.todos).toEqual(mockTodos)

// Presentational Component Test - 通常のRTL
render(<TodoListPresentation todos={mockTodos} />)
expect(screen.getByText('タスク1')).toBeInTheDocument()
```

### フォーム実装での適用

```tsx
// add-todo/container.tsx
export async function AddTodoContainer() {
  // フォームに必要なマスターデータを並列取得
  const [user, categories] = await Promise.all([
    getCurrentUser(),
    getTodoCategories(),
  ])

  // 必要最小限のデータのみ渡す（オーバーフェッチ防止）
  return (
    <AddTodoForm
      userId={user.id}
      categories={categories.map(c => ({ id: c.id, name: c.name }))}
    />
  )
}
```

### パターンの利点（コメントより抜粋）

1. **テスト容易性の向上**：データフェッチとUIを分離してテスト
2. **再利用性の向上**：Presentationalは純粋なUIコンポーネント
3. **責務の明確な分離**：各コンポーネントの役割が単一
4. **独立したコンポーネント**：各Containerが独立して動作
5. **RSC Payload最適化**：必要なデータのみクライアントに送信


## エラートランスレーション戦略

Safe Action ClientのhandleServerErrorで技術的エラーをユーザー向けメッセージに変換。Supabaseエラーコード（PGRST301等）、データベース制約違反、認証エラーを日本語の分かりやすいメッセージに変換。これにより内部実装を隠蔽し、一貫性のあるエラー体験を提供。

## 実装チェックリスト

- [ ] フォームコンポーネントに`'use client'`宣言
- [ ] next-safe-action v8のAPIを正しく使用（.inputSchema()、.metadata()）
- [ ] Server Actionでエラーを戻り値で表現（throwしない）
- [ ] 適切なキャッシュ無効化戦略（revalidateTag、revalidatePath）
- [ ] 日本語エラーメッセージの実装
- [ ] bindパターンで非フォーム値の受け渡し
- [ ] Container/Presentationalパターンでの責任分離
- [ ] 楽観的更新の必要性検討と実装
- [ ] Progressive Enhancementの必要性検討
- [ ] Zodスキーマによる二重バリデーション
- [ ] フォーム送信中のローディング状態表示
- [ ] アクセシビリティ属性（aria-label、role等）の設定
