-- 顧客。全ての行に所有者(user_id)を持たせ、RLS で本人の行だけに限定する
create table public.customers (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid()
               references auth.users (id) on delete cascade,
  name       text not null check (char_length(btrim(name)) between 1 and 100),
  memo       text check (char_length(memo) <= 2000),
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ポリシーで毎回 user_id を絞り込むため、索引を張る
create index customers_user_id_idx on public.customers (user_id);

alter table public.customers enable row level security;

-- 既定で付く権限を外し、必要なものだけ付け直す(未ログインの anon には何も渡さない)
revoke all on table public.customers from anon, authenticated;
grant select, insert, update, delete on table public.customers to authenticated;

-- (select auth.uid()) と書くと、行ごとではなく問い合わせごとに1回だけ評価される
create policy customers_select_own on public.customers
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy customers_insert_own on public.customers
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

-- with check がないと、自分の行の user_id を他人に書き換えられる
create policy customers_update_own on public.customers
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy customers_delete_own on public.customers
  for delete to authenticated
  using ((select auth.uid()) = user_id);

create function public.set_updated_at() returns trigger
  language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger customers_set_updated_at
  before update on public.customers
  for each row execute function public.set_updated_at();
