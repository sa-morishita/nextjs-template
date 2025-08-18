````markdown
# 第 3 部 キャッシュ

App Router には 4 層のキャッシュが存在し、デフォルトで積極的に利用されます。以下は公式の表を翻訳したものです。

| Mechanism               | What                | Where  | Purpose                                     | Duration                                 |
| ----------------------- | ------------------- | ------ | ------------------------------------------- | ---------------------------------------- |
| **Request Memoization** | API レスポンスなど  | Server | React Component tree におけるデータの再利用 | リクエストごと                           |
| **Data Cache**          | API レスポンスなど  | Server | ユーザーやデプロイをまたぐデータの再利用    | 永続的 (revalidate 可)                   |
| **Full Route Cache**    | HTML や RSC payload | Server | レンダリングコストの最適化                  | 永続的 (revalidate 可)                   |
| **Router Cache**        | RSC Payload         | Client | ナビゲーションごとのリクエスト削減          | ユーザーセッション・時間 (revalidate 可) |

すでに Request Memoization については第 1 部 データフェッチで解説しましたが、これは Next.js サーバーに対するリクエスト単位の非常に短い期間でのみ利用されるキャッシュであり、これが問題になることはほとんどないと考えられます。一方他の 3 つについてはもっと長い期間および広いスコープで利用されるため、開発者が意図してコントロールしなければ予期せぬキャッシュによるバグに繋がりかねません。そのため、App Router を利用する開発者にとってこれらの理解は非常に重要です。

第 3 部では App Router におけるキャッシュの考え方や仕様、コントロールの方法などを解説します。

# Static Rendering と Full Route Cache

## 要約

Static Rendering では、HTML や RSC Payload のキャッシュである Full Route Cache を生成します。Full Route Cache は短い期間で revalidate も可能なので、ユーザー固有の情報を含まないようなページは積極的に Full Route Cache を活用しましょう。

## 背景

従来 Pages Router ではサーバー側のレンダリングについて、SSR・SSG・ISR という 3 つのレンダリングモデル[1]をサポートしてきました。App Router では上記相当のレンダリングをサポートしつつ、revalidate がより整理され、SSG と ISR を大きく区別せずまとめて**Static Rendering**、従来の SSR 相当を**Dynamic Rendering**と呼称する形で再定義されました。

| レンダリング      | タイミング               | Pages Router との比較 |
| ----------------- | ------------------------ | --------------------- |
| Static Rendering  | build 時や revalidate 後 | SSG・ISR 相当         |
| Dynamic Rendering | ユーザーリクエスト時     | SSR 相当              |

App Router は**デフォルトで Static Rendering**となっており、**Dynamic Rendering はオプトイン**になっています。Dynamic Rendering にオプトインする方法は以下の通りです。

### Dynamic APIs

`cookies()`/`headers()`などの Dynamic APIs と呼ばれる API を利用すると、Dynamic Rendering となります。

```
// page.tsx import { cookies } from "next/headers"; export default async function Page() { const cookieStore = await cookies(); const sessionId = cookieStore.get("session-id"); return "..."; }
```

### `cache: "no-store"`もしくは`next.revalidate: 0`な`fetch()`

`fetch()`のオプションで`cache: "no-store"`を指定した場合や、`next: { revalidate: 0 }`を指定した場合、Dynamic Rendering となります。

```
// page.tsx export default async function Page() { const res = await fetch("https://dummyjson.com/todos/random", { // 🚨Dynamic Renderingにするために`"no-store"`を明示 cache: "no-store", }); const todoItem: TodoItem = await res.json(); return "..."; }
```

### Route Segment Config

Route Segment Config を利用して Dynamic Rendering に切り替えることもできます。具体的には、`page.tsx`や`layout.tsx`に以下どちらかを設定することで Dynamic Rendering を強制できます。

```tsx
// layout.tsx | page.tsx export const dynamic = "force-dynamic";
```

```tsx
// layout.tsx | page.tsx export const revalidate = 0; // 1以上でStatic Rendering
```

### `connection()`

末端のコンポーネントから利用者側に Dynamic Rendering を強制したいが、`headers()`や`no-store`な`fetch()`を使っていない場合には、`connection()`で Dynamic Rendering に切り替えることができます。具体的には、Prisma を使った DB アクセス時などに有用でしょう。

```
import { connection } from "next/server"; export async function LeafComponent() { await connection(); // DBアクセスなど return "..."; }
```

