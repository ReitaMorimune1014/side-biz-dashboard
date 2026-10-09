-- 請求。1つの案件に、いくつでも作れる(分割請求・月ごとの請求)。
-- 状態(未入金・入金済・期限切れ)は保存せず、入金日と支払期限から決める
-- (保存すると、期限を過ぎたときに書き換える仕組みが必要になり、ずれも起きるため)
create table public.invoices (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid()
               references auth.users (id) on delete cascade,
  project_id uuid not null,
  -- 税込の円(整数)
  amount     integer not null check (amount between 1 and 999999999),
  issued_on  date not null,
  due_on     date not null,
  -- 入金日。未入金なら null
  paid_on    date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (due_on >= issued_on),
  check (paid_on is null or paid_on >= issued_on),
  -- 外部キーの確認は RLS を通らないので、「同じ持ち主の案件」であることを複合キーで保証する
  foreign key (project_id, user_id)
    references public.projects (id, user_id) on delete cascade
);

create index invoices_user_id_idx on public.invoices (user_id);
create index invoices_project_id_idx on public.invoices (project_id);

alter table public.invoices enable row level security;

-- 間違えて作った請求を消せるように、delete も許可する
revoke all on table public.invoices from anon, authenticated;
grant select, insert, update, delete on table public.invoices to authenticated;

create policy invoices_select_own on public.invoices
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy invoices_insert_own on public.invoices
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy invoices_update_own on public.invoices
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy invoices_delete_own on public.invoices
  for delete to authenticated
  using ((select auth.uid()) = user_id);

create trigger invoices_set_updated_at
  before update on public.invoices
  for each row execute function public.set_updated_at();
