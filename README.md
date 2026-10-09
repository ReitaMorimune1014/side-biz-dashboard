# side-biz-dashboard

副業の案件・請求・稼働時間を管理するダッシュボード(開発中)。

## 技術
Next.js(App Router) / TypeScript / Tailwind CSS / Supabase / Vitest

## 起動
1. `cp .env.example .env.local` して、Supabaseの値を入れる
2. `npm ci`
3. `npm run dev`

## 検証
`npm run lint && npm run typecheck && npm run test && npm run build`

## 要件
`docs/requirements.md` を参照。

## 既知の課題
- 開発用のlintツールの依存に、既知の脆弱性の警告がある(本番の依存は0件)。上流の更新待ち。
