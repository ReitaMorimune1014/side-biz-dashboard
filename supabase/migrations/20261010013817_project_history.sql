-- 案件の変更履歴(F15)。projects の作成・変更のたびに、トリガーが1行ずつ記録する。
-- 画面からでも API を直接呼んでも必ず残り、利用者は履歴を書き換えられない(読む権限だけ渡す)。
-- 履歴は、このマイグレーションを入れた時点から記録する(既存の案件の分は作らない)
create table public.project_history (
  id         bigint generated always as identity primary key,
  project_id uuid not null,
  user_id    uuid not null references auth.users (id) on delete cascade,
  operation  text not null check (operation in ('create', 'update')),
  -- 変わった項目だけ。{"列名": {"before": 変更前, "after": 変更後}}。作成のときは before が null
  changes    jsonb not null,
  changed_at timestamptz not null default now(),
  foreign key (project_id, user_id)
    references public.projects (id, user_id) on delete cascade
);

create index project_history_project_id_changed_at_idx
  on public.project_history (project_id, changed_at desc);
create index project_history_user_id_idx on public.project_history (user_id);

alter table public.project_history enable row level security;

revoke all on table public.project_history from anon, authenticated;
grant select on table public.project_history to authenticated;

create policy project_history_select_own on public.project_history
  for select to authenticated
  using ((select auth.uid()) = user_id);

-- 利用者には insert の権限がないので、所有者(postgres)の権限で書き込む。
-- 記録する値は、トリガーが受け取った行だけから作る
create function public.record_project_history() returns trigger
  language plpgsql security definer set search_path = '' as $$
declare
  tracked constant text[] := array[
    'customer_id', 'title', 'amount', 'due_date', 'status', 'earned_on', 'memo'
  ];
  new_row constant jsonb := to_jsonb(new);
  old_row jsonb;
  diff jsonb := '{}'::jsonb;
  col text;
begin
  if tg_op = 'UPDATE' then
    old_row := to_jsonb(old);
  end if;

  foreach col in array tracked loop
    if tg_op = 'INSERT' then
      if new_row -> col <> 'null'::jsonb then
        diff := diff || jsonb_build_object(col, jsonb_build_object('before', null, 'after', new_row -> col));
      end if;
    elsif old_row -> col is distinct from new_row -> col then
      diff := diff || jsonb_build_object(col, jsonb_build_object('before', old_row -> col, 'after', new_row -> col));
    end if;
  end loop;

  -- 更新日時しか変わっていない更新は、記録しない
  if diff = '{}'::jsonb then
    return null;
  end if;

  insert into public.project_history (project_id, user_id, operation, changes)
    values (new.id, new.user_id, case tg_op when 'INSERT' then 'create' else 'update' end, diff);
  return null;
end;
$$;

revoke all on function public.record_project_history() from public, anon, authenticated;

create trigger projects_record_history
  after insert or update on public.projects
  for each row execute function public.record_project_history();
