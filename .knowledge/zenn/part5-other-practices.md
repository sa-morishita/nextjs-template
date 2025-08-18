````markdown
# 第 5 部 その他のプラクティス

Pages Router や Web MVC フレームワークの経験者なら、App Router で他と同等の実装をしようとして戸惑う部分が多々あるでしょう。

App Router はリクエストオブジェクト(`req`)やレスポンスオブジェクト(`res`)を参照できなかったり、リクエストに対して認可チェックを挟むレイヤーが直接なかったり、いくつかの実装パターンにおいて他のフレームワークとは全く異なる実装が必要になります。

第 5 部では、App Router でよく利用されるいくつかのプラクティスについて解説します。

# リクエストの参照とレスポンスの操作

## 要約

App Router では他フレームワークにあるようなリクエストオブジェクト(`req`)やレスポンスオブジェクト(`res`)を参照することはできません。代わりに必要な情報を参照するための API が提供されています。

## 背景

Pages Router など従来の Web フレームーワークでは、リクエストオブジェクト(`req`)やレスポンスオブジェクト(`res`)を参照することで様々な情報にアクセスしたり、レスポンスをカスタマイズするような設計が広く使われてきました。

```tsx
export const getServerSideProps = (async ({ req, res }) => { // リクエスト情報から`sessionId`というcookie情報を取得 const sessionId = req.cookies.sessionId; // レスポンスヘッダーに`Cache-Control`を設定 res.setHeader( "Cache-Control", "public, s-maxage=10, stale-while-revalidate=59", ); // ... return { props }; }) satisfies GetServerSideProps<Props>;
```

しかし、App Router ではこれらのオブジェクトを参照することはできません。

## 設計・プラクティス

App Router ではリクエストやレスポンスオブジェクトを提供する代わりに、必要な情報を参照するための API が提供されています。

### URL 情報の参照

### `params` props

Dynamic Routes の URL パスの情報は`params` props で提供されます。以下は`/posts/[slug]`と`/posts/[slug]/comments/[commentId]`というルーティングがあった場合の`params`の例です。

| URL                        | `params` props                       |
| -------------------------- | ------------------------------------ |
| `/posts/hoge`              | `{ slug: "hoge" }`                   |
| `/posts/hoge/comments/111` | `{ slug: "hoge", commentId: "111" }` |

```tsx
export default async function Page({ params, }: { params: Promise<{ slug: string; commentId: string; }>; }) { const { slug, commentId } = await params; // ... }
```

### `useParams()`

`useParams()`は、Client Components で URL パスに含まれる Dynamic Params（e.g. `/posts/[slug]`の`[slug]`部分）を参照するための hooks です。

```tsx
"use client"; import { useParams } from "next/navigation"; export default function ExampleClientComponent() { const params = useParams<{ tag: string; item: string }>(); // Route: /shop/[tag]/[item] // URL : /shop/shoes/nike-air-max-97 console.log(params); // { tag: 'shoes', item: 'nike-air-max-97' } // ... }
```

### `searchParams` props

`searchParams` props は、URL のクエリー文字列を参照するための props です。`searchParams` props では、クエリー文字列の key-value 相当なオブジェクトが提供されます。

| URL                             | `searchParams` props             |
| ------------------------------- | -------------------------------- |
| `/products?id=1`                | `{ id: "1" }`                    |
| `/products?id=1&sort=recommend` | `{ id: "1", sort: "recommend" }` |
| `/products?id=1&id=2`           | `{ id: ["1", "2"] }`             |

```tsx
type SearchParamsValue = string | string[] | undefined; export default async function Page({ searchParams, }: { searchParams: Promise<{ sort?: SearchParamsValue; id?: SearchParamsValue; }>; }) { const { sort, id } = await searchParams; // ... }
```

### `useSearchParams()`

`useSearchParams()`は、Client Components で URL のクエリー文字列を参照するための hooks です。

