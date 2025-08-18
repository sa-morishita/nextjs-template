````markdown
# 第 2 部 コンポーネント設計

React Server Components の RFC には以下のような記述があります。

> The fundamental challenge was that React apps were client-centric and weren't taking sufficient advantage of the server.
>
> <以下 Deepl 訳>
>
> 根本的な課題は、React アプリがクライアント中心で、サーバーを十分に活用していないことだった。

React コアチームは、React が抱えていたいくつかの課題を個別の課題としてではなく、根本的には「サーバーを活用できていない」ということが課題であると考えました。そして、サーバー活用と従来のクライアント主体な React の統合を目指し、設計されたアーキテクチャが React Server Components です。

第 1 部 データフェッチで解説してきた通り、特にデータフェッチに関しては従来よりシンプルでセキュアに実装できるようになったことで、ほとんどトレードオフなくコンポーネントにカプセル化することが可能となりました。一方コンポーネント設計においては、従来のクライアント主体の React コンポーネント相当である Client Components と、Server Components をうまく統合していく必要があります。

第 2 部では React Server Components におけるコンポーネント設計パターンを解説します。

# Client Components のユースケース

## 要約

Client Components を使うべき代表的なユースケースを覚えておきましょう。

- クライアントサイド処理
- サードパーティコンポーネント
- RSC Payload 転送量の削減

## 背景

第 1 部 データフェッチではデータフェッチ観点を中心に Server Components の設計パターンについて解説してきました。Client Components はオプトインのため、App Router におけるコンポーネント全体の設計は、Server Components を中心とした設計に Client Components を適切に組み合わせていく形で行います。

そのためにはそもそも、いつ Client Components にオプトインすべきなのか適切に判断できることが重要です。

## 設計・プラクティス

筆者が Client Components を利用すべきだと考える代表的な場合は大きく以下の 3 つです。

### クライアントサイド処理

最もわかりやすく Client Components が必要な場合は、クライアントサイド処理を必要とする場合です。以下のような場合が考えられます。

- `onClick()`や`onChange()`といったイベントハンドラの利用
- 状態 hooks(`useState()`や`useReducer()`など)やライフサイクル hooks(`useEffect()`など)の利用
- ブラウザ API の利用

```tsx
"use client";
import { useState } from "react";
export default function Counter() {
  const [count, setCount] = useState(0);
  return (
    <div>
      {" "}
      <p>You clicked {count} times</p> <button
        onClick={() => setCount(count + 1)}
      >
        Click me
      </button>{" "}
    </div>
  );
}
```

### サードパーティコンポーネント

Client Components を提供するサードパーティライブラリが React Server Components に未対応な場合は、利用者側で Client Boundary を明示しなければならないことがあります。この場合には`"use client";`指定して re-export するか、利用者側で`"use client";`指定する必要があります。

app/\_components/accordion.tsx

```tsx
"use client";
import { Accordion } from "third-party-library";
export default Accordion;
```

app/\_components/side-bar.tsx

```tsx
"use client";
import { Accordion } from "third-party-library";
export function SideBar() {
  return (
    <div>
      {" "}
      <Accordion>{/* ... */}</Accordion>{" "}
    </div>
  );
}
```

### RSC Payload 転送量の削減

3 つ目は RSC Payload の転送量を減らしたい場合です。Client Components は当然ながらクライアントサイドでも実行されるので、Client Components が多いほど JavaScript バンドルサイズは増加します。一方 Server Components は RSC Payload として転送されるため、Server Components がレンダリングする ReactElement や属性が多いほど転送量が多くなります。

つまり**Client Components の JavaScript 転送量と Server Components の RSC Payload 転送量はトレードオフの関係**にあります。

Client Components を含む JavaScript バンドルは 1 回しかロードされませんが、Server Components はレンダリングされるたびに RSC Payload が転送されます。そのため、繰り返しレンダリングされるコンポーネントは RSC Payload の転送量を削減する目的で Client Components にすることが望ましい場合があります。

例えば以下の`<Product>`について考えてみます。

```tsx
export async function Product() {
  const product = await fetchProduct();
  return (
    <div class="... /* 大量のtailwindクラス */">
      {" "}
      <div class="... /* 大量のtailwindクラス */">
        {" "}
        <div class="... /* 大量のtailwindクラス */">
          {" "}
          <div class="... /* 大量のtailwindクラス */">
            {" "}
            {/* `product`参照 */}{" "}
          </div>{" "}
        </div>{" "}
      </div>{" "}
    </div>
  );
}
```

