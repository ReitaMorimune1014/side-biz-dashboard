-- 間違えたときに戻せるように、1つ前の状態への遷移を許可する。
-- 失注からは、元が見積か受注かが残らないため、どちらにも戻せる。
-- src/lib/projects/status.ts と同じ内容にする
create or replace function public.check_project_status_transition() returns trigger
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
    -- 進む
       (old.status = 'estimate'    and new.status in ('ordered', 'lost'))
    or (old.status = 'ordered'     and new.status in ('in_progress', 'lost'))
    or (old.status = 'in_progress' and new.status = 'delivered')
    or (old.status = 'delivered'   and new.status = 'invoiced')
    or (old.status = 'invoiced'    and new.status = 'paid')
    -- 1つ前に戻す
    or (old.status = 'ordered'     and new.status = 'estimate')
    or (old.status = 'in_progress' and new.status = 'ordered')
    or (old.status = 'delivered'   and new.status = 'in_progress')
    or (old.status = 'invoiced'    and new.status = 'delivered')
    or (old.status = 'paid'        and new.status = 'invoiced')
    or (old.status = 'lost'        and new.status in ('estimate', 'ordered'))
  ) then
    raise exception 'invalid status transition: % -> %', old.status, new.status
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;