```tsx
"use client"; import { useSearchParams } from "next/navigation"; export default function SearchBar() { const searchParams = useSearchParams(); const search = searchParams.get("search"); // URL -> `/dashboard?search=my-project` console.log(search); // 'my-project' // ... }
```

### ヘッダー情報の参照

`headers()`は、リクエストヘッダーを参照するための関数です。この関数は Server Components などのサーバー側処理でのみ利用することができます。

```tsx
import { headers } from "next/headers";
export default async function Page() {
  const headersList = await headers();
  const referrer = headersList.get("referrer");
  return <div>Referrer: {referrer}</div>;
}
```

### クッキー情報の参照と変更

### `cookies()`

`cookies()`は、Cookie 情報の参照や変更を担うオブジェクトを取得するための関数です。この関数は Server Components などのサーバー側処理でのみ利用することができます。

app/page.tsx

```tsx
import { cookies } from "next/headers";
export default async function Page() {
  const cookieStore = await cookies();
  const theme = cookieStore.get("theme");
  return "...";
}
```

app/actions.ts

```
"use server"; import { cookies } from "next/headers"; async function create(data) { const cookieStore = await cookies(); cookieStore.set("name", "lee"); // ... }
```

### レスポンスのステータスコード

App Router は Streaming をサポートしているため、確実に HTTP ステータスコードを設定する手段がありません。その代わりに、`notFound()`や`redirect()`といった関数でブラウザに対してエラーやリダイレクトを示すことができます。

これらを呼び出した際には、まだ HTTP レスポンスの送信がまだ開始されていなければステータスコードが設定され、すでにクライアントにステータスコードが送信されていた場合には`<meta>`タグが挿入されてブラウザにこれらの情報が伝えられます。

### `notFound()`

`notFound()`は、ページが存在しないことをブラウザに示すための関数です。Server Components で利用することができます。この関数が呼ばれた際には、該当 Route の`not-found.tsx`が表示されます。

```tsx
import { notFound } from "next/navigation"; // ... export default async function Profile({ params }: { params: { id: string } }) { const user = await fetchUser(params.id); if (!user) { notFound(); } // ... }
```

### `redirect()`

`redirect()`は、リダイレクトを行うための関数です。この関数は Server Components などのサーバー側処理でのみ利用することができます。

```tsx
import { redirect } from "next/navigation"; // ... export default async function Profile({ params }: { params: { id: string } }) { const team = await fetchTeam(params.id); if (!team) { redirect("/login"); } // ... }
```

### `permanentRedirect()`

`permanentRedirect()`は、永続的なリダイレクトを行うための関数です。この関数は Server Components などのサーバー側処理でのみ利用することができます。

```tsx
import { permanentRedirect } from "next/navigation"; // ... export default async function Profile({ params }: { params: { id: string } }) { const team = await fetchTeam(params.id); if (!team) { permanentRedirect("/login"); } // ... }
```

`unauthorized()`は認証エラーを示すための関数です。この関数は Server Components などのサーバー側処理でのみ利用することができます。

```tsx
import { verifySession } from "@/app/lib/dal"; import { unauthorized } from "next/navigation"; export default async function DashboardPage() { const session = await verifySession(); if (!session) { unauthorized(); } // ... }
```

### `forbidden()`

`forbidden()`は認可エラーを示すための関数です。この関数は Server Components などのサーバー側処理でのみ利用することができます。

```tsx
import { verifySession } from "@/app/lib/dal"; import { forbidden } from "next/navigation"; export default async function AdminPage() { const session = await verifySession(); if (session.role !== "admin") { forbidden(); } // ... }
```

### その他

筆者が主要な API として認識してるものは上記に列挙しましたが、App Router では他にも必要に応じて様々な API が提供されています。上記にないユースケースで困った場合には、公式ドキュメントより検索してみましょう。

## トレードオフ

### `req`拡張によるセッション情報の持ち運び

従来`req`オブジェクトは、3rd party ライブラリが拡張して`req.session`にセッション情報を格納するような実装がよく見られました。App Router ではこのような実装はできず、これに代わるセッション管理の仕組みなどを実装する必要があります。