hooks なども特になく、ただ`product`を取得・参照しているのみです。しかしこのデータを参照してる ReactElement の出力結果サイズが大きいと、RSC Payload の転送コストが大きくなりパフォーマンス劣化を引き起こす可能性があります。特に低速なネットワーク環境においてページ遷移を繰り返す際などには影響が顕著になりがちです。

このような場合においては Server Components ではデータフェッチのみを行い、ReactElement 部分は Client Components に分離することで RSC Payload の転送量を削減することができます。

```tsx
export async function Product() {
  const product = await fetchProduct();
  return <ProductPresentaional product={product} />;
}
```

```tsx
"use client";
export function ProductPresentaional({ product }: { product: Product }) {
  return (
    <div class="... /* 大量のtailwindクラス */">
      {" "}
      <div class="... /* 大量のtailwindクラス */">
        {" "}
        <div class="... /* 大量のtailwindクラス */">
          {" "}
          <div class="... /* 大量のtailwindクラス */">
            {" "}
            {/* `product`参照 */}{" "}
          </div>{" "}
        </div>{" "}
      </div>{" "}
    </div>
  );
}
```

## トレードオフ

### Client Boundary と暗黙的な Client Components

`"use client";`が記述されたモジュールから`import`されるモジュール以降は全て暗黙的にクライアントモジュールとして扱われ、それらで定義されたコンポーネントは**全て Client Components**として扱われます。

このように、`"use client";`は依存関係において境界(Boundary)を定義するもので、この境界はよく**Client Boundary**と表現されます。

そのため、上位層のコンポーネントで Client Boundary を形成してしまうと下層で Server Components を含むことができなくなってしまい、React Server Components のメリットをうまく享受できなくなってしまうケースが散見されます。このようなケースへの対応は次章の Composition パターンで解説します。

# Composition パターン

## 要約

Composition パターンを駆使して、Server Components を中心に組み立てたコンポーネントツリーから Client Components を適切に切り分けましょう。

## 背景

第 1 部 データフェッチで述べたように、React Server Components のメリットを活かすには Server Components 中心の設計が重要となります。そのため、Client Components は**適切に分離・独立**していることが好ましいですが、これを実現するには Client Components の依存関係における 2 つの制約を考慮しつつ設計する必要があります。

### Client Components はサーバーモジュールを`import`できない

1 つは Client Components は Server Components はじめサーバーモジュールを`import`できないという制約です。クライアントサイドでも実行される以上、サーバーモジュールに依存できないのは考えてみると当然のことです。

そのため、以下のような実装はできません。

```tsx
"use client";
import { useState } from "react";
import { UserInfo } from "./user-info"; // Server Components export function SideMenu() { const [open, setOpen] = useState(false); return ( <> <UserInfo /> <div> <button type="button" onClick={() => setOpen((prev) => !prev)}> toggle </button> <div>...</div> </div> </> ); }
```

この制約に対し唯一例外となるのが`"use server";`が付与されたファイルや関数、つまり Server Actions です。

actions.ts

```
"use server"; export async function create() { // サーバーサイド処理 }
```

create-button.tsx

```tsx
"use client";
import { create } from "./actions"; // 💡Server Actionsならimportできる export function CreateButton({ children }: { children: React.ReactNode }) { return <button onClick={create}>{children}</button>; }
```

### Client Boundary

もう 1 つ注意すべきなのは、`"use client";`が記述されたモジュールから`import`されるモジュール以降は、**全て暗黙的にクライアントモジュールとして扱われる**ということです。そのため、定義されたコンポーネントは全て Client Components として実行可能でなければなりません。Client Components はサーバーモジュールを`import`できない以上、これも当然の帰結です。

`"use client";`はこのように依存関係において境界(Boundary)を定義するもので、この境界はよく**Client Boundary**と表現されます。

## 設計・プラクティス

前述の通り、App Router で Server Components の設計を活かすには Client Components を独立した形に切り分けることが重要となります。

これには大きく以下 2 つの方法があります。

### コンポーネントツリーの末端を Client Components にする

