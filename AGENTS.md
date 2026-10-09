<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## このプロジェクトのルール

### 作業の進め方
- 実装の前に、必ず `docs/requirements.md` を読む。1つの依頼は、要件のID1つだけ。
- 実装の前に、方針(変更するファイル、設計理由、代替案)を示して、確認を待つ。
- ブランチは `feature/<ID>-<内容>`。受け入れ条件を満たすテストを書く。
- 完了したら、PRの説明に「目的・設計理由・確認方法」を書く。
- 不明点は、推測で実装せず、実装の前に質問する。
- 新しいライブラリを足す前に、必要な理由を説明する。

### 安全のルール
- 認可は、画面を隠すだけにせず、サーバー側とデータベースの権限でも強制する。
- 秘密情報(secret key、service_role key)は、コードにも、`NEXT_PUBLIC_` の変数にも置かない。
- サーバー側のコードで、`supabase.auth.getSession()` を信用しない。ページの保護には `getClaims()`、データを書き換える操作には `getUser()` を使う。
- 業務ロジックは、画面から独立した関数にし、単体テストを書く。

## このプロジェクトのルール

### 作業の進め方
- 実装の前に、必ず `docs/requirements.md` を読む。1つの依頼は、要件のID1つだけ。
- 実装の前に、方針(変更するファイル、設計理由、代替案)を示して、確認を待つ。
- ブランチは `feature/<ID>-<内容>`。受け入れ条件を満たすテストを書く。
- 完了したら、PRの説明に「目的・設計理由・確認方法」を書く。
- 不明点は、推測で実装せず、実装の前に質問する。
- 新しいライブラリを足す前に、必要な理由を説明する。

### 安全のルール
- 認可は、画面を隠すだけにせず、サーバー側とデータベースの権限でも強制する。
- 秘密情報(secret key、service_role key)は、コードにも、`NEXT_PUBLIC_` の変数にも置かない。
- サーバー側のコードで、`supabase.auth.getSession()` を信用しない。ページの保護には `getClaims()`、データを書き換える操作には `getUser()` を使う。
- 業務ロジックは、画面から独立した関数にし、単体テストを書く。