以下は、GitHub OAuth アプリとして実装したサンプル実装の一部です。`sessionStore.get()`で Redis に格納したセッション情報を取得できます。

セッション管理の実装が必要な方は、必要に応じて上記のリポジトリを参考にしてみてください。

# 認証と認可

## 要約

アプリケーションで認証状態を保持する代表的な方法としては以下 2 つが挙げられ、App Router においてもこれらを実装することが可能です。

- 保持したい情報を Cookie に保持（JWT は必須）
- セッションとして Redis などに保持（JWT は任意）

また、代表的な認可チェックには以下 2 つが考えられます。

- URL 認可
- データアクセス認可

これらの認可チェックは両立が可能ですが、URL 認可の実装には App Router ならではの制約が伴います。

## 背景

Web アプリケーションにおいて、認証と認可は非常にありふれた一般的な要件です。

しかし、App Router における認証認可の実装には、従来の Web フレームワークとは異なる独自の制約が伴います。

これは App Router が、React Server Components という**自律分散性**と**並行実行性**を重視したアーキテクチャに基づいて構築されていることや、edge ランタイムと Node.js ランタイムなど**多層の実行環境**を持つといった、従来の Web フレームワークとは異なる特徴を持つことに起因します。

### 並行レンダリングされるページとレイアウト

App Router では、Route 間で共通となるレイアウトを`layout.tsx`などで定義することができます。特定の Route 配下（e.g. `/dashboard`配下など）に対する認可チェックをレイアウト層で一律実装できるのでは、と考える方もいらっしゃると思います。しかし、このような実装は一見期待通りに動いてるように見えても、RSC Payload などを通じて情報漏洩などにつながるリスクがあり、避けるべき実装です。

これは、App Router の並行実行性に起因する制約です。App Router においてページとレイアウトは並行にレンダリングされるため、必ずしもレイアウト層に実装した認可チェックがページより先に実行されるとは限りません。意図した仕様なのかは不明ですが、現状だとページの方が先にレンダリングされ始めるようです。そのため、ページ側で認可チェックをしていないと予期せぬデータ漏洩が起きる可能性があります。

これらの詳細な解説については以下の記事が参考になります。

### Server Components で Cookie 操作は行えない

React Server Components ではデータ取得を Server Components、データ変更を Server Actions という責務分けがされています。Server Components の純粋性でも述べたように、Server Components における並行レンダリングや Request Memoization は、レンダリングに副作用が含まれないという前提の元設計されています。

Cookie 操作は他のコンポーネントのレンダリングに影響する可能性がある副作用です。そのため、App Router における Cookie 操作である`cookies().set()`や`cookies().delete()`は、Server Actions か Route Handler 内でのみ行うことができます。

### 制限を伴う middleware

Next.js の middleware は、ユーザーからのリクエストに対して一律処理を差し込むことができますが、middleware は本書執筆時の最新である 14 系においては、ランタイムが edge に限定されており Node.js API が利用できなかったり DB 操作系が非推奨など、様々な制限が伴います。

将来的には Node.js がランタイムとして選択できるようになる可能性もありますが、現状議論中の段階です。

## 設計・プラクティス

App Router における認証認可は、上述の制約を踏まえて実装する必要があります。考えるべきポイントは大きく以下の 3 つです。

- 認証状態の保持
- URL 認可
- データアクセス認可

### 認証状態の保持

サーバー側で認証状態を参照したい場合、Cookie を利用することが一般的です。認証状態を JWT にして直接 Cookie に格納するか、もしくは Redis などにセッション状態を保持して Cookie にはセッション ID を格納するなどの方法が考えられます。

公式ドキュメントに詳細な解説があるので、本書でこれらの詳細は割愛します。