1 つは**コンポーネントツリーの末端を Client Components にする**というシンプルな方法です。Client Boundary を下層に限定するとも言い換えられます。

例えば検索バーを持つヘッダーを実装する際に、ヘッダーごと Client Components にするのではなく検索バーの部分だけ Client Components として切り出し、ヘッダー自体は Server Components に保つといった方法です。

header.tsx

```tsx
import { SearchBar } from "./search-bar"; // Client Components // page.tsxなどのServer Componentsから利用される export function Header() { return ( <header> <h1>My App</h1> <SearchBar /> </header> ); }
```

### Composition パターンを活用する

上記の方法はシンプルな解決策ですが、どうしても上位層のコンポーネントを Client Components にする必要がある場合もあります。その際には**Composition パターン**を活用して、Client Components を分離することが有効です。

前述の通り、Client Components は Server Components を`import`することができません。しかしこれは依存関係上の制約であって、コンポーネントツリーとしては Client Components の`children`などの props に Server Components を渡すことで、レンダリングが可能です。

前述の`<SideMenu>`の例を書き換えてみます。

side-menu.tsx

```tsx
"use client";
import { useState } from "react"; // `children`に`<UserInfo>`などのServer Componentsを渡すことが可能！ export function SideMenu({ children }: { children: React.ReactNode }) { const [open, setOpen] = useState(false); return ( <> {children} <div> <button type="button" onClick={() => setOpen((prev) => !prev)}> toggle </button> <div>...</div> </div> </> ); }
```

page.tsx

```tsx
import { UserInfo } from "./user-info"; // Server Components import { SideMenu } from "./side-menu"; // Client Components /** * Client Components(`<SideMenu>`)の子要素として * Server Components(`<UserInfo>`)を渡せる */ export function Page() { return ( <div> <SideMenu> <UserInfo /> </SideMenu> <main>{/* ... */}</main> </div> ); }
```

`<SideMenu>`の`children`が Server Components である`<UserInfo />`となっています。これがいわゆる Composition パターンと呼ばれる実装パターンです。

## トレードオフ

### 「後から Composition」の手戻り

Composition パターンを駆使すれば Server Components を中心にしつつ、部分的に Client Components を組み込むことが可能です。しかし、早期に Client Boundary を形成し後から Composition パターンを導入しようとすると、Client Components の設計を大幅に変更せざるを得なくなったり、Server Components 中心な設計から逸脱してしまう可能性があります。

そのため、React Server Components においては設計する順番も非常に重要です。画面を実装する段階ではまずデータフェッチを行う Server Components を中心に設計し、そこに必要に応じて Client Components を末端に配置したり Composition パターンで組み込んで実装を進めていくことを筆者はお勧めします。

データフェッチを行う Server Components を中心に設計することは、次章の Container/Presentational パターンにおける Container Components を組み立てることに等しい工程です。

# Container/Presentational パターン

## 要約

データ取得は Container Components・データの参照は Presentational Components に分離し、テスト容易性を向上させましょう。

## 背景

React コンポーネントのテストといえば React Testing Library(以下 RTL)や Storybook などを利用することが主流ですが、本書執筆時点でこれらの Server Components 対応の状況は芳しくありません。

### React Testing Library

RTL は現状 Server Components に未対応で、将来的にサポートするようなコメントも見られますが時期については不明です。

具体的には非同期なコンポーネントを`render()`することができないため、以下のように Server Components のデータフェッチに依存した検証はできません。

```tsx
test("random Todo APIより取得した`dummyTodo`がタイトルとして表示される", async () => { // mswの設定 server.use( http.get("https://dummyjson.com/todos/random", () => { return HttpResponse.json(dummyTodo); }), ); await render(<TodoPage />); // `<TodoPage>`はServer Components expect( screen.getByRole("heading", { name: dummyTodo.title }), ).toBeInTheDocument(); });
```

### Storybook

一方 Storybook は experimental ながら Server Components 対応を実装したとしているものの、実際には async な Client Components をレンダリングしているにすぎず、大量の mock を必要とするため筆者はあまり実用的とは考えていません。

