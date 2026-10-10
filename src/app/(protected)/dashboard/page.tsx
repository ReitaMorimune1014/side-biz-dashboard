import type { Metadata } from "next";
import Link from "next/link";
import { WeeklySummary } from "@/components/weekly-summary";
import { verifySession } from "@/lib/auth/dal";
import {
  DEADLINE_WINDOW_DAYS,
  statusCounts,
  upcomingDeadlines,
} from "@/lib/dashboard/summary";
import { formatDateWithWeekday, todayInTokyo } from "@/lib/date";
import { periodParam, periodRange } from "@/lib/earnings/period";
import { summarizeEarnings } from "@/lib/earnings/summary";
import { formatYen } from "@/lib/money";
import { listProjects } from "@/lib/projects/repository";
import { PROJECT_STATUS_LABELS } from "@/lib/projects/status";
import { getSettings } from "@/lib/settings/repository";
import { createClient } from "@/lib/supabase/server";
import { formatMinutes } from "@/lib/time-entries/duration";
import { sumMinutesBetween } from "@/lib/time-entries/repository";
import { weeklyUsage } from "@/lib/weekly/usage";
import { weekRange } from "@/lib/weekly/week";

export const metadata: Metadata = {
  title: "ダッシュボード",
};

function DaysLeft({ days }: { days: number }) {
  if (days < 0) {
    return (
      <span className="rounded bg-red-50 px-2 py-0.5 text-xs font-medium text-red-800">
        {-days}日過ぎています
      </span>
    );
  }
  if (days === 0) {
    return (
      <span className="rounded bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-900">
        今日が納期
      </span>
    );
  }
  return <span className="text-xs text-zinc-700">あと{days}日</span>;
}

export default async function DashboardPage() {
  const { email } = await verifySession();

  const today = todayInTokyo();
  const [year, month] = today.split("-").map(Number);
  const thisMonth = { view: "day", year, month } as const;
  const thisYear = { view: "month", year } as const;
  const monthRange = periodRange(thisMonth);

  const supabase = await createClient();
  const [projects, settings, monthMinutes] = await Promise.all([
    listProjects(supabase),
    getSettings(supabase),
    sumMinutesBetween(supabase, monthRange.start, monthRange.end),
  ]);
  const week = weekRange(today, settings.week_start);
  const usage = weeklyUsage(
    await sumMinutesBetween(supabase, week.start, week.end),
    settings.weekly_target_minutes,
  );

  const monthEarnings = summarizeEarnings(projects, thisMonth, year);
  const yearEarnings = summarizeEarnings(projects, thisYear, year);
  const deadlines = upcomingDeadlines(projects, today);
  const counts = statusCounts(projects);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-10">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">ダッシュボード</h1>
        <p className="text-sm text-zinc-600">{email} でログインしています。</p>
      </div>

      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="flex flex-col rounded-md border border-zinc-200 p-4">
          <dt className="text-xs text-zinc-600">今月の稼働時間</dt>
          <dd className="text-xl font-semibold">
            {monthMinutes > 0 ? formatMinutes(monthMinutes) : "0分"}
          </dd>
          <dd>
            <Link href="/time" className="text-xs underline">
              稼働を記録する
            </Link>
          </dd>
        </div>
        <div className="flex flex-col rounded-md border border-zinc-200 p-4">
          <dt className="text-xs text-zinc-600">今月の売上</dt>
          <dd className="text-xl font-semibold">{formatYen(monthEarnings.total)}</dd>
          <dd>
            <Link href={`/money?view=day&at=${periodParam(thisMonth)}`} className="text-xs underline">
              {monthEarnings.count}件の内訳を見る
            </Link>
          </dd>
        </div>
        <div className="flex flex-col rounded-md border border-zinc-200 p-4">
          <dt className="text-xs text-zinc-600">今年の売上</dt>
          <dd className="text-xl font-semibold">{formatYen(yearEarnings.total)}</dd>
          <dd>
            <Link href={`/money?view=month&at=${periodParam(thisYear)}`} className="text-xs underline">
              {yearEarnings.count}件の内訳を見る
            </Link>
          </dd>
        </div>
      </dl>

      <WeeklySummary usage={usage} range={week} />

      <section aria-labelledby="deadlines" className="flex flex-col gap-3">
        <h2 id="deadlines" className="text-lg font-semibold">
          期限が近い納期
        </h2>
        <p className="text-xs text-zinc-600">
          受注・進行の案件のうち、期限切れと{DEADLINE_WINDOW_DAYS}日以内の納期です。
        </p>
        {deadlines.length === 0 ? (
          <p className="rounded-md border border-dashed border-zinc-400 p-8 text-center text-zinc-700">
            {DEADLINE_WINDOW_DAYS}日以内に納期を迎える案件はありません。
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-zinc-200 rounded-md border border-zinc-200">
            {deadlines.map((project) => (
              <li
                key={project.id}
                className="flex flex-col gap-1 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 flex-col gap-1">
                  <p className="flex flex-wrap items-center gap-2">
                    <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-800">
                      {PROJECT_STATUS_LABELS[project.status]}
                    </span>
                    <Link
                      href={`/projects/${project.id}/edit`}
                      className="font-medium break-words underline"
                    >
                      {project.title}
                    </Link>
                  </p>
                  <p className="text-sm text-zinc-700">{project.customer.name}</p>
                </div>
                <p className="flex shrink-0 items-center gap-2 text-sm">
                  <span>納期 {formatDateWithWeekday(project.due_date)}</span>
                  <DaysLeft days={project.daysLeft} />
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="status-counts" className="flex flex-col gap-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="status-counts" className="text-lg font-semibold">
            状態別の案件数
          </h2>
          <Link href="/projects/board" className="text-sm underline">
            かんばんで見る
          </Link>
        </div>
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {counts.map(({ status, count }) => (
            <div key={status} className="flex flex-col rounded-md border border-zinc-200 p-3">
              <dt className="text-xs text-zinc-600">{PROJECT_STATUS_LABELS[status]}</dt>
              <dd className="text-xl font-semibold">{count}件</dd>
            </div>
          ))}
        </dl>
      </section>
    </main>
  );
}
