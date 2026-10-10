-- 公開デモ用のダミーデータ。本番とは別の、デモ専用の Supabase プロジェクトで実行する。
-- 手順は README の「公開デモの作り方」を参照。
--
-- 1. デモ用のユーザーを、ダッシュボードの Authentication > Users で作っておく(パスワード付き、確認済み)
-- 2. 下の demo_email を、そのユーザーのメールアドレスにする
-- 3. SQL Editor で、このファイル全体を実行する(何度実行しても、同じ状態に作り直す)
--
-- 実行すると:
-- - そのユーザーを閲覧専用にする(app_metadata.read_only = true)
-- - そのユーザーの既存のデータを消し、ダミーのデータを入れ直す。日付は実行した日を基準にする
-- 実在の人・会社のデータは入れない
do $$
declare
  demo_email constant text := 'demo@example.com';
  customer_names constant text[] := array[
    '架空商事', 'サンプル製作所', 'テスト不動産', 'ダミー書店',
    '見本デザイン事務所', '仮置きカフェ', 'モック学習塾', '例示クリニック'
  ];
  titles constant text[] := array[
    'LP制作', 'ECサイト改修', '予約フォーム追加', 'ブログ移行', '管理画面の改善',
    '採用ページ制作', 'アクセス解析の設定', '保守(月額)', '外部API連携', 'デザイン修正'
  ];
  amounts constant integer[] := array[45000, 80000, 120000, 150000, 200000, 60000, 98000, 300000];
  minutes_list constant integer[] := array[30, 45, 60, 90, 120, 150, 180];
  demo_id uuid;
  customer_ids uuid[] := '{}';
  project_ids uuid[] := '{}';
  new_id uuid;
  started date;
  next_status text;
  days_ago integer;
begin
  select id into demo_id from auth.users where email = demo_email;
  if demo_id is null then
    raise exception 'デモ用のユーザー % が見つかりません。先に Authentication で作ってください', demo_email;
  end if;

  update auth.users
    set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"read_only": true}'::jsonb
    where id = demo_id;

  -- 顧客を消すと、案件と稼働も消える(外部キーの on delete cascade)
  delete from public.customers where user_id = demo_id;
  delete from public.user_settings where user_id = demo_id;

  insert into public.user_settings (user_id, weekly_target_minutes, week_start)
    values (demo_id, 300, 1);

  for i in 1 .. array_length(customer_names, 1) loop
    insert into public.customers (user_id, name, memo, created_at)
      values (
        demo_id,
        customer_names[i],
        case when i % 3 = 0 then '知人の紹介。連絡はメールで' end,
        now() - make_interval(days => 560 - i)
      )
      returning id into new_id;
    customer_ids := customer_ids || new_id;
  end loop;

  -- 案件30件を、約18か月に分けて作る。古い案件ほど入金済が多い
  for i in 1 .. 30 loop
    started := current_date - (30 - i) * 18;
    next_status := case
      when i in (4, 11, 17) then 'lost'
      when i <= 22 then 'paid'
      when i <= 24 then 'invoiced'
      when i <= 26 then 'delivered'
      when i <= 28 then 'in_progress'
      when i = 29 then 'ordered'
      else 'estimate'
    end;

    -- 新しい案件は「見積」から始める決まり(DB のトリガー)なので、作ってから状態を変える
    insert into public.projects (user_id, customer_id, title, amount, due_date, memo, created_at)
      values (
        demo_id,
        customer_ids[1 + (i * 3) % array_length(customer_ids, 1)],
        titles[1 + (i - 1) % array_length(titles, 1)],
        amounts[1 + i % array_length(amounts, 1)],
        case
          when next_status = 'estimate' then null
          when next_status in ('in_progress', 'ordered') then current_date + (i - 26) * 4
          else started + 20
        end,
        case when i % 4 = 0 then '修正は2回まで。追加は別見積' end,
        started::timestamptz
      )
      returning id into new_id;
    project_ids := project_ids || new_id;

    if next_status <> 'estimate' then
      update public.projects
        set status = next_status,
            earned_on = case
              when next_status in ('delivered', 'invoiced', 'paid') then least(started + 20, current_date)
            end
        where id = new_id;
    end if;
  end loop;

  -- 変更履歴(F15)はトリガーが実行した瞬間の日時で記録するので、案件の日付に合わせて並べ直す。
  -- 作成は登録日、状態の変更は売上日(なければ登録の3日後)の18時(日本時間)にする
  update public.project_history h
    set changed_at = case
      when h.operation = 'create' then p.created_at
      else least(
        (coalesce(p.earned_on, (p.created_at at time zone 'Asia/Tokyo')::date + 3) + time '18:00')
          at time zone 'Asia/Tokyo',
        now()
      )
    end
    from public.projects p
    where p.id = h.project_id and h.user_id = demo_id;

  -- 稼働120件を、直近の約半年に分けて作る(今週の分も入る)
  for k in 0 .. 119 loop
    days_ago := (k * 3) / 2;
    insert into public.time_entries (user_id, project_id, work_date, minutes, memo)
      values (
        demo_id,
        project_ids[greatest(19, 28 - days_ago / 18)],
        current_date - days_ago,
        minutes_list[1 + k % array_length(minutes_list, 1)],
        case when k % 5 = 0 then '打ち合わせと修正' end
      );
  end loop;
end;
$$;