```tsx
export default { component: DbCard }; export const Success = { args: { id: 1 }, parameters: { moduleMock: { // サーバーサイド処理の分`mock`が冗長になる mock: () => { const mock = createMock(db, "findById"); mock.mockReturnValue( Promise.resolve({ name: "Beyonce", img: "https://blackhistorywall.files.wordpress.com/2010/02/picture-device-independent-bitmap-119.jpg", tel: "+123 456 789", email: "b@beyonce.com", }), ); return [mock]; }, }, }, };
```

## 設計・プラクティス

前述の状況を踏まえると、テスト対象となる Server Components は「テストしにくいデータフェッチ部分」と「テストしやすい HTML を表現する部分」で分離しておくことが望ましいと考えられます。

このように、データを提供する層とそれを表現する層に分離するパターンは**Container/Presentational パターン**の再来とも言えます。

### 従来の Container/Presentational パターン

Container/Presentational パターンは元々、Flux 全盛だった React 初期に提唱された設計手法です。データの読み取り・振る舞い(主に Flux の action 呼び出しなど)の定義を Container Components が、データを参照し表示するのは Presentational Components が担うという責務分割がなされていました。

少々古い記事ですが、興味のある方は Dan Abramov 氏の記事をご参照ください。

### React Server Components における Container/Presentational パターン

React Server Components における Container/Presentational パターンは従来のものとは異なり、Container Components はデータフェッチなどのサーバーサイド処理のみを担います。一方 Presentational Components は、データフェッチを含まない**Shared Components**もしくは Client Components を指します。

| Components     | React 初期                                            | RSC 時代                                                           |
| -------------- | ----------------------------------------------------- | ------------------------------------------------------------------ |
| Container      | 状態参照、状態変更関数の定義                          | Server Components 上でのデータフェッチなどの**サーバーサイド処理** |
| Presentational | `props`を参照して ReactElement を定義する純粋関数など | **Shared Components/Client Components**                            |

Shared Components はサーバーモジュールに依存せず、`"use client";`もないモジュールで定義されるコンポーネントを指します。このようなコンポーネントは、Client Boundary 内においては Client Components として扱われ、そうでなければ Server Components として扱われます。

```tsx
// `"use client";`がないモジュール export function CompanyLinks() { return ( <ul> <li> <a href="/about">About</a> </li> <li> <a href="/contact">Contact</a> </li> </ul> ); }
```

Client Components や Shared Components は従来通り RTL や Storybook で扱うことができるので、テスト容易性が向上します。一方 Container Components はこれらのツールでレンダリング・テストすることが現状難しいので、`await ArticleContainer({ id })`のように単なる関数として実行することでテストが可能です。

### 実装例

例としてランダムな Todo を取得・表示するページを Container/Presentational パターンで実装してみます。

```tsx
export function TodoPagePresentation({ todo }: { todo: Todo }) {
  return (
    <>
      {" "}
      <h1>{todo.title}</h1> <pre>
        {" "}
        <code>{JSON.stringify(todo, null, 2)}</code>{" "}
      </pre>{" "}
    </>
  );
}
```

上記のように、Presentational Components はデータを受け取って表示するだけのシンプルなコンポーネントです。場合によって[1]は Client Components にすることもあるでしょう。このようなコンポーネントのテストは従来同様 RTL を使ってテストできます。

```tsx
test("`todo`として渡された値がタイトルとして表示される", () => {
  render(<TodoPagePresentation todo={dummyTodo} />);
  expect(
    screen.getByRole("heading", { name: dummyTodo.todo })
  ).toBeInTheDocument();
});
```

一方 Container Components については以下のように、データの取得が主な処理となります。

```tsx
export default async function Page() {
  const res = await fetch("https://dummyjson.com/todos/random", {
    next: { revalidate: 0 },
  });
  const todo = ((res) => res.json()) as Todo;
  return <TodoPagePresentation todo={todo} />;
}
```

非同期な Server Components は RTL で`render()`することができないので、単なる関数として実行して戻り値を検証します。以下は簡易的なテストケースの実装例です。

```
describe("todos/random APIよりデータ取得成功時", () => { test("TodoPresentationalにAPIより取得した値が渡される", async () => { // mswの設定 server.use( http.get("https://dummyjson.com/todos/random", () => { return HttpResponse.json(dummyTodo); }), ); const page = await Page(); expect(page.type).toBe(TodoPagePresentation); expect(page.props.todo).toEqual(dummyTodo); }); });
```

