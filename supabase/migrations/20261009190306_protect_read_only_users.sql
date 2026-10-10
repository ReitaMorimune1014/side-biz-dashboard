-- 閲覧専用のアカウント(公開デモで共有する)は、本人の操作でパスワード・メール・電話番号を変えられない。
-- 変えられると、ほかの訪問者がデモに入れなくなる(乗っ取り)。
-- Auth の API は supabase_auth_admin として auth.users を更新するので、それを止める。
-- 管理者が SQL(postgres)で変えるのは許可する
create function public.protect_read_only_user() returns trigger
  language plpgsql set search_path = '' as $$
begin
  if coalesce((old.raw_app_meta_data ->> 'read_only')::boolean, false)
     and current_user <> 'postgres'
     and (new.encrypted_password is distinct from old.encrypted_password
          or new.email is distinct from old.email
          or new.email_change is distinct from old.email_change
          or new.phone is distinct from old.phone
          or new.phone_change is distinct from old.phone_change) then
    raise exception 'read-only account cannot change its credentials'
      using errcode = 'insufficient_privilege';
  end if;
  return new;
end;
$$;

revoke all on function public.protect_read_only_user() from public, anon, authenticated;

create trigger protect_read_only_user
  before update on auth.users
  for each row execute function public.protect_read_only_user();
