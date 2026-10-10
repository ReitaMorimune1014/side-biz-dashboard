# side-biz-dashboard

副業の案件・売上・稼働時間を管理するダッシュボード(開発中)。

## 技術
Next.js(App Router) / TypeScript / Tailwind CSS / Supabase / Vitest

## 起動
1. `cp .env.example .env.local` して、Supabaseの値を入れる
2. `npm ci`
3. `npm run dev`

## 検証
`npm run lint && npm run typecheck && npm run test && npm run build`

結合テスト(ローカルの Supabase に、実際にリクエストを送る):
`npx supabase start` のあと `npm run test:integration`。
閲覧専用のテストは、ローカルの DB に直接つないでユーザーに印を付ける(ローカル以外の DB には接続しない)。

## 公開デモの作り方
公開デモは、本番とは**別の** Supabase プロジェクトと Vercel プロジェクトで動かす。
データはダミーだけで、訪問者は共有の閲覧専用アカウントでログインする(追加・変更・削除はできない)。

1. デモ用の Supabase プロジェクトを作り、`supabase/migrations` を適用する(`npx supabase link` → `npx supabase db push`)
2. Authentication の設定
   - 新規登録を止める(Sign In / Providers の "Allow new users to sign up" をオフ)
   - Email の "Secure email change" をオンにする
3. Authentication > Users で、デモ用のユーザーを作る(メールアドレスとパスワード、Auto Confirm)
   - パスワードは長いランダムな値にし、リポジトリには書かない
4. `supabase/demo/seed.sql` の `demo_email` をそのアドレスにして、SQL Editor で実行する
   - そのユーザーが閲覧専用になり、ダミーのデータが入る。何度実行しても、同じ状態に作り直す(日付は実行日が基準)
5. Vercel のデモ用プロジェクトに、環境変数を設定する
   - `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: デモ用プロジェクトの値
   - `SITE_URL`: デモの URL
   - `DEMO_MODE=true` / `DEMO_EMAIL` / `DEMO_PASSWORD`(**`NEXT_PUBLIC_` を付けない**。ブラウザには送られない)

デモモードでは、ログイン画面に「デモを見る(閲覧専用)」のボタンだけを出し、メールでのログインは受け付けない。

閲覧専用は、次の3か所で強制している。
- DB: `app_metadata.read_only` が true のユーザーは、RLS(restrictive のポリシー)で書き込めない。
  パスワード・メールアドレスも変えられない(共有アカウントの乗っ取り防止)。`app_metadata` は本人には変えられない
- サーバー: データを書き換える Server Action は、`requireUser()` で拒否する。新規作成・編集の画面は案内の画面へ転送する
- 画面: 追加・編集・削除・状態の変更のボタンを出さない

## 要件
`docs/requirements.md` を参照。

## 既知の課題
- 開発用のlintツールの依存に、既知の脆弱性の警告がある(本番の依存は0件)。上流の更新待ち。
- 公開デモは共有アカウントなので、誰かが「全端末からログアウト」を実行すると、ほかの訪問者もログアウトされる(もう一度ボタンを押せば入れる)。