このように、コンポーネントを通常の関数のように実行すると`type`や`props`を得ることができるので、これらを元に期待値通りかテストすることができます。

ただし、上記のように`expect(page.type).toBe(TodoPagePresentation);`とすると、ReactElement の構造に強く依存してしまう Fragile(壊れやすい)なテストになってしまいます。そのため、実際にはこちらの記事にあるように、ReactElement を扱うユーティリティの作成やスナップショットテストなどを検討すると良いでしょう。

```tsx
describe("todos/random APIよりデータ取得成功時", () => { test("TodoPresentationalにAPIより取得した値が渡される", async () => { // mswの設定 server.use( http.get("https://dummyjson.com/todos/random", () => { return HttpResponse.json(dummyTodo); }), ); const page = await Page(); expect( getProps<typeof TodoPagePresentation>(page, TodoPagePresentation), ).toEqual({ todo: dummyTodo, }); }); });
```

## トレードオフ

### エコシステム側が将来対応する可能性

本章では現状 RTL や Storybook などが Server Components に対して未成熟であることを前提にしつつ、テスト容易性を向上するための手段として Container/Presentational パターンが役に立つとしています。しかし今後、RTL や Storybook 側の対応状況が変わってくると Container/Presentational パターンを徹底せずとも容易にテストできるようになることがあるかもしれません。

では Container/Presentational パターンは将来的に不要になる可能性が高く、他にメリットがないのでしょうか？次章 Container 1st な設計では Composition パターンと Container/Presentational パターンを組み合わせた、RSC のメリットを生かしつつ手戻りの少ない設計順序を提案します。

脚注

1. Client Components のユースケースを参照ください。

# Container 1st な設計とディレクトリ構成

## 要約

画面の設計はまず Container Components のみで行い、Presentational Components は後から追加することを心がけましょう。そうすることで Composition パターンを早期に適用した設計が可能になり、大きな手戻りを防ぐことができます。

## 背景

第 1 部 データフェッチでは Server Components の設計パターンを、第 2 部 コンポーネント設計ではここまで Client Components も含めたコンポーネント全体の設計パターンを解説してきました。ここまで順に読んでいただいた方は、すでに多くの設計パターンを理解されてることと思います。

しかし、これらを「理解してること」と「使いこなせること」は別問題です。

- テストを書けること
- TDD で開発できること

これらに大きな違いがあることと同じく、

- 設計パターンを理解してること
- 設計パターンを駆使して設計できること

これらにも大きな違いがあります。

React Server Components では特に、Composition パターンを後から適用しようとすると大幅な Client Components の設計見直しや書き換えが発生しがちです。こういった手戻りを防ぐためにも、設計の手順はとても重要です。

## 設計・プラクティス

筆者が提案する設計手順は、画面の設計はまず Container Components のみで行い、Presentational Components やそこで使う Client Components は後から実装する、といういわば**Container 1st な設計手法**です。これは、最初から**Composition パターンありきで設計する**ことと同義です。

具体的には以下のような手順になります。

1. Container Components のツリー構造を書き出す
2. Container Components を実装
3. Presentational Components(Shared/Client Components)を実装
4. 2,3 を繰り返す

この手順では Server Components ツリーをベースに設計することで、最初から Composition パターンを適用した状態・あるいは適用しやすい状態を目指します。これにより、途中で Container Components が増えたとしても修正範囲が少なく済むというメリットもあります。

### 実装例

よくあるブログ記事の画面実装を例に、Container 1st な設計を実際にやってみましょう。ここでは特に重要なステップ 1 を詳しく見ていきます。

画面に必要な情報は Post、User、Comments の 3 つを仮定し、それぞれに対して Container Components を考えます。

- `<PostContainer postId={postId}>`
- `<UserProfileContainer id={post.userId}>`
- `<CommentsContainer postId={postId}>`

`postId`は URL から取得できますが`userId`は Post 情報に含まれているので、`<UserProfileContainer>`は`<PostContainer>`で呼び出される形になります。一方`<CommentsContainer>`は`postId`を元にレンダリングされるので、`<PostContainer>`と並行に呼び出すことが可能です。

これらを加味して、まずは Container Components のツリー構造を`page.tsx`に実際に書き出してみます。各 Container や Presentational Components の実装は後から行うので、ここでは仮実装で構造を設計することに集中しましょう。

