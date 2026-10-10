-- 請求は使わず、案件の「売上日」で売上を数える
drop table public.invoices;

-- 売上日。案件が納品・請求済・入金済になった日。その日に案件の金額を売上として数える
alter table public.projects add column earned_on date;

-- すでに納品以降にある案件は、最後に更新した日(日本時間)を売上日にする
update public.projects
  set earned_on = (updated_at at time zone 'Asia/Tokyo')::date
  where status in ('delivered', 'invoiced', 'paid');

-- 納品以降の状態のときだけ、売上日がある
alter table public.projects
  add constraint projects_earned_on_matches_status
  check ((status in ('delivered', 'invoiced', 'paid')) = (earned_on is not null));

-- 売上の集計で、本人の行を売上日の範囲で読むため
create index projects_user_id_earned_on_idx on public.projects (user_id, earned_on);
