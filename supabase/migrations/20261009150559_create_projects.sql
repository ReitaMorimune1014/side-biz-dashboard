-- 案件の顧客が「同じ持ち主の顧客」であることを、複合の外部キーで保証するため
-- (外部キーの確認は RLS を通らないので、customer_id だけでは他人の顧客を指定できてしまう)
alter table public.customers
  add constraint customers_id_user_id_key unique (id, user_id);

create table public.projects (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid()
                references auth.users (id) on delete cascade,
  customer_id uuid not null,
  title       text not null check (char_length(btrim(title)) between 1 and 100),
  -- 税込の円(整数)
  amount      integer not null check (amount between 0 and 999999999),
  -- 納期。未定なら null
  due_date    date,
  status      text not null default 'estimate' check (status in (
                'estimate', 'ordered', 'in_progress', 'delivered', 'invoiced', 'paid', 'lost'
              )),
  memo        text check (char_length(memo) <= 2000),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  foreign key (customer_id, user_id)
    references public.customers (id, user_id) on delete cascade
);

create index projects_user_id_idx on public.projects (user_id);
create index projects_customer_id_idx on public.projects (customer_id);

alter table public.projects enable row level security;

-- 案件は削除しない(不要な案件は「失注」にする)ため、delete の権限とポリシーは付けない
revoke all on table public.projects from anon, authenticated;
grant select, insert, update on table public.projects to authenticated;

create policy projects_select_own on public.projects
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy projects_insert_own on public.projects
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy projects_update_own on public.projects
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

-- 状態遷移のルール。src/lib/projects/status.ts と同じ内容にする
-- (RLS は「誰の行か」しか見ないので、本人が API を直接呼んだときの不正な遷移はここで拒否する)
create function public.check_project_status_transition() returns trigger
  language plpgsql set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    if new.status <> 'estimate' then
      raise exception 'new project must start as estimate'
        using errcode = 'check_violation';
    end if;
    return new;
  end if;

  if new.status = old.status then
    return new;
  end if;

  if not (
       (old.status = 'estimate'    and new.status in ('ordered', 'lost'))
    or (old.status = 'ordered'     and new.status in ('in_progress', 'lost'))
    or (old.status = 'in_progress' and new.status = 'delivered')
    or (old.status = 'delivered'   and new.status = 'invoiced')
    or (old.status = 'invoiced'    and new.status = 'paid')
  ) then
    raise exception 'invalid status transition: % -> %', old.status, new.status
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

create trigger projects_check_status_transition
  before insert or update of status on public.projects
  for each row execute function public.check_project_status_transition();