筆者は、拡張された OAuth や OIDC を用いることが多く、セッション ID を JWT にして Cookie に格納し、セッション自体は Redis に保持する方法をよく利用します。こうすることで、アクセストークンや ID トークンをブラウザ側に送信せずに済み、セキュリティ性の向上や Cookie のサイズを節約などのメリットが得られます。また、Cookie に格納するセッション ID は JWT にすることで、改竄を防止することができます。

GitHub OAuth アプリのサンプル実装

以下は GitHub OAuth アプリとして実装したサンプル実装の一部です。GitHub からリダイレクト後、CSRF 攻撃対策のための state トークン検証、アクセストークンの取得、セッション保持などを行っています。

### URL 認可

URL 認可の実装は多くの場合、認証状態や認証情報に基づいて行われます。前述の通り、App Router の middleware では Node.js API が利用できないため、Redis や DB のデータ参照が必要な場合は各ページで認可チェックを行う必要があります。認可処理を`verifySession()`として共通化した場合、各ページで以下のような実装を行うことになるでしょう。

page.tsx

```tsx
export default async function Page() { await verifySession(); // 認可に失敗したら`/login`にリダイレクト // ... }
```

Cookie に JWT を格納している場合は、middleware で JWT の検証を行うことができます。認証状態を JWT に含めている場合は、さらに細かいチェックも可能です。一方、セッション ID のみを JWT に含めるようにしている場合には、ID の有効性やセッション情報の取得に Redis や DB 接続が必要になるため、middleware で行えるのは楽観的チェックに留まるということに注意しましょう。

### データアクセス認可

Request Memoization で述べたように、App Router ではデータフェッチ層を分離して実装するケースが多々あります。データアクセス認可が必要な場合は、分離したデータフェッチ層で実装しましょう。

例えば Vercel のような SaaS において、有償プランユーザーのみが利用可能なデータアクセスがあった場合、データフェッチ層に以下のような認可チェックを実装すべきでしょう。

```
// 🚨`unauthorized()`はv15時点でExperimental import { unauthorized } from "next/navigation"; export async function fetchPaidOnlyData() { if (!(await isPaidUser())) { unauthorized(); } // ... }
```

X（旧 Twitter）のようにブロックやミュートなど、きめ細かいアクセス制御（Fine-Grained Access Control）が必要な場合は、バックエンド API にアクセス制御を隠蔽する場合もあります。

