````markdown
# 第 1 部 データフェッチ

## 要約

データフェッチはデータを参照するコンポーネントにコロケーション[1]し、コンポーネントの独立性を高めましょう。

## 背景

Pages Router におけるサーバーサイドでのデータフェッチは、getServerSideProps や getStaticProps などページの外側で非同期関数を宣言し、Next.js がこれを実行した結果を props としてページコンポーネントに渡すという設計がなされてました。

これはいわゆる**バケツリレー**(Props Drilling)と呼ばれる props を親から子・孫へと渡していくような実装を必要とし、冗長で依存関係が広がりやすいというデメリットがありました。

### 実装例

以下に商品ページを想定した実装例を示します。API から取得した`product`という props が親から孫までそのまま渡されるような実装が見受けれれます。

```tsx
type ProductProps = { product: Product };
export const getServerSideProps = (async () => {
  const res = await fetch("https://dummyjson.com/products/1");
  const product = await res.json();
  return { props: { product } };
}) satisfies GetServerSideProps<ProductProps>;
export default function ProductPage({
  product,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  return (
    <ProductLayout>
      {" "}
      <ProductContents product={product} />{" "}
    </ProductLayout>
  );
}
function ProductContents({ product }: ProductProps) {
  return (
    <>
      {" "}
      <ProductHeader product={product} /> <ProductDetail product={product} /> <ProductFooter
        product={product}
      />{" "}
    </>
  );
} // ...
```

わかりやすいよう少々大袈裟に実装していますが、こういったバケツリレー実装は Pages Router だと発生しがちな問題です。常に最上位で必要なデータを意識し末端まで流すので、コンポーネントのネストが深くなるほどバケツリレーは増えていきます。

この設計は我々開発者に常にページという単位を意識させてしまうため、コンポーネント指向な開発と親和性が低く、高い認知負荷を伴います。

## 設計・プラクティス

App Router では Server Components でのデータフェッチが利用可能なので、できるだけ末端のコンポーネントへ**データフェッチをコロケーション**することを推奨[2]しています。

もちろんページの実装規模にもよるので、小規模な実装であればページコンポーネントでデータフェッチしても問題はないでしょう。しかし、ページコンポーネントが肥大化していくと中間層でのバケツリレーが発生しやすくなるので、できるだけ末端のコンポーネントでデータフェッチを行うことを推奨します。

「それでは全く同じデータフェッチが何度も実行されてしまうのではないか」と懸念される方もいるかもしれませんが、App Router では Request Memoization によってデータフェッチがメモ化されるため、全く同じデータフェッチが複数回実行されることないように設計されています。

### 実装例

前述の商品ページの実装例を App Router に移行する場合、以下のような実装になるでしょう。

```tsx
type ProductProps = { product: Product }; // <ProductLayout>は`layout.tsx`へ移動 export default function ProductPage() { return ( <> <ProductHeader /> <ProductDetail /> <ProductFooter /> </> ); } async function ProductHeader() { const res = await fetchProduct(); return <>...</>; } async function ProductDetail() { const res = await fetchProduct(); return <>...</>; } // ... async function fetchProduct() { // Request Memoizationにより、実際のデータフェッチは1回しか実行されない const res = await fetch("https://dummyjson.com/products/1"); return res.json(); }
```

データフェッチが各コンポーネントにコロケーションされたことで、バケツリレーがなくなりました。また、`<ProductHeader>`や`<ProductDetail>`などの子コンポーネントはそれぞれ必要な情報を自身で取得しているため、ページ全体でどんなデータフェッチを行っているか気にする必要がなくなりました。

## トレードオフ

### Request Memoization への理解

データフェッチのコロケーションを実現する要は Request Memoization なので、Request Memoization に対する理解と最適な設計が重要になってきます。

この点については次の Request Memoization の章でより詳細に解説します。

脚注

