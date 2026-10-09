-- 利用者ごとの設定(1人1行)。保存するまでは行がなく、アプリ側で既定値を使う
create table public.user_settings (
  user_id               uuid primary key default auth.uid()
                          references auth.users (id) on delete cascade,
  -- 週の目標時間(分)。1分〜1週間
  weekly_target_minutes integer not null default 300
                          check (weekly_target_minutes between 1 and 10080),
  -- 週の開始曜日。0 = 日曜 … 6 = 土曜
  week_start            smallint not null default 1 check (week_start between 0 and 6),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

alter table public.user_settings enable row level security;

-- 設定は消さない(既定値に戻すときも、値を保存し直す)
revoke all on table public.user_settings from anon, authenticated;
grant select, insert, update on table public.user_settings to authenticated;

create policy user_settings_select_own on public.user_settings
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy user_settings_insert_own on public.user_settings
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy user_settings_update_own on public.user_settings
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create trigger user_settings_set_updated_at
  before update on public.user_settings
  for each row execute function public.set_updated_at();