```
// 🚨`forbidden()`はv15時点でExperimental import { forbidden } from "next/navigation"; export async function fetchPost(postId: string) { const res = await fetch(`https://dummyjson.com/posts/${postId}`); if (res.status === 401) { forbidden(); } return (await res.json()) as Post; }
```

## トレードオフ

### URL 認可の冗長な実装

認証状態に基づく URL 認可はありふれた要件ですが、認証状態を確認するのに Redis や DB のデータ参照が必要な場合、前述のように各`page.tsx`で認可チェックを行う必要があり、実装が少々冗長になります。

page.tsx

```tsx
export default async function Page() { await verifySession(); // 認可に失敗したら`/login`にリダイレクト // ... }
```

これに対する回避策として検討されているのが**Request Interceptors**で、特定の Route 配下に対して一律`interceptor.ts`で定義した処理を差し込むことができるようにするというものです。

執筆時点では Draft のため、実際に取り込まれるのかどうかや時期などについては不明です。今後の動向に期待しましょう。

# エラーハンドリング

## 要約

App Router におけるエラーは主に、Server Components と Server Actions の 2 つで発生します。

Server Components のエラーは、エラー時の UI を`error.tsx`や`not-found.tsx`で定義します。一方 Server Actions におけるエラーは、基本的に戻り値で表現することが推奨されます。

## 背景

App Router におけるエラーは、クライアントかサーバーか、データ参照か変更かで分けて考える必要があり、具体的には以下の 3 つを分けて考えることになります。

- Client Components
- Server Components
- Server Actions

特に、Server Components と Server Actions は外部データに対する操作を伴うことが多いため、エラーが発生する可能性が高くハンドリングが重要になります。

### クライアントサイドにおけるレンダリングエラー

後述の App Router が提供するエラーハンドリングは、サーバーサイドで発生したエラーにのみ対応しています。クライアントサイドにおけるレンダリングエラーのハンドリングが必要な場合は、開発者が自身で`<ErrorBoundary>`を定義する必要があります。

また、クライアントサイドにおいてレンダリングエラーが発生する場合、ブラウザの種類やバージョンなどに依存するエラーの可能性が高く、サーバーサイドとは異なりリトライしても回復しない可能性があります。クライアントサイドのエラーは当然ながらサーバーに記録されないので、開発者はエラーが起きた事実さえ把握が難しくなります。

クライアントサイドのエラー実態を把握したい場合、Datadog などの RUM（Real User Monitoring）導入も同時に検討しましょう。

## 設計・プラクティス

App Router におけるエラーは主に、Server Components と Server Actions の 2 つで考える必要があります。

### Server Components のエラー

App Router では、Server Components の実行中にエラーが発生した時の UI を、Route Segment 単位の`error.tsx`で定義することができます。Route Segment 単位なのでレイアウトはそのまま、`page.tsx`部分に`error.tsx`で定義した UI が表示されます。以下は公式ドキュメントにある図です。

`error.tsx`は主に Server Components でエラーが発生した場合に利用されます。

`error.tsx`は Client Components である必要があり、props で`reset()`を受け取ります。`reset()`は、再度ページのレンダリングを試みるリロード的な振る舞いをします。

```tsx
"use client";
import { useEffect } from "react";
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div>
      {" "}
      <h2>Something went wrong!</h2> <button
        type="button"
        onClick={() => reset()}
      >
        {" "}
        Try again{" "}
      </button>{" "}
    </div>
  );
}
```

### Not Found エラー

HTTP における 404 Not Found エラーは SEO 影響もあるため、その他のエラーとは特に区別されることが多いエラーです。App Router では 404 相当のエラーを throw するための API として`notFound()`を提供しており、`notFound()`が呼び出された際の UI は`not-found.tsx`で定義できます。

### Server Actions のエラー

Server Actions のエラーは、**予測可能なエラー**と**予測不能なエラー**で分けて考える必要があります。

Server Actions は多くの場合、データ更新の際に呼び出されます。何かしらの理由でデータ更新に失敗したとしても、ユーザーは再度更新をリクエストできることが望ましい UX と考えられます。しかし、Server Actions ではエラーが`throw`されると、前述の通り`error.tsx`で定義したエラー時の UI が表示されます。`error.tsx`が表示されることで、直前までページで入力していた`<form>`の入力内容などが失われると、ユーザーは操作を最初からやり直すことになりかねません。

そのため、Server Actions における予測可能なエラーは`throw`ではなく、**戻り値でエラーを表現**することが推奨されます。予測不能なエラーに対しては当然ながら対策できないので、予測不能なエラーが発生した場合は`error.tsx`が表示されることは念頭に置いておきましょう。

以下は conform を使った Server Actions における zod バリデーションの実装例です。バリデーションエラー時は`throw`せず、`submission.reply()`を返している点がポイントです。

```tsx
"use server"; import { redirect } from "next/navigation"; import { parseWithZod } from "@conform-to/zod"; import { loginSchema } from "@/app/schema"; export async function login(prevState: unknown, formData: FormData) { const submission = parseWithZod(formData, { schema: loginSchema, }); if (submission.status !== "success") { return submission.reply(); } // ... redirect("/dashboard"); }
```

form ライブラリを利用してない場合は、以下のように自身で戻り値を定義しましょう。

```tsx
"use server"; import { redirect } from "next/navigation"; export async function login(prevState: unknown, formData: FormData) { const submission = parseWithZod(formData, { schema: loginSchema, }); if (formData.get("email") !== "") { return { message: "メールアドレスは必須です。" }; } // ... redirect("/dashboard"); }
```

## トレードオフ

特になし
````