1. コードをできるだけ関連性のある場所に配置することを指します。
2. 公式ドキュメントにおけるベストプラクティスを参照ください。

# データフェッチ on Server Components

## 要約

データフェッチは Client Components ではなく、Server Components で行いましょう。

## 背景

React におけるコンポーネントは従来クライアントサイドでの処理を主体としていたため、クライアントサイドにおけるデータフェッチのためのライブラリや実装パターンが多く存在します。

- SWR
- React Query
- GraphQL
  - Apollo Client
  - Relay
- tRPC
- etc...

しかしクライアントサイドでデータフェッチを行うことは、多くの点でデメリットを伴います。

### パフォーマンスと設計のトレードオフ

クライアント・サーバー間の通信は、物理的距離や不安定なネットワーク環境の影響で多くの場合低速です。そのため、パフォーマンス観点では通信回数が少ないことが望ましいですが、通信回数とシンプルな設計はトレードオフになりがちです。

REST API において通信回数を優先すると**God API**と呼ばれる責務が大きな API になりがちで、変更容易性や API 自体のパフォーマンス問題が起きやすい傾向にあります。一方責務が小さい細粒度な API は**Chatty API**(おしゃべりな API)と呼ばれ、データフェッチをコロケーション[1]してカプセル化などのメリットを得られる一方、通信回数が増えたりデータフェッチのウォーターフォールが発生しやすく、Web アプリのパフォーマンス劣化要因になりえます。

### 様々な実装コスト

クライアントサイドのデータフェッチでは、React が推奨してるように多くの場合キャッシュ機能を搭載した 3rd party ライブラリを利用します。一方リクエスト先に当たる API は、パブリックなネットワークに公開するためより堅牢なセキュリティが求められます。

これらの理由からクライアントサイドでデータフェッチする場合には、3rd party ライブラリの学習・責務設計・API 側のセキュリティ対策など様々な開発コストが発生します。

### バンドルサイズの増加

クライアントサイドでデータフェッチを行うには、3rd party ライブラリ・データフェッチの実装・バリデーションなど、多岐にわたるコードがバンドルされクライアントへ送信されます。また、通信結果次第では利用されないエラー時の UI などのコードもバンドルに含まれがちです。

## 設計・プラクティス

React チームは前述の問題を個別の問題と捉えず、根本的には React がサーバーをうまく活用できてないことが問題であると捉えて解決を目指しました。その結果生まれたのが**React Server Components**(以下 RSC)アーキテクチャです。

App Router は RSC をサポートしており、データフェッチは Server Components で行うことがベストプラクティスとされています。

これにより、以下のようなメリットを得られます。

### 高速なバックエンドアクセス

Next.js サーバーと API サーバー間の通信は、多くの場合高速で安定しています。特に、API が同一ネットワーク内や同一データセンターに存在する場合は非常に高速です。API サーバーが外部にある場合も、多くの場合は首都圏内で高速なネットワーク回線を通じての通信になるため、比較的高速で安定してることが多いと考えられます。

### シンプルでセキュアな実装

Server Components は非同期関数をサポートしており、3rd party ライブラリなしでデータフェッチをシンプルに実装できます。

