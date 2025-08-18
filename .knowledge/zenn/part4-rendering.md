````markdown
# 第 4 部 レンダリング

従来 Pages Router は SSR・SSG・ISR という 3 つのレンダリングモデルをサポートしてきました。App Router は引き続きこれらをサポートしていますが、これらに加え**Streaming**に対応している点が大きく異なります。

具体的には Streaming SSR や Partial Pre-Rendering(PPR)など、Pages Router にはない新たなレンダリングモデルがサポートされています。特に PPR は、従来より高いパフォーマンスを実現しつつもシンプルなメンタルモデルで Next.js を扱うことができるようになります。

第 4 部では React や App Router におけるレンダリングの考え方について解説します。

# Server Components の純粋性

## 要約

React コンポーネントのレンダリングは純粋であるべきです。Server Components においてもこれは同様で、データフェッチをメモ化することで純粋性を保つことができます。

## 背景

React は従来より、コンポーネントが**純粋**であることを重視してきました。React の最大の特徴の 1 つである宣言的 UI も、コンポーネントが純粋であることを前提としています。

とはいえ、Web の UI 実装には様々な副作用[1]がつきものです。Client Components では、副作用を`useState()`や`useEffect()`などの hooks に分離することで、コンポーネントの純粋性を保てるように設計されています。

### 並行レンダリング

React18 で並行レンダリングの機能が導入されましたが、これはコンポーネントが純粋であることを前提としています。

もし副作用が含まれるレンダリングを並行にしてしまうと、処理結果が不安定になりますが、副作用を含まなければレンダリングを並行にしても結果は安定します。このように、従来より React の多くの機能は、コンポーネントが副作用を持たないことを前提としていました。

## 設計・プラクティス

React Server Components においても従来同様、**コンポーネントが純粋**であることは非常に重要です。App Router もこの原則に沿って、各種 API が設計されています。

### データフェッチの一貫性

データフェッチ on Server Components で述べたように、App Router におけるデータフェッチは Server Components で行うことが推奨されます。本来、データフェッチは純粋性を損なう操作の典型です。

```tsx
async function getRandomTodo() { // リクエストごとにランダムなTodoを返すAPI const res = await fetch("https://dummyjson.com/todos/random"); return (await res.json()) as Todo; }
```

上記の`getRandomTodo()`は呼び出しごとに異なる Todo を返す可能性が高く、そもそもリクエストに失敗する可能性もあるため戻り値は不安定です。このようなデータフェッチを内部的に呼び出す関数は、同じ入力（引数）でも出力（戻り値）が異なる可能性があり、純粋ではありません。

Server Components では、Request Memoization によって入力に対する出力を一定に保つことで、データフェッチをサポートしながらもレンダリングの範囲ではコンポーネントの純粋性を保てるよう設計されています。

```tsx
export async function ComponentA() {
  const todo = await getRandomTodo();
  return <>...</>;
}
export async function ComponentB() {
  const todo = await getRandomTodo();
  return <>...</>;
} // ... export default function Page() { // ランダムなTodoは1度だけ取得され、 // 結果<ComponentA>と<ComponentB>は同じTodoを表示する return ( <> <ComponentA /> <ComponentB /> </> ); }
```

### `cache()`によるメモ化

Request Memoization は`fetch()`を拡張することで実現されていますが、DB アクセスなど`fetch()`を利用しないデータフェッチについても同様に純粋性は重要です。これは`React.cache()`を利用することで簡単に実装することができます。

```
export const getPost = cache(async (id: number) => { const post = await db.query.posts.findFirst({ where: eq(posts.id, id), }); if (!post) throw new NotFoundError("Post not found"); return post; });
```

ページを通して 1 回だけ発生するデータフェッチに対してなら、上記のように`cache()`でメモ化する必要はないように感じられるかもしれませんが、筆者は基本的にメモ化しておくことを推奨します。あえてメモ化したくない場合には、後々の改修で複数回呼び出すことになった際に一貫性が破綻するリスクが伴います。

### Cookie 操作

App Router における Cookie 操作も典型的な副作用の 1 つであり、Server Components からは変更操作である`cookies().set()`や`cookies().delete()`は呼び出すことができません。

データ操作と Server Actions でも述べたように、Cookie 操作や、API に対するデータ変更リクエストなど変更操作は Server Actions で行いましょう。

## トレードオフ

### Request Memoization のオプトアウト

Request Memoization は`fetch()`を拡張することで実現しています。`fetch()`の拡張をやめるようなオプトアウト手段は現状ありません。ただし、`fetch()`に渡す引数次第で Request Memoization をオプトアプトして都度データフェッチすることは可能です。

