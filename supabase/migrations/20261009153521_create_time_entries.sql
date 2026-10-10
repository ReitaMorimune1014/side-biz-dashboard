-- 稼働の案件が「同じ持ち主の案件」であることを、複合の外部キーで保証するため
-- (外部キーの確認は RLS を通らないので、project_id だけでは他人の案件を指定できてしまう)
alter table public.projects
  add constraint projects_id_user_id_key unique (id, user_id);

-- 稼働時間。分単位の整数で保存し、表示は時間にする
create table public.time_entries (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid()
               references auth.users (id) on delete cascade,
  project_id uuid not null,
  work_date  date not null,
  -- 1回の記録は1日分(24時間)まで
  minutes    integer not null check (minutes between 1 and 1440),
  memo       text check (char_length(memo) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (project_id, user_id)
    references public.projects (id, user_id) on delete cascade
);

-- 週の集計(F7)で、本人の行を日付の範囲で読むため
create index time_entries_user_id_work_date_idx on public.time_entries (user_id, work_date);
create index time_entries_project_id_idx on public.time_entries (project_id);

alter table public.time_entries enable row level security;

-- 稼働は、間違えたら消せるように delete も許可する(要件 F6)
revoke all on table public.time_entries from anon, authenticated;
grant select, insert, update, delete on table public.time_entries to authenticated;

create policy time_entries_select_own on public.time_entries
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy time_entries_insert_own on public.time_entries
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy time_entries_update_own on public.time_entries
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy time_entries_delete_own on public.time_entries
  for delete to authenticated
  using ((select auth.uid()) = user_id);

create trigger time_entries_set_updated_at
  before update on public.time_entries
  for each row execute function public.set_updated_at();
