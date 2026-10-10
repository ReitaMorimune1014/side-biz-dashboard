-- 閲覧専用のアカウント(公開デモ用)。
-- app_metadata は管理者だけが書き換えられ、本人は変えられないので、権限の判定に使える。
-- 付け方: supabase/demo/seed.sql を参照
create function public.is_read_only() returns boolean
  language sql stable set search_path = '' as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'read_only')::boolean, false)
$$;

revoke all on function public.is_read_only() from public, anon;
grant execute on function public.is_read_only() to authenticated;

-- restrictive のポリシーは、既存の「本人の行だけ」のポリシーと AND で組み合わさる。
-- 閲覧専用のアカウントは、読むことはできるが、追加・更新・削除はできない
create policy customers_not_read_only_insert on public.customers
  as restrictive for insert to authenticated
  with check (not (select public.is_read_only()));
create policy customers_not_read_only_update on public.customers
  as restrictive for update to authenticated
  using (not (select public.is_read_only()))
  with check (not (select public.is_read_only()));
create policy customers_not_read_only_delete on public.customers
  as restrictive for delete to authenticated
  using (not (select public.is_read_only()));

-- 案件は削除の権限がもともとない
create policy projects_not_read_only_insert on public.projects
  as restrictive for insert to authenticated
  with check (not (select public.is_read_only()));
create policy projects_not_read_only_update on public.projects
  as restrictive for update to authenticated
  using (not (select public.is_read_only()))
  with check (not (select public.is_read_only()));

create policy time_entries_not_read_only_insert on public.time_entries
  as restrictive for insert to authenticated
  with check (not (select public.is_read_only()));
create policy time_entries_not_read_only_update on public.time_entries
  as restrictive for update to authenticated
  using (not (select public.is_read_only()))
  with check (not (select public.is_read_only()));
create policy time_entries_not_read_only_delete on public.time_entries
  as restrictive for delete to authenticated
  using (not (select public.is_read_only()));

-- 設定は削除の権限がもともとない
create policy user_settings_not_read_only_insert on public.user_settings
  as restrictive for insert to authenticated
  with check (not (select public.is_read_only()));
create policy user_settings_not_read_only_update on public.user_settings
  as restrictive for update to authenticated
  using (not (select public.is_read_only()))
  with check (not (select public.is_read_only()));