## 設計・プラクティス

Static Rendering は耐障害性・パフォーマンスに優れています。ユーザーリクエスト毎にレンダリングが必要なら前述の方法で Dynamic Rendering にオプトインする必要がありますが、それ以外のケースについて、App Router では**可能な限り Static Rendering にする**ことが推奨されています。

Static Rendering のレンダリング結果である HTML や RSC Payload のキャッシュは、Full Route Cache と呼ばれています。App Router では Static Rendering を活用するために、Full Route Cache のオンデマンド revalidate や時間ベースでの revalidate といったよくあるユースケースをフォローし、従来の SSG のように変更があるたびにデプロイが必要といったことがないように設計されています。

### オンデマンド revalidate

`revalidatePath()`や`revalidateTag()`を Server Actions や Route Handlers で呼び出すことで、関連する Data Cache や Full Route Cache を revalidate することができます。

```
"use server"; import { revalidatePath } from "next/cache"; export async function action() { // ... revalidatePath("/products"); }
```

### 時間ベース revalidate

Route Segment Config の revalidate を指定することで Full Route Cache や関連する Data Cache を時間ベースで revalidate することができます。

```tsx
// layout.tsx | page.tsx export const revalidate = 10; // 10s
```

例えば 1 秒などの非常に短い時間でも設定すれば、瞬間的に非常に多くのリクエストが発生したとしてもレンダリングは 1 回で済むため、バックエンド API への負荷軽減や安定したパフォーマンスに繋がります。更新頻度が非常に高いページでもユーザー間で共有できる(=ユーザー固有の情報などを含まない)のであれば、設定を検討しましょう。

## トレードオフ

### 予期せぬ Dynamic Rendering とパフォーマンス劣化

Route Segment Config や`unstable_noStore()`によって Dynamic Rendering を利用する場合、開発者は明らかに Dynamic Rendering を意識して使うのでこれらが及ぼす影響を見誤ることは少ないと考えられます。一方、Dynamic APIs は「cookie を利用したい」、`cache: "no-store"`な`fetch`は「Data Cache を使いたくない」などの主目的が別にあり、これに伴って副次的に Dynamic Rendering に切り替わるため、開発者は影響範囲に注意する必要があります。

特に、Data Cache などを適切に設定できていないと Dynamic Rendering に切り替わった際にページ全体のパフォーマンス劣化につながる可能性があります。こちらについての詳細は後述の Dynamic Rendering と Data Cache をご参照ください。

### レンダリング境界と PPR

従来 Dynamic Rendering は Route 単位(`page.tsx`や`layout.tsx`)でしか切り替えることができませんでしたが、v14 以降 experimental フラグで**PPR**(Partial Pre-Rendering)を有効にするにより、文字通り Partial(部分的)に Dynamic Rendering への切り替えが可能になります。PPR では Static/Dynamic Rendering の境界を`<Suspense>`によって定義します。

```tsx
import { Suspense } from "react";
import { PostFeed, Weather } from "./Components";
export default function Posts() {
  return (
    <section>
      {" "}
      {/* `<PostFeed />`はStatic Rendering */} <PostFeed /> <Suspense
        fallback={<p>Loading weather...</p>}
      >
        {" "}
        {/* `<Weather />`はDynamic Rendering */} <Weather />{" "}
      </Suspense>{" "}
    </section>
  );
}
```

PPR については後述の Partial Pre Rendering(PPR)や筆者の過去記事である以下をご参照ください。

脚注

1. こちらの記事より引用。レンダリング戦略とも呼ばれます。

# Dynamic Rendering と Data Cache

## 要約

Dynamic Rendering なページでは、データフェッチ単位のキャッシュである Data Cache を活用してパフォーマンスを最適化しましょう。

## 背景

Static Rendering と Full Route Cache で述べた通り、App Router では可能な限り Static Rendering にすることが推奨されています。しかし、アプリケーションによってはユーザー情報を含むページなど、Dynamic Rendering が必要な場合も当然考えられます。

Dynamic Rendering はリクエストごとにレンダリングされるので、できるだけ早く完了する必要があります。この際最もボトルネックになりやすいのが**データフェッチ処理**です。

## 設計・プラクティス

Data Cache はデータフェッチ処理の結果をキャッシュするもので、サーバー側に永続化され**リクエストやユーザーを超えて共有**されます。