```tsx
export default async function Page({
  params,
}: {
  params: Promise<{ postId: string }>;
}) {
  const { postId } = await params;
  return (
    <>
      {" "}
      <PostContainer postId={postId} /> <CommentsContainer
        postId={postId}
      />{" "}
    </>
  );
}
async function PostContainer({ postId }: { postId: string }) {
  const post = await getPost(postId);
  return (
    <PostPresentation post={post}>
      {" "}
      <UserProfileContainer id={post.userId} />{" "}
    </PostPresentation>
  );
} // ...
```

ポイントは、`<PostPresentation>`が`children`として`<UserProfileContainer>`を受け取っている点です。この時点で Composition パターンが適用されているため、`<PostPresentation>`は必要に応じて Client Components にも Shared Components にもすることができます。

これでステップ 1 は終了です。以降はステップ 2,3 を繰り返すので、仮実装にしていた部分を 1 つづつ実装していきましょう。

1. `<PostContainer>`や`getPost()`の実装
2. `<PostPresentation>`の実装
3. `<CommentsContainer>`の実装
4. ...

本章の主題は設計であり、上記は実装の詳細話になるので、ここでは省略とさせていただきます。

### ディレクトリ構成案

App Router の規約ファイルはコロケーションを強く意識した設計がなされており、Route Segment で利用するコンポーネントや関数もできるだけコロケーションすることが推奨されます。

Container/Presentational パターンにおいて、ページやレイアウトから見える単位は Container 単位です。Presentational Components やその他のコンポーネントは、Container Components のプライベートな実装詳細に過ぎません。

これらを体現する Container 1st なディレクトリ設計として、Container の単位を`_containers`以下でディレクトリ分割することを提案します。このディレクトリ設計では、外部から利用されうる Container Components の公開を`index.tsx`で行うことを想定しています。

```
_containers
├── &lt;Container Name&gt; // e.g. `post-list`, `user-profile`
│  ├── index.tsx // Container Componentsをexport
│  ├── container.tsx
│  ├── presentational.tsx
│  └── ...
└── ...
```

`_containers`のようにディレクトリ名に`_`をつけているのは App Router におけるルーティングディレクトリと明確に区別する Private Folder の機能を利用するためです。筆者は`_components`、`_lib`のように他の Segment 内共通なコンポーネントや関数も`_`をつけたディレクトリにまとめることを好みます。

`app`直下からみた時には以下のような構成になります。

```
app
├── &lt;Segment&gt;
│  ├── page.tsx
│  ├── layout.tsx
│  ├── _containers
│  │  ├── &lt;Container Name&gt;
│  │  │  ├── index.tsx
│  │  │  ├── container.tsx
│  │  │  ├── presentational.tsx
│  │  │  └── ...
│  │  └── ...
│  ├── _components // 汎用的なClient Components
│  ├── _lib // 汎用的な関数など
│  └── ...
└── ...
```

命名やさらに細かい分割の詳細は、プロジェクトごとに適宜修正してもいいと思います。筆者が重要だと思うのはディレクトリを Container 単位で、ファイルを Container/Presentational で分割することです。

## トレードオフ

### 広すぎる export

前述のように、Presentational Components は Container Components の実装詳細と捉えることもできるので、本来 Presentational Components はプライベート定義として扱うことが好ましいと考えられます。

ディレクトリ構成例に基づいた設計の場合、Presentational Components は`presentational.tsx`で定義されます。

```
_containers
├── &lt;Container Name&gt; // e.g. `post-list`, `user-profile`
│  ├── index.tsx // Container Componentsをexport
│  ├── container.tsx
│  ├── presentational.tsx
│  └── ...
└── ...
```

上記の構成では`<Container Name>`の外から参照されるモジュールは`index.tsx`のみの想定です。ただ実際には、`presentational.tsx`で定義したコンポーネントもプロジェクトのどこからでも参照することができます。

このような同一ディレクトリにおいてのみ利用することを想定したモジュール分割においては、eslint-plugin-import-access を利用すると予期せぬ外部からの import を制限することができます。

上記のようなディレクトリ設計に沿わない場合でも、Presentational Components は Container Components のみが利用しうる**実質的なプライベート定義**として扱うようにしましょう。
````
