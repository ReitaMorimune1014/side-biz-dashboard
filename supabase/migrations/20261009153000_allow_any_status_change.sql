-- 状態は、どこからどこへでも変更できるようにする(一覧のプルダウン・編集画面)。
-- 新しい案件が見積から始まることだけは、引き続き DB で強制する。
-- 状態の値そのものは、projects.status の check 制約で 7 種類に制限している
create or replace function public.check_project_status_transition() returns trigger
  language plpgsql set search_path = '' as $$
begin
  if new.status <> 'estimate' then
    raise exception 'new project must start as estimate'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

drop trigger projects_check_status_transition on public.projects;

create trigger projects_check_status_transition
  before insert on public.projects
  for each row execute function public.check_project_status_transition();