Dynamic Rendering は Next.js サーバーへのリクエストごとにレンダリングを行いますが、その際必ずしも全てのデータフェッチを実行しなければならないとは限りません。ユーザー情報に紐づくようなデータフェッチとそうでないものを切り分けて、後者に対し Data Cache を活用することで、Dynamic Rendering の高速化や API サーバーの負荷軽減などが見込めます。

Data Cache ができるだけキャッシュヒットするよう、データフェッチごとに適切な設定を心がけましょう。

### Next.js サーバー上の`fetch()`

サーバー上で実行される`fetch()`は Next.js によって拡張されており、Data Cache に関するオプションが組み込まれています。デフォルトではキャッシュは無効ですが、第 2 引数のオプション指定によってキャッシュ挙動を変更することが可能です。

```
fetch(`https://...`, { cache: "force-cache", // or "no-store", });
```

```
fetch(`https://...`, { next: { revalidate: false, // or number, }, });
```

`next.revalidate`は文字通り revalidate されるまでの時間を設定できます。

```
fetch(`https://...`, { next: { tags: [tagName], // string[] }, });
```

`next.tags`には配列で**tag**を複数指定することができます。これは後述の`revalidateTag()`によって指定した tag に関連する Data Cache を revalidate する際に利用されます。

### `unstable_cache()`

`unstable_cache()`を使うことで、DB アクセスなどでも Data Cache を利用することが可能です。

```tsx
import { getUser } from "./fetcher"; import { unstable_cache } from "next/cache"; const getCachedUser = unstable_cache( getUser, // DBアクセス ["my-app-user"], // key array { tags: ["users"], // cache revalidate tags revalidate: 60, // revalidate time(s) }, ); export default async function Component({ userID }) { const user = await getCachedUser(userID); // ... }
```

### オンデマンド revalidate

Static Rendering と Full Route Cache でも述べた通り、`revalidatePath()`や`revalidateTag()`を Server Actions や Route Handlers で呼び出すことで、関連する Data Cache や Full Route Cache を revalidate することができます。

```
"use server"; import { revalidatePath } from "next/cache"; export async function action() { // ... revalidatePath("/products"); }
```

これらは特に何かしらのデータ操作が発生した際に利用されることを想定した revalidate です。サイト内からのデータ操作には Server Actions を、外部で発生したデータ操作に対しては Route Handlers から revalidate することが推奨されます。

App Router でのデータ操作に関する詳細は、後述のデータ操作と Server Actions にて解説します。

### Data Cache と`revalidatePath()`

余談ですが、Data Cache にはデフォルトの tag として、Route 情報を元にしたタグが内部的に設定されており、`revalidatePath()`はこの特殊なタグを元に関連する Data Cache の revalidate を実現しています。

より詳細に revalidate の仕組みを知りたい方は、過去に筆者が調査した際の記事をぜひご参照ください。

## トレードオフ

### Data Cache のオプトアウトと Dynamic Rendering

`fetch()`のオプションで`cahce: "no-store"`か`next.revalidate: 0`を設定することで Data Cache をオプトアウトすることができますが、これは同時に Route が**Dynamic Rendering に切り替わる**ことにもなります。

これらを設定する時は本当に Dynamic Rendering にしなければいけないのか、よく考えて設定しましょう。

また、Next.js では v14 以降、Static Rendering と Dynamic Rendering を 1 つの Route で混在させることができる**Partial Pre Rendering**(PPR)を experimental で提供しています。PPR では、Suspense 境界単位で Dynamic Rendering にオプトインすることができます。PPR のより詳細な内容については、後述の Partial Pre Rendering(PPR)で解説します。

# Router Cache

## 要約

Router Cache はクライアントサイドのキャッシュで、prefetch 時や Soft Navigation 時に更新されます。アプリケーション特性に応じて Router Cache の有効期間である`staleTimes`を適切に設定しつつ、適宜必要なタイミングで revalidate しましょう。

## 背景

Router Cache は、App Router におけるクライアントサイドキャッシュで、Server Components のレンダリング結果である RSC Payload を保持しています。Router Cache は prefetch や soft navigation 時に更新され、有効期間内であれば再利用されます。

v14.1 以前の App Router では Router Cache の有効期間を開発者から設定することはできず、`<Link>`の`prefetch`指定などに基づいてキャッシュの有効期限は**30 秒か 5 分**とされていました。これに対し Next.js リポジトリの Discussion 上では、Router Cache をアプリケーション毎に適切に設定できるようにして欲しいという要望が相次いでいました。

## 設計・プラクティス

Next.js の v14.2 にて、Router Cache の有効期間を設定する`staleTimes`が experimental で導入されました。これにより、開発者はアプリケーション特性に応じて Router Cache の有効期間を適切に設定することができるようになりました。

```
/** @type {import('next').NextConfig} */ const nextConfig = { experimental: { staleTimes: { dynamic: 10, static: 180, }, }, }; export default nextConfig;
```

### `staleTimes`の設定

`staleTimes`の設定はドキュメントによると以下のように対応していることになります。

| 項目    | `<Link prefetch=?>` | デフォルト(v14) | デフォルト(v15) |
| ------- | ------------------- | --------------- | --------------- |
| dynamic | `undefined`         | 30s             | 0s              |
| static  | `true`              | 5m              | 5m              |

多くの場合、変更を考えるべくは`dynamic`の方になります。v14 では特に、デフォルトだと 30s となっているために多くの混乱が見られました。利用する Next.js のバージョンごとの挙動に注意して、キャッシュの有効期限としてどこまで許容できるか考えて適切に設定しましょう。

### 任意のタイミングで revalidate

`staleTimes`以外で Router Cache を任意に破棄するには、以下 3 つの方法があります。

- `router.refresh()`
- Server Actions で`revalidatePath()`/`revalidateTag()`
- Server Actions で`cookies.set()`/`cookies.delete()`

Router Cache を任意のタイミングで破棄したい多くのユースケースは、ユーザーによるデータ操作時です。データ操作を行う Server Actions 内で`revalidatePath()`や`cookies.set()`を呼び出しているなら特に追加実装する必要はありません。一方これらを呼び出していない場合には、データ操作の submit 完了後に Client Components 側で`router.refresh()`を呼び出すなどの対応を行いましょう。

特に`revalidatePath()`/`revalidateTag()`はサーバー側キャッシュだけでなく Router Cache にも影響を及ぼすことは直感的ではないので、よく覚えておきましょう。

## トレードオフ

### ドキュメントにはない Router Cache の挙動

Router Cache の挙動はドキュメントにない挙動をすることも多く、非常に複雑です。特に筆者が注意しておくべき点として認識してるものを以下にあげます。

- ブラウザバック時は`staleTimes`の値にかかわらず、必ず Router Cache が利用される(キャッシュ破棄後であれば再取得する)
- `staleTimes.dynamic`に指定する値は、「キャッシュが保存された時刻」か「キャッシュが最後に利用された時刻」からの経過時間
- `staleTimes.static`に指定する値は、「キャッシュが保存された時刻」からの経過時間のみ

より詳細な挙動を知りたい方は、少々古いですが筆者の過去記事をご参照ください。

# データ操作と Server Actions

## 要約

データ操作は Server Actions で実装することを基本としましょう。

## 背景

Pages Router ではデータ取得のために getServerSideProps や getStaticProps が提供されてましたが、データ操作アプローチは公式には提供されていませんでした。そのため、クライアントサイドを主体、または API Routes を統合した 3rd party ライブラリによるデータ操作の実装パターンが多く存在します。

- SWR
- React Query
- GraphQL
  - Apollo Client
  - Relay
- tRPC
- etc...

しかし、API Route は App Router において Route Handler となり、定義の方法や参照できる情報などが変更されました。また、App Router は多層のキャッシュを活用しているため、データ操作時にはキャッシュの revalidate 機能との統合が必要となるため、上記にあげたライブラリや実装パターンを App Router で利用するには多くの工夫や実装が必要となります。

## 設計・プラクティス

App Router でのデータ操作は、従来からある実装パターンではなく Server Actions を利用することが推奨されています。これにより、tRPC などの 3rd party ライブラリなどなしにクライアント・サーバーの境界を超えて関数を呼び出すことができ、データ変更処理を容易に実装できます。

app/actions.ts

```tsx
"use server"; export async function createTodo(formData: FormData) { // ... }
```

app/page.tsx

```tsx
"use client";
import { createTodo } from "./actions";
export default function CreateTodo() {
  return (
    <form action={createTodo}>
      {" "}
      {/* ... */} <button>Create Todo</button>{" "}
    </form>
  );
}
```

上記の実装例では、サーバーサイドで実行される関数`createTodo`を Client Components で`<form>`の`action`props に直接渡しているのがわかります。この form を実際に submit すると、サーバーサイドで`createTodo`が実行されます。

このように非常にシンプルな実装でクライアントサイドからサーバーサイド関数を呼び出せることで、開発者はデータ操作の実装に集中できます。Server Actions は React の仕様ですが、実装はフレームワークに統合されているので、他にも以下のような App Router ならではのメリットが得られます。

### キャッシュの revalidate

App Router は多層のキャッシュを活用しているため、データ操作時には関連するキャッシュの revalidate が必要になります。Server Actions 内で`revalidatePath()`や`revalidateTag()`を呼び出すと、サーバーサイドの関連するキャッシュ(Data Cache や Full Route Cache)とクライアントサイドのキャッシュ(Router Cache)が revalidate されます。

app/actions.ts

```tsx
"use server"; export async function updateTodo() { // ... revalidateTag("todos"); }
```

### redirect 時の通信効率

App Router ではサーバーサイドで呼び出せる`redirect()`という関数があります。データ操作後にページをリダレイクトしたいことはよくあるユースケースですが、`redirect()`を Server Actions 内で呼び出すとレスポンスにリダイレクト先ページの RSC Payload が含まれるため、HTTP リダイレクトをせずに画面遷移できます。これにより、従来データ操作リクエストとリダイレクト後ページ情報のリクエストで 2 往復は必要だった http 通信が、1 度で済みます。

app/actions.ts

```tsx
"use server";
import { redirect } from "next/navigation";
export async function createTodo(formData: FormData) {
  console.log("create todo: ", formData.get("title"));
  redirect("/thanks");
}
```

上記の Server Actions を実際に呼び出すと、遷移先の`/thanks`の RSC Payload が含まれたレスポンスが返却されます。

```
2:I[3099,[],""] 3:I[2506,[],""] 0:["lxbJ3SDwnGEl3RnM3bOJ4",[[["",{"children":["thanks",{"children":["__PAGE__",{}]}]},"$undefined","$undefined",true],["",{"children":["thanks",{"children":["__PAGE__",{},[["$L1",[["$","h1",null,{"children":"Thanks page."}],["$","p",null,{"children":"Thank you for submitting!"}]]],null],null]},["$","$L2",null,{"parallelRouterKey":"children","segmentPath":["children","thanks","children"],"error":"$undefined","errorStyles":"$undefined","errorScripts":"$undefined","template":["$","$L3",null,{}],"templateStyles":"$undefined","templateScripts":"$undefined","notFound":"$undefined","notFoundStyles":"$undefined","styles":null}],null]},[["$","html",null,{"lang":"en","children":["$","body",null,{"children":["$","$L2",null,{"parallelRouterKey":"children","segmentPath":["children"],"error":"$undefined","errorStyles":"$undefined","errorScripts":"$undefined","template":["$","$L3",null,{}],"templateStyles":"$undefined","templateScripts":"$undefined","notFound":[["$","title",null,{"children":"404: This page could not be found."}],["$","div",null,{"style":{"fontFamily":"system-ui,\\"Segoe UI\\",Roboto,Helvetica,Arial,sans-serif,\\"Apple Color Emoji\\",\\"Segoe UI Emoji\\"","height":"100vh","textAlign":"center","display":"flex","flexDirection":"column","alignItems":"center","justifyContent":"center"},"children":["$","div",null,{"children":[["$","style",null,{"dangerouslySetInnerHTML":{"__html":"body{color:#000;background:#fff;margin:0}.next-error-h1{border-right:1px solid rgba(0,0,0,.3)}@media (prefers-color-scheme:dark){body{color:#fff;background:#000}.next-error-h1{border-right:1px solid rgba(255,255,255,.3)}}"}}],["$","h1",null,{"className":"next-error-h1","style":{"display":"inline-block","margin":"0 20px 0 0","padding":"0 23px 0 0","fontSize":24,"fontWeight":500,"verticalAlign":"top","lineHeight":"49px"},"children":"404"}],["$","div",null,{"style":{"display":"inline-block"},"children":["$","h2",null,{"style":{"fontSize":14,"fontWeight":400,"lineHeight":"49px","margin":0},"children":"This page could not be found."}]}]]}]}]],"notFoundStyles":[],"styles":null}]}]}],null],null],[null,"$L4"]]]] 4:[["$","meta","0",{"name":"viewport","content":"width=device-width, initial-scale=1"}],["$","meta","1",{"charSet":"utf-8"}]] 1:null
```

### JavaScript 非動作時・未ロード時サポート

App Router の Server Actions では`<form>`の`action`props に Server Actions を渡すと、ユーザーが JavaScript を OFF にしてたり、JavaScript ファイルが未ロードであっても動作します。

これにより、FID(First Input Delay)の向上も見込めます。実際のアプリケーション開発においては、Form ライブラリを利用しつつ Server Actions を利用するケースが多いと思われるので、筆者は JavaScript 非動作時もサポートしてる Form ライブラリの Conform をおすすめします。

## トレードオフ

### サイト外で発生するデータ操作

Server Actions は基本的にサイト内でのみ利用することが可能ですが、データ操作がサイト内でのみ発生するとは限りません。具体的にはヘッドレス CMS でのデータ更新など、サイト外でデータ操作が発生した場合にも、App Router で保持しているキャッシュを revalidate する必要があります。

Route Handler が`revalidatePath()`などを扱えるのはまさに上記のようなユースケースをフォローするためです。サイト外でデータ操作が行われた時には、Route Handler で定義した API を Web hook で呼び出すなどしてキャッシュを revalidate しましょう。

### ブラウザバックにおけるスクロール位置の喪失

App Router におけるブラウザバックでは Router Cache が利用されます。この際には画面は即時に描画され、スクロール位置も正しく復元されます。

しかし、Server Actions で`revalidatePath()`などを呼び出すなどすると、Router Cache が破棄されます。Router Cache がない状態でブラウザバックを行うと即座に画面を更新できないため、スクロール位置がうまく復元されないことがあります。

### Server Actions の呼び出しは直列化される

Server Actions は直列に実行されるよう設計されているため、同時に実行できるのは一つだけとなります。

本書や公式ドキュメントで扱ってるような利用想定の限りではこれが問題になることは少ないと考えられますが、Server Actions を高頻度で呼び出すような実装では問題になることがあるかもしれません。

そういった場合は、そもそも高頻度に Server Actions を呼び出すような設計・実装を見直しましょう。

# [Experimental] Dynamic IO

## 要約

Next.js は現在、キャッシュの大幅な刷新に取り組んでいます。これにより、本書で紹介してきたキャッシュに関する知識の多くは**過去のものとなる可能性**があります。

これからの Next.js でキャッシュがどう変わるのか理解して、将来の変更に備えましょう。

## 背景

第 3 部では App Router におけるキャッシュの理解が重要であるとし、解説してきましたが、多層のキャッシュや複数の概念が登場し、難しいと感じた方も多かったのではないでしょうか。実際、App Router 登場当初から現在に至るまでキャッシュに関する批判的意見[1]は多く、現在の Next.js における最も大きな課題の一つと言えるでしょう。

開発者の混乱を解決する最もシンプルな方法は、キャッシュをデフォルトで有効化する形をやめて、オプトイン方式に変更することです。ただし、Next.js は**デフォルトで高いパフォーマンス**を実現することを重視したフレームワークであるため、このような変更はコンセプトに反します。

Next.js は、キャッシュにまつわる混乱の解決とデフォルトで高いパフォーマンスの両立という、非常に難しい課題に取り組んできました。

## 設計・プラクティス

**Dynamic IO**は、前述の課題に対し Next.js コアチームが検討を重ねて生まれた 1 つの解決案で、文字通り Next.js における動的 I/O 処理の振る舞いを大きく変更するものです。

ここで言う動的 I/O 処理にはデータフェッチや`headers()`や`cookies()`などの Dynamic APIs が含まれ[2]、Dynamic IO ではこれらの処理を含む場合、以下いずれかの対応が必要となります。

- **`<Suspense>`**: 非同期コンポーネントを`<Suspense>`境界内に配置し、Dynamic Rendering にする
- **`"use cache"`**: 非同期関数や非同期コンポーネントに`"use cache"`を指定して、Static Rendering にする

ここで重要なのは、Dynamic IO 以前のように非同期処理を自由に扱えるわけではなく、**上記いずれかの対応が必須となる**点です。これは、Dynamic IO 以前のデフォルトキャッシュがもたらした混乱に対し明示的な選択を強制することで、高いパフォーマンスを実現しやすい形をとりつつも開発者の混乱を解消することを目指したもので、筆者はシンプルかつ柔軟な設計だと評価しています。

### `<Suspense>`による Dynamic Rendering

EC サイトのカートやダッシュボードなど、リアルタイム性や細かい認可制御などが必要な場面では、キャッシュされないデータフェッチが必須です。これらで扱うような非常に動的なコンポーネントを実装する場合、Dynamic IO では`<Suspense>`境界内で動的 I/O 処理を扱うことができます。`<Suspense>`境界内は Dynamic IO 以前同様、Streaming で段階的にレンダリング結果が配信されます。

```tsx
async function Profile({ id }: { id: string }) {
  const user = await getUser(id);
  return (
    <>
      {" "}
      <h2>{user.name}</h2> ...{" "}
    </>
  );
}
export default async function Page() {
  return (
    <>
      {" "}
      <h1>Your Profile</h1> <Suspense fallback={<Loading />}>
        {" "}
        <Profile />{" "}
      </Suspense>{" "}
    </>
  );
}
```

上記の場合、ユーザーにはまず`Your Profile`というタイトルと`fallback`の`<Loading />`が表示され、その後に`<Profile>`の内容が`fallback`に置き換わって表示されます。これは`<Profile>`が並行レンダリングされ、完了次第ユーザーに配信されるためにこのような挙動になります。

### `"use cache"`による Static Rendering

一方、商品情報やブログ記事などのキャッシュ可能なコンポーネントを実装する場合、Dynamic IO ではキャッシュしたい関数やコンポーネントに`"use cache"`を指定します。`"use cache"`は Static Rendering な境界を生成し、子孫コンポーネントまで含めて Static Rendering となります。

以下は前述の`<Profile>`に`"use cache"`を指定して Static Rendering にする例です。

```tsx
async function Profile({ id }: { id: string }) {
  "use cache";
  const user = await getUser(id);
  return (
    <>
      {" "}
      <h2>{user.name}</h2> ...{" "}
    </>
  );
}
```

キャッシュは通常キーが必要になりますが、`"use cache"`ではコンパイラがキャッシュのキーを自動で識別します。具体的には、引数やクロージャが参照してる外側のスコープの変数などをキーとして認識します。一方で、`children`のような直接シリアル化できないものは**キーに含まれません**。これにより、`"use cache"`のキャッシュ境界は`"use client"`同様、Composition パターンが適用できます。

より詳細な説明については Next.js の公式ブログに解説記事があるので、こちらをご参照ください。

なお、`"use cache"`はコンポーネントを含む関数やファイルレベルで指定することができます。ファイルに指定した場合には、すべての`export`される関数に対し`"use cache"`が適用されます。

```tsx
// File level "use cache"; export default async function Page() { // ... } // Component level export async function MyComponent() { "use cache"; return <></>; } // Function level export async function getData() { "use cache"; const data = await fetch("/api/data"); return data; }
```

### キャッシュの詳細な指定

`"use cache"`を使ったキャッシュでは、Dynamic IO 以前より自由度の高いキャッシュ戦略が可能となります。具体的には、キャッシュのタグや有効期間の指定方法がより柔軟になりました。

Dynamic IO 以前は`fetch()`のオプションでタグを指定するなどしていたため、データフェッチ後にタグをつけることができませんでしたが、Dynamic IO では`cacheTag()`でタグを指定するため、`fetch()`後にタグを付与するなど柔軟な指定が可能になりました。

```tsx
import { unstable_cacheTag as cacheTag } from "next/cache"; async function getBlogPosts(page: number) { "use cache"; const posts = await fetchPosts(page); posts.forEach((post) => { // 🚨Dynamic IO以前はタグを`fetch()`時に指定する必要があったため、`posts`などを参照できなかった cacheTag("blog-post-" + post.id); }); return posts; }
```

同様に、キャッシュの有効期限も`cacheLife()`で指定できます。`cacheLife()`は`"minutes"`などの`profile`と呼ばれる時間指定に関するラベル文字列を引数にとり、`"use cache"`指定時に`cacheLife()`を明示的に指定することを推奨されています。

```tsx
import { unstable_cacheLife as cacheLife } from "next/cache";
async function getBlogPosts(page: number) {
  "use cache";
  cacheLife("minutes");
  const posts = await fetchPosts(page);
  return posts;
}
```

`profile`の値は Stale・Revalidate・Expire の 3 つの振る舞いに対応し、カスタマイズも可能です。

- Stale: クライアントサイドのキャッシュ期間。
- Revalidate: サーバー上でキャッシュを更新する頻度。Revalidate 中は古い値が提供される場合があります。
- Expire: 値が古いままでいられる最大期間。Revalidate より長くする必要があります。

以下はデフォルトで指定可能な`profile`です。

| `profile` | Stale     | Revalidate | Expire         |
| --------- | --------- | ---------- | -------------- |
| `default` | undefined | 15 minutes | INFINITE_CACHE |
| `seconds` | undefined | 1 second   | 1 minute       |
| `minutes` | 5 minutes | 1 minute   | 1 hour         |
| `hours`   | 5 minutes | 1 hour     | 1 day          |
| `days`    | 5 minutes | 1 day      | 1 week         |
| `weeks`   | 5 minutes | 1 week     | 1 month        |
| `max`     | 5 minutes | 1 month    | INFINITE_CACHE |

### `<Suspense>`と`"use cache"`の併用

`<Suspense>`と`"use cache"`は併用が可能である点も、Dynamic IO 以前と比較して非常に優れている点です。以下のように、動的な要素とキャッシュ可能な静的な要素を組み合わせることができます。

```tsx
export default function Page() {
  return (
    <>
      {" "}
      {/* Static Rendering */} ... <Suspense fallback={<Loading />}>
        {" "}
        {/* Dynamic Rendering */} <DynamicComponent>
          {" "}
          {/* Static Rendering */} <StaticComponent />{" "}
        </DynamicComponent>{" "}
      </Suspense>{" "}
    </>
  );
}
```

ただし、`"use cache"`は`"use client"`同様境界を示すものなので、`children`を除き Dynamic Rendering なコンポーネントを含むことができません。これは`<Suspense>`も例外ではないので、以下のような実装はできません。

```tsx
async function StaticComponent() {
  "use cache";
  return (
    <>
      {" "}
      ... {/* 🚨Dynamic Renderingなコンポーネントは含むことができない */} <Suspense>
        {" "}
        <DynamicComponent />{" "}
      </Suspense>{" "}
    </>
  );
}
```

Client Components 同様慣れが必要な部分になるので、以下のルールをしっかり覚えておきましょう。

- Dynamic Rendering は Static Rendering を含むことができる
- Static Rendering は Dynamic Rendering を`children`でなら含むことができる

## トレードオフ

### Experimental

Dynamic IO は、本書執筆時点でまだ experimental な機能という位置付けです。そのため、Dynamic IO を利用するには Next.js の`canary`バージョンと、`next.config.ts`に以下の設定を追加する必要があります。

next.config.ts

```
import type { NextConfig } from "next"; const nextConfig: NextConfig = { experimental: { dynamicIO: true, }, }; export default nextConfig;
```

### キャッシュの永続化

Dynamic IO におけるキャッシュの永続化は`next.config.ts`を通じてカスタマイズ可能ですが、Dynamic IO 以前からある Custom Cache Handler とは別物になります。少々複雑ですが、Dynamic IO 以前のものが`cacheHandler`で設定できたのに対し、Dynamic IO のキャッシュハンドラーは`experimental.cacheHandlers`で設定します。

next.config.ts

```
import type { NextConfig } from "next"; import path from "path"; const nextConfig: NextConfig = { experimental: { dynamicIO: true, cacheHandlers: { // ref: https://github.com/vercel/next.js/blob/c228a6e65d4b7973aa502544f9f8e025a6f97066/packages/next/src/server/config-shared.ts#L240-L245 default: path.join(import.meta.dirname, "..."), remote: path.join(import.meta.dirname, "..."), static: path.join(import.meta.dirname, "..."), }, }, }; export default nextConfig;
```

### キャッシュに関する制約

`"use cache"`のキャッシュのキーは自動でコンパイラが識別してくれるので非常に便利ですが、一方シリアル化不可能なものはキャッシュのキーに含まれないため注意が必要です。下記のように関数を引数に取る場合は、`"use cache"`を使用しない方が意図しない動作を防ぐことができます。

```tsx
async function cachedFunctionWithCallback(callback: () => void) { "use cache"; // ... }
```

また、`"use cache"`を指定した非同期関数の戻り値は必ずシリアル化可能である必要があります。

脚注

1. Next.js の Discussion では、批判的な意見や改善要望が多く寄せられました。
2. 動的 I/O 処理には`Date`、`Math`といった Next.js が拡張してるモジュールや、任意の非同期関数なども含まれます
````