```
// クエリー文字列にランダムな値を付与する fetch(`https://dummyjson.com/todos/random?_hash=${Math.random()}`); // `signal`を指定する const controller = new AbortController(); const signal = controller.signal; fetch(`https://dummyjson.com/todos/random`, { signal });
```

脚注

1. ここでは、他コンポーネントのレンダリングに影響しうる論理的状態の変更を指します

# Suspense と Streaming

## 要約

Dynamic Rendering で特に重いコンポーネントのレンダリングは`<Suspense>`で遅延させて、Streaming SSR にしましょう。

## 背景

Dynamic Rendering では Route 全体をレンダリングするため、Dynamic Rendering と Data Cache では Data Cache を活用することを検討すべきであるということを述べました。しかし、キャッシュできないようなデータフェッチに限って無視できないほど遅いということはよくあります。

## 設計・プラクティス

App Router では Streaming SSR をサポートしているので、重いデータフェッチを伴う Server Components のレンダリングを遅延させ、ユーザーにいち早くレスポンスを返し始めることができます。具体的には、App Router は`<Suspense>`の fallback を元に即座にレスポンスを送信し始め、その後、`<Suspense>`内のレンダリングが完了次第結果がクライアントへと続いて送信されます。

並行データフェッチで述べたようなデータフェッチ単位で分割されたコンポーネント設計ならば、`<Suspense>`境界を追加するのみで容易に実装できるはずです。

### 実装例

少々極端な例ですが、以下のような 3 秒の重い処理を伴う`<LazyComponent>`は`<Suspense>`によってレンダリングが遅延されるので、ユーザーは 3 秒を待たずにすぐにページのタイトルや`<Clock>`を見ることができます。

```tsx
import { setTimeout } from "node:timers/promises";
import { Suspense } from "react";
import { Clock } from "./clock";
export const dynamic = "force-dynamic";
export default function Page() {
  return (
    <div>
      {" "}
      <h1>Streaming SSR</h1> <Clock /> <Suspense fallback={<>loading...</>}>
        {" "}
        <LazyComponent />{" "}
      </Suspense>{" "}
    </div>
  );
}
async function LazyComponent() {
  await setTimeout(3000);
  return <p>Lazy Component</p>;
}
```

## トレードオフ

### fallback の Layout Shift

Streaming SSR を活用するとユーザーに即座に画面を表示し始めることができますが、画面の一部に fallback を表示しそれが後に置き換えられるため、いわゆる**Layout Shift**が発生する可能性があります。

置き換え後の高さが固定ならば、fallback も同様の高さで固定することで Layout Shift を防ぐことができます。一方、置き換え後の高さが固定でない場合には Layout Shift が発生することになり、Time to First Byte(TTFB)と Cumulative Layout Shift(CLS)のトレードオフが発生します。

そのため実際のユースケースにおいては、コンポーネントがどの程度遅いのかによってレンダリングを遅延させるべきかどうか判断が変わってきます。筆者の感覚論ですが、たとえば 200ms 程度のデータフェッチを伴う Server Components なら TTFB を短縮するより Layout Shift のデメリットの方が大きいと判断することが多いでしょう。1s を超えてくるような Server Components なら迷わず遅延することを選びます。

TTFB と CLS どちらを優先すべきかはケースバイケースなので、状況に応じて最適な設計を検討しましょう。

### Streaming と SEO

SEO における古い見解では、「Google に評価されたいコンテンツは HTML に含むべき」「見えてないコンテンツは評価されない」といったものがありました。これらが事実なら、Streaming SSR は SEO 的に不利ということになります。

しかし、Vercel が独自に行った大規模な調査によると、Streaming SSR した内容が Google に評価されないということはなかったとのことです。

この調査によると、JS 依存なコンテンツが indexing される時間については以下のようになっています。

- 50%~: 10s
- 75%~: 26s
- 90%~: ~3h
- 95%~: ~6h
- 99%~: ~18h

Google の indexing にある程度遅延がみられるものの、上記の indexing 速度は十分に早いと言えるため、コンテンツの表示が JS 依存な Streaming SSR が SEO に与える影響は少ない(もしくはほとんどない)と筆者は考えます。

# [Experimental] Partial Pre Rendering(PPR)

## 要約

PPR は従来のレンダリングモデルのメリットを組み合わせて、シンプルに整理した新しいアプローチです。`<Suspense>`境界の外側を Static Rendering、内側を Dynamic Rendering とすることが可能で、既存のモデルを簡素化しつつも高いパフォーマンスを実現します。PPR の使い方・考え方・実装状況を理解しておきましょう。

## 背景

従来 Next.js は SSR・SSG・ISR をサポートしてきました。App Router ではこれらに加え、Streaming SSR もサポートしています。複数のレンダリングモデルをサポートしているため付随するオプションが多数あり、複雑化している・考えることが多すぎるといったフィードバックが Next.js 開発チームに多数寄せられていました。

App Router はこれらをできるだけシンプルに整理するために、サーバー側でのレンダリングを Static Rendering と Dynamic Rendering という 2 つのモデルに再整理しました。

| レンダリング      | タイミング               | Pages Router との比較 |
| ----------------- | ------------------------ | --------------------- |
| Static Rendering  | build 時や revalidate 後 | SSG・ISR 相当         |
| Dynamic Rendering | ユーザーリクエスト時     | SSR 相当              |

しかし、v14 までこれらのレンダリングは Route 単位(`page.tsx`や`layout.tsx`)でしか選択できませんでした。そのため、大部分が静的化できるようなページでも一部動的なコンテンツがある場合には、ページ全体を Dynamic Rendering にするか、Static Rendering+Client Components によるクライアントサイドデータフェッチで処理する必要がありました。

## 設計・プラクティス

Partial Pre Rendering(PPR)はこれらをさらに整理し、基本は Static Rendering、`<Suspense>`境界内を Dynamic Rendering とすることを可能としました。これにより、必ずしもレンダリングを Route 単位で考える必要はなくなり、1 つのページ・1 つの HTTP レスポンスに Static と Dynamic を混在させることができるようになりました。

以下は公式チュートリアルからの引用画像です。

レイアウトや商品情報については Static Rendering で構成されていますが、カートやレコメンドといったユーザーごとに異なるであろう部分は Dynamic Rendering とすることが表現されています。

### ユーザーから見た PPR

PPR では、Static Rendering で生成される HTML や RSC Payload に`<Suspense>`の`fallback`が埋め込まれます。`fallback`は Dynamic Rendering が完了するたびに置き換わっていくことになります。

そのため、ユーザーから見ると Streaming SSR 同様、Next.js サーバーは即座にページの一部分を返し始め、表示された`fallback`が徐々に置き換わっていくように見えます。

以下はレンダリングに 3 秒ほどかかる Random な Todo を表示するページの例です。

### PPR 実装

開発者が PPR を利用するには、Dynamic Rendering の境界を`<Suspense>`で囲むのみです。非常にシンプルかつ React の API を用いた実装であることも、PPR の優れている点です。

```tsx
import { Suspense } from "react";
import { StaticComponent, DynamicComponent, Fallback } from "@/app/ui";
export const experimental_ppr = true;
export default function Page() {
  return (
    <>
      {" "}
      <StaticComponent /> <Suspense fallback={<Fallback />}>
        {" "}
        <DynamicComponent />{" "}
      </Suspense>{" "}
    </>
  );
}
```

## トレードオフ

### Experimental

PPR は、本書執筆時点でまだ experimental な機能という位置付けです。そのため、PPR を利用するには Next.js の`canary`バージョンと、`next.config.ts`に以下の設定を追加する必要があります。

next.config.ts

```
import type { NextConfig } from "next"; const nextConfig: NextConfig = { experimental: { ppr: "incremental", // v14.xではboolean }, }; export default nextConfig;
```

上記を設定した上で、ページやレイアウトなど PPR を有効化したいモジュールで`experimental_ppr`を export します。

```tsx
export const experimental_ppr = true;
```

### PPR の今後

前述の通り、PPR はまだ experimental な機能です。PPR に伴う Next.js 内部の変更は大規模なもので、バグや変更される挙動もあるかもしれません。現時点では、実験的利用以上のことは避けておくのが無難でしょう。

ただし、PPR は Next.js コアチームが最も意欲的に取り組んでいる機能の 1 つです。将来的には主要な機能となる可能性が高いので、先行して学んでおく価値はあると筆者は考えます。

### CDN キャッシュとの相性の悪さ

PPR では Static と Dynamic を混在させつつも、1 つの HTTP レスポンスで完結するという特徴を持っています。これはレスポンス単位でキャッシュすることを想定した CDN とは非常に相性が悪く、CDN キャッシュできないというトレードオフが発生します。

いずれは、Cloudflare Workers などのエッジコンピューティングから Static Rendering な部分を返しつつ、オリジンから Dynamic Rendering な部分を返すような構成が容易にできるような未来が来るかもしれません。今後の CDN ベンダーや Next.js チームの動向に期待したいところです。
````