```tsx
export async function ProductTitle({ id }) {
  const res = await fetch(`https://dummyjson.com/products/${id}`);
  const product = await res.json();
  return <div>{product.title}</div>;
}
```

これは Server Components がサーバー側で 1 度だけレンダリングされ、従来のようにクライアントサイドで何度もレンダリングされることを想定しなくて良いからこそできる設計です。

また、データフェッチはサーバー側でのみ実行されるため、API をパブリックなネットワークで公開することは必須ではありません。プライベートなネットワーク内でのみバックエンド API へアクセスするようにすれば、セキュリティリスクや対策コストを軽減できます。

### バンドルサイズの軽減

Server Components の実行結果は HTML や RSC Payload としてクライアントへ送信されます。そのため、前述のような

> 3rd party ライブラリ・データフェッチの実装・バリデーションなど、多岐にわたるコード
>
> ...
>
> エラー時の UI などのコード

は一切バンドルには含まれません。

## トレードオフ

### ユーザー操作とデータフェッチ

ユーザー操作に基づくデータフェッチは Server Components で行うことが困難な場合があります。詳細は後述のユーザー操作とデータフェッチを参照してください。

### GraphQL との相性の悪さ

RSC に GraphQL を組み合わせることは**メリットよりデメリットの方が多くなる**可能性があります。

GraphQL はその特性上、前述のようなパフォーマンスと設計のトレードオフが発生しませんが、RSC も同様にこの問題を解消するため、これをメリットとして享受できません。それどころか、RSC と GraphQL を協調させるための知見やライブラリが一般に不足してるため、実装コストが高くバンドルサイズも増加するなど、デメリットが多々含まれます。

脚注

1. コードをできるだけ関連性のある場所に配置することを指します。

# データフェッチ コロケーション

Pages Router から App Router へ移行する場合、React Server Components をはじめ多くのパラダイムシフトを必要とします。データフェッチにおいては、Server Components によって従来よりセキュアでシンプルな実装が可能になった一方、使いこなすには従来とは全く異なる設計思想が求められます。

第 1 部では、App Router のデータフェッチにまつわる基本的な考え方を解説します。

# Request Memoization

## 要約

データフェッチ層を分離して、Request Memoization を生かせる設計を心がけましょう。

## 背景

データフェッチ コロケーションの章で述べた通り、App Router ではデータフェッチをコロケーションすることが推奨されています。しかし末端のコンポーネントでデータフェッチを行うと、ページ全体を通して重複するリクエストが発生する可能性が高まります。App Router はこれに対処するため、レンダリング中の同一リクエストをメモ化し排除する Request Memoization を実装しています。

しかし、この Request Memoization がリクエストを重複と判定するには、同一 URL・同一オプションの指定が必要で、オプションが 1 つでも異なれば別リクエストが発生してしまいます。

## 設計・プラクティス

オプションの指定ミスにより Request Memoization が効かないことなどがないよう、複数のコンポーネントで利用しうるデータフェッチ処理は**データフェッチ層**として分離しましょう。

```
// プロダクト情報取得のデータフェッチ層 export async function getProduct(id: string) { const res = await fetch(`https://dummyjson.com/products/${id}`, { // 独自ヘッダーなど }); return res.json(); }
```

### ファイル構成

App Router ではコロケーションを強く意識した設計がなされているので、データフェッチ層をファイル分離する場合にもファイルコロケーションすることが推奨されます。

前述の`getProduct()`を分離する場合、筆者なら以下のいずれかのような形でファイルを分離します。データフェッチ層が多い場合にはより細かく分離すると良いでしょう。

- `app/products/fetcher.ts`
- `app/products/_lib/fetcher.ts`
- `app/products/_lib/fetcher/product.ts`

ファイルの命名やディレクトリについては開発規模や流儀によって異なるので、自分たちのチームでルールを決めておきましょう。

### `server-only` package

データフェッチ on Server Components で述べたとおり、データフェッチは基本的に Server Components で行うことが推奨されます。データフェッチ層を誤ってクライアントサイドで利用することを防ぐためにも、server-only パッケージを利用することを検討しましょう。

```
// Client Compomnentsでimportするとerror import "server-only"; export async function getProduct(id: string) { const res = await fetch(`https://dummyjson.com/products/${id}`, { // 独自ヘッダーなど }); return res.json(); }
```

## トレードオフ

特になし

# 並行データフェッチ

## 要約

以下のパターンを駆使して、データフェッチが可能な限り並行になるよう設計しましょう。

- データフェッチ単位のコンポーネント分割
- 並行`fetch()`
- preload パターン

## 背景

「商品情報を取得してからじゃないと出品会社情報が取得できない」などのようにデータフェッチ間に依存関係がある場合、データフェッチ処理自体は直列(ウォーターフォール)に実行せざるを得ません。

一方データ間に依存関係がない場合、当然ながらデータフェッチを並行化した方が優れたパフォーマンスを得られます。以下は公式ドキュメントにあるデータフェッチの並行化による速度改善のイメージ図です。

## 設計・プラクティス

App Router におけるデータフェッチの並行化にはいくつかの実装パターンがあります。コードの凝集度を考えると、まずは可能な限りデータフェッチ単位のコンポーネント分割を行うことがベストです。ただし、必ずしもコンポーネントが分割可能とは限らないので他のパターンについてもしっかり理解しておきましょう。

### データフェッチ単位のコンポーネント分割

データ間に依存関係がなく参照単位も異なる場合には、データフェッチを行うコンポーネント自体分割することを検討しましょう。

非同期コンポーネントがネストしている場合はコンポーネントの実行が直列になりますが、それ以外では並行にレンダリングされます。言い換えると、非同期コンポーネントは兄弟もしくは兄弟の子孫コンポーネントとして配置されてる場合、並行にレンダリングされます。

```tsx
function Page({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return ( <> <PostBody postId={id} /> <CommentsWrapper> <Comments postId={id} /> </CommentsWrapper> </> ); } async function PostBody({ postId }: { postId: string }) { const res = await fetch(`https://dummyjson.com/posts/${postId}`); const post = (await res.json()) as Post; // ... } async function Comments({ postId }: { postId: string }) { const res = await fetch(`https://dummyjson.com/posts/${postId}/comments`); const comments = (await res.json()) as Comment[]; // ... }
```

上記の実装例では`<PostBody />`と`<Comments />`(およびその子孫)は並行レンダリングされるので、データフェッチも並行となります。

### 並行`fetch()`

データフェッチ順には依存関係がなくとも参照の単位が不可分な場合には、`Promise.all()`(もしくは`Promise.allSettled()`)と`fetch()`を組み合わせることで、複数のデータフェッチを並行に実行できます。

```tsx
async function Page() { const [user, posts] = await Promise.all([ fetch(`https://dummyjson.com/users/${id}`).then((res) => res.json()), fetch(`https://dummyjson.com/posts/users/${id}`).then((res) => res.json()), ]); // ... }
```

### preload パターン

コンポーネント構造上兄弟関係ではなく親子関係にせざるを得ない場合も、データフェッチにウォーターフォールが発生します。このようなウォーターフォールは、Request Memoization を活用した preload パターンを利用することで、コンポーネントの親子関係を超えて並行データフェッチが実現できます。

サーバー間通信は物理的距離・潤沢なネットワーク環境などの理由から安定して高速な傾向にあり、ウォーターフォールがパフォーマンスに及ぼす影響はクライアントサイドと比較すると小さくなる傾向にあります。それでもパフォーマンス計測した時に無視できない遅延を含む場合などには、この preload パターンが有用です。

app/fetcher.ts

```
import "server-only"; export const preloadCurrentUser = () => { // preloadなので`await`しない void getCurrentUser(); }; export async function getCurrentUser() { const res = await fetch("https://dummyjson.com/user/me"); return res.json() as User; }
```

app/products/\[id\]/page.tsx

```tsx
export default function Page({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; // `<Product>`や`<Comments>`のさらに子孫で`user`を利用するため、親コンポーネントでpreloadする preloadCurrentUser(); return ( <> <Product productId={id} /> <Comments productId={id} /> </> ); }
```

上記実装例では可読性のために`preloadCurrentUser()`を preload 専用の関数として定義しています。`<Product>`や`<Comments>`の子孫で User 情報を利用するため、ページレベルで`preloadCurrentUser()`することで、`<Product>`と`<Comments>`のレンダリングと並行して User 情報のデータフェッチが実行されます。

ただし、preload パターンを利用した後で`<Product>`や`<Comments>`から User 情報が参照されなくなった場合、`preloadCurrentUser()`が残っていると不要なデータフェッチが発生します。このパターンを利用する際には、無駄な preload が残ってしまうことのないよう注意しましょう。

## トレードオフ

### N+1 データフェッチ

データフェッチ単位を小さくコンポーネントに分割していくと**N+1 データフェッチ**が発生する可能性があります。この点については次の章の N+1 と DataLoader で詳しく解説します。

# N+1 と DataLoader

## 要約

コンポーネント単位の独立性を高めると N+1 データフェッチが発生しやすくなるので、DataLoader のバッチ処理を利用して解消しましょう。

## 背景

前述のデータフェッチ コロケーションや並行データフェッチを実践し、データフェッチやコンポーネントを細かく分割していくと、ページ全体で発生するデータフェッチの管理が難しくなり 2 つの問題を引き起こします。

1 つは重複したデータフェッチです。これについては Next.js の機能である Request Memoization によって解消されるため、前述のようにデータフェッチ層を分離・共通化してれば我々開発者が気にすることはほとんどありません。

もう 1 つは、いわゆる**N+1**なデータフェッチです。データフェッチを細粒度に分解していくと、N+1 データフェッチになる可能性が高まります。

以下の例では投稿の一覧を取得後、子コンポーネントで著者情報を取得しています。

page.tsx

```tsx
import { type Post, getPosts, getUser } from "./fetcher";
export const dynamic = "force-dynamic";
export default async function Page() {
  const { posts } = await getPosts();
  return (
    <>
      {" "}
      <h1>Posts</h1> <ul>
        {" "}
        {posts.map((post) => (
          <li key={post.id}>
            {" "}
            <PostItem post={post} />{" "}
          </li>
        ))}{" "}
      </ul>{" "}
    </>
  );
}
async function PostItem({ post }: { post: Post }) {
  const user = await getUser(post.userId);
  return (
    <>
      {" "}
      <h3>{post.title}</h3> <dl>
        {" "}
        <dt>author</dt> <dd>{user?.username ?? "[unknown author]"}</dd>{" "}
      </dl> <p>{post.body}</p>{" "}
    </>
  );
}
```

fetcher.ts

```
export async function getPosts() { const res = await fetch("https://dummyjson.com/posts"); return (await res.json()) as { posts: Post[]; }; } type Post = { id: number; title: string; body: string; userId: number; }; export async function getUser(id: number) { const res = await fetch(`https://dummyjson.com/users/${id}`); return (await res.json()) as User; } type User = { id: number; username: string; };
```

ページレンダリング時に`getPosts()`を 1 回と`getUser()`を N 回呼び出すことになり、ページ全体では以下のような N+1 回のデータフェッチが発生します。

- `https://dummyjson.com/posts`
- `https://dummyjson.com/users/1`
- `https://dummyjson.com/users/2`
- `https://dummyjson.com/users/3`
- ...

## 設計・プラクティス

上記のような N+1 データフェッチを避けるため、API 側では`https://dummyjson.com/users/?id=1&id=2&id=3...`のように、id を複数指定して User 情報を一括で取得できるよう設計するパターンがよく知られています。

このようなバックエンド API と、Next.js 側で DataLoader を利用することで前述のような N+1 データフェッチを解消することができます。

### DataLoader

DataLoader は GraphQL サーバーなどでよく利用されるライブラリで、データアクセスをバッチ処理・キャッシュする機能を提供します。具体的には以下のような流れで利用します。

1. バッチ処理する関数を定義
2. DataLoader のインスタンスを生成
3. 短期間[1]に`dataLoader.load(id)`を複数回呼び出すと、`id`の配列がバッチ処理に渡される
4. バッチ処理が完了すると`dataLoader.load(id)`の Promise が解決される

以下は非常に簡単な実装例です。

```
async function myBatchFn(keys: readonly number[]) { // keysを元にデータフェッチ // 実際にはdummyjsonはid複数指定に未対応なのでイメージです const res = await fetch( `https://dummyjson.com/posts/?${keys.map((key) => `id=${key}`).join("&")}`, ); const { posts } = (await res.json()) as { posts: Post[] }; return keys.map((key) => posts.find((post) => post.id === key) ?? null); } const myLoader = new DataLoader(myBatchFn); // 呼び出しはDataLoaderによってまとめられ、`myBatchFn([1, 2])`が呼び出される myLoader.load(1); myLoader.load(2);
```

### Next.js における DataLoader の利用

Server Components の兄弟もしくは兄弟の子孫コンポーネントは並行レンダリングされるので、それぞれで`await myLoader.load(1);`のようにしても DataLoader によってバッチングされます。

DataLoader を用いて、前述の実装例の`getUser()`を書き直してみます。

fetcher.ts

```
import DataLoader from "dataloader"; import * as React from "react"; // ... const getUserLoader = React.cache( () => new DataLoader((keys: readonly number[]) => batchGetUser(keys)), ); export async function getUser(id: number) { const userLoader = getUserLoader(); return userLoader.load(id); } async function batchGetUser(keys: readonly number[]) { // keysを元にデータフェッチ // 実際にはdummyjsonはid複数指定に未対応なのでイメージです const res = await fetch( `https://dummyjson.com/users/?${keys.map((key) => `id=${key}`).join("&")}`, ); const { users } = (await res.json()) as { users: User[] }; return keys.map((key) => users.find((user: User) => user.id === key) ?? null); } // ...
```

ポイントは`getUserLoader`が`React.cache()`を利用していることです。DataLoader はキャッシュ機能があるため、ユーザーからのリクエストを跨いでインスタンスを共有してしまうと予期せぬデータ共有につながります。そのため、**ユーザーからのリクエスト単位で DataLoader のインスタンスを生成**する必要があり、これを実現するために React Cache を利用しています。

上記のように実装することで、`getUser()`のインターフェースは変えずに N+1 データフェッチを解消することができます。

## トレードオフ

### Eager Loading パターン

ここで紹介した設計パターンはいわゆる**Lazy Loading**パターンの一種です。バックエンド API 側の実装・パフォーマンス観点から Lazy Loading が適さない場合は**Eager Loading**パターン、つまり N+1 の最初の 1 回のリクエストで関連する必要な情報を全て取得することを検討しましょう。

Eager Loading パターンはやりすぎると、密結合で責務が大きすぎるいわゆる**God API**になってしまう傾向にあります。これらの詳細については次章の細粒度の REST API 設計で解説します。

脚注

1. バッチングスケジュールの詳細は公式の説明を参照ください。

# 細粒度の REST API 設計

## 要約

バックエンドの REST API 設計は、Next.js 側の設計にも大きく影響をもたらします。App Router(React Server Components)におけるバックエンド API は、細粒度な単位に分割されていることが望ましく、可能な限りこれを意識した設計を行いましょう。

## 背景

昨今のバックエンド API 開発において、最もよく用いられる設計は REST API です。REST API のリソース単位は、識別子を持つデータやオブジェクト単位でできるだけ細かく**細粒度**に分割することが基本です。しかし、細粒度の API は利用者システムとの通信回数が多くなってしまうため、これを避けるためにより大きな**粗粒度**単位で API 設計することがよくあります。

### リソース単位の粒度とトレードオフ

細粒度な API で通信回数が多くなることは Chatty API（おしゃべりな API）と呼ばれ、逆に粗粒度な API で汎用性に乏しい状態は God API（神 API）と呼ばれます。これらはそれぞれアンチパターンとされることがありますが、実際には観点次第で最適解が異なるので、一概にアンチパターンなのではなくそれぞれトレードオフが伴うと捉えるべきです。

| リソース単位の粒度 | 設計観点 | パフォーマンス(低速な通信) | パフォーマンス(高速な通信) |
| ------------------ | -------- | -------------------------- | -------------------------- |
| 細粒度             | ✅       | ❌                         | ✅                         |
| 粗粒度             | ❌       | ✅                         | ✅                         |

### ページと密結合になりがちな粗粒度単位

App Router 登場以前の Next.js や React アプリケーションに対するバックエンド API では、API 設計がページと密結合になり、汎用性や保守性に乏しくなるケースが多々見られました。

クライアントサイドでデータフェッチを行う場合、クライアント・サーバー間の通信は物理的距離や不安定なネットワーク環境の影響で低速になりがちなため、通信回数はパフォーマンスに大きく影響します。そのため、ページごとに 1 度の通信で完結するべく粗粒度な API 設計が採用されることがありました。

一方、Pages Router の`getServerSideProps()`を利用した BFF と API のサーバー間においては、高速なネットワークを介した通信となるため、通信回数がパフォーマンスボトルネックになる可能性は低くなります。しかし、`getServerSideProps()`はページ単位で定義するため、API にページ単位の要求が反映され、粗粒度な API 設計になるようなケースがよくありました。

## 設計・プラクティス

App Router においては、Server Components によってデータフェッチのコロケーションや分割が容易になったためコードやロジックの重複が発生しづらくなりました。このため、App Router は細粒度で設計された REST API と**非常に相性が良い**と言えます。

バックエンド API の設計観点から言っても、細粒度で設計された REST API の実装はシンプルに実装できることが多く、メリットとなるはずです。

### React Server Components と GraphQL のアナロジー

細粒度な API 設計は React Server Components で初めて注目されたものではなく、従来から GraphQL BFF に対するバックエンド API で好まれる傾向にありました。

このように、React Server Components と GraphQL には共通の思想が見えます。

データフェッチ on Server Components でも述べたように、React Server Components の最初の RFC は Relay の初期開発者の 1 人で GraphQL を通じて React におけるデータフェッチのベストプラクティスを追求してきた Joe Savona 氏が提案しており、React Server Components には**GraphQL の精神的後継**という側面があります。

このような React Server Components と GraphQL における類似点については、以下の Quramy さんの記事で詳しく解説されているので、興味がある方は参照してみてください。

## トレードオフ

### バックエンドとの通信回数

前述の通り、サーバー間通信は多くの場合高速で安定しています。そのため、通信回数が多いことはデメリットになりづらいと言えますが、アプリケーション特性にもよるので実際には注意が必要です。

並行データフェッチや N+1 と DataLoader で述べたプラクティスや、データフェッチ単位のキャッシュである Data Cache を活用して、通信頻度やパフォーマンスを最適化しましょう。

### バックエンド API 開発チームの理解

バックエンド API には複数の利用者がいる場合もあるため、Next.js が細粒度の API の方が都合がいいからといって一存で決めれるとは限りません。バックエンド開発チームの経験則や価値観もあります。

しかし、細粒度の API にすることはフロントエンド開発チームにとってもバックエンド開発チームにとってもメリットが大きく、無碍にできない要素なはずです。最終的な判断がバックエンド開発チームにあるとしても、しっかりメリットや Next.js 側の背景を伝え理解を得るべく努力しましょう。

# ユーザー操作とデータフェッチ

## 要約

ユーザー操作に基づくデータフェッチと再レンダリングには、Server Actions と`useActionState()`を利用しましょう。

## 背景

データフェッチ on Server Components で述べた通り、App Router においてデータフェッチは Server Components で行うことが基本形です。しかし、ユーザー操作に基づいてデータフェッチ・再レンダリングを行うのに Server Components は適していません。App Router においては`router.refresh()`などでページ全体を再レンダリングすることはできますが、ユーザー操作に基づいて部分的に再レンダリングしたい場合には不適切です。

## 設計・プラクティス

App Router がサポートしてる React Server Components においては、Server Actions と`useActionState()`(旧: `useFormState()`)を利用することで、ユーザー操作に基づいたデータフェッチを実現できます。

### `useActionState()`

`useActionState()`は関数と初期値を渡すことで、Server Actions によってのみ更新できる State 管理が実現できます。

以下はユーザーの入力に基づいて商品を検索する実装例です。Server Actions として定義された`searchProducts()`を`useActionState()`の第一引数に渡しており、form がサブミットされるごとに実行されます。

app/actions.ts

```
"use server"; export async function searchProducts( _prevState: Product[], formData: FormData, ) { const query = formData.get("query") as string; const res = await fetch(`https://dummyjson.com/products/search?q=${query}`); const { products } = (await res.json()) as { products: Product[] }; return products; } // ...
```

app/form.tsx

```tsx
"use client";
import { useActionState } from "react-dom";
import { searchProducts } from "./actions";
export default function Form() {
  const [products, action] = useActionState(searchProducts, []);
  return (
    <>
      {" "}
      <form action={action}>
        {" "}
        <label htmlFor="query">
          {" "}
          Search Product:&nbsp; <input
            type="text"
            id="query"
            name="query"
          />{" "}
        </label> <button type="submit">Submit</button>{" "}
      </form> <ul>
        {" "}
        {products.map((product) => (
          <li key={product.id}>{product.title}</li>
        ))}{" "}
      </ul>{" "}
    </>
  );
}
```

これにより、 検索したい文字列を入力・サブミットすると、検索ヒットした商品の名前が表出するようになっています。

## トレードオフ

### URL シェア・リロード対応

form 以外ほとんど要素がないような単純なページであれば、公式チュートリアルの実装例のように`router.replace()`によって URL を更新・ページ全体を再レンダリングするという手段があります。

チュートリアルの実装例(簡易版)

```tsx
"use client"; import { useSearchParams, usePathname, useRouter } from "next/navigation"; export default function Search() { const searchParams = useSearchParams(); const pathname = usePathname(); const { replace } = useRouter(); function handleSearch(term: string) { // MEMO: 実際にはdebounce処理が必要 const params = new URLSearchParams(searchParams); if (term) { params.set("query", term); } else { params.delete("query"); } replace(`${pathname}?${params.toString()}`); } return ( <input onChange={(e) => handleSearch(e.target.value)} defaultValue={searchParams.get("query")?.toString()} /> ); }
```

```tsx
export default async function Page({
  searchParams,
}: {
  searchParams?: { query?: string; page?: string };
}) {
  const query = searchParams?.query || "";
  const currentPage = Number(searchParams?.page) || 1;
  return (
    <div>
      {" "}
      <Search /> {/* ... */} <Suspense
        key={query + currentPage}
        fallback={<InvoicesTableSkeleton />}
      >
        {" "}
        <Table query={query} currentPage={currentPage} />{" "}
      </Suspense> {/* ... */}{" "}
    </div>
  );
}
```

この場合、Server Actions と`useActionState()`のみでは実現できないリロード復元や URL シェアが実現できます。上記例のように検索が主であるページにおいては、状態を URL に保存することを検討すべきでしょう。`useActionState()`を使いつつ、状態を URL に保存することもできます。

一方サイドナビゲーションや cmd+k で開く検索モーダルのように、リロード復元や URL シェアをする必要がないケースでは、Server Actions と`useActionState()`の実装が非常に役立つことでしょう。

### データ操作に伴う再レンダリング

ここで紹介したのはユーザー操作に伴うデータフェッチ、つまり**データ操作を伴わない**場合の設計パターンです。ユーザー操作にともなってデータを操作し、その後の結果を再取得したいこともあります。これは Server Actions と`revalidatePath()`/`revalidateTag()`を組み合わせ実行することで実現できます。

これについては、後述のデータ操作と Server Actions にて詳細を解説します。

```

```
````
