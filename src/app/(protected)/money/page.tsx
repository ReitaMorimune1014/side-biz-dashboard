import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/states";
import { verifySession } from "@/lib/auth/dal";
import { todayInTokyo } from "@/lib/date";
import {
  parsePeriod,
  periodLabel,
  periodParam,
  periodRange,
  shiftPeriod,
  switchView,
  type Period,
  type PeriodView,
} from "@/lib/earnings/period";
import { hourlyRate, pipeline, summarizeEarnings } from "@/lib/earnings/summary";
import { formatYen } from "@/lib/money";
import { listProjects } from "@/lib/projects/repository";
import { PROJECT_STATUS_LABELS } from "@/lib/projects/status";
import { createClient } from "@/lib/supabase/server";
import { formatMinutes } from "@/lib/time-entries/duration";
import { sumMinutesBetween } from "@/lib/time-entries/repository";
import { BarChart } from "./bar-chart";

export const metadata: Metadata = {
  title: "お金",
};

const VIEWS: { view: PeriodView; label: string }[] = [
  { view: "day", label: "日ごと" },
  { view: "month", label: "月ごと" },
  { view: "year", label: "年ごと" },
];

/** 全期間の稼働を数えるときの範囲 */
const ALL_TIME = { start: "1900-01-01", end: "9999-12-31" };

function hrefOf(period: Period): string {
  const at = periodParam(period);
  return at ? `/money?view=${period.view}&at=${at}` : `/money?view=${period.view}`;
}

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

export default async function MoneyPage({ searchParams }: PageProps<"/money">) {
  await verifySession();

  const params = await searchParams;
  const today = todayInTokyo();
  const thisYear = Number(today.slice(0, 4));
  const period = parsePeriod({ view: first(params.view), at: first(params.at) }, today);
  const range = periodRange(period);

  const supabase = await createClient();
  const [projects, minutes] = await Promise.all([
    listProjects(supabase),
    sumMinutesBetween(supabase, (range ?? ALL_TIME).start, (range ?? ALL_TIME).end),
  ]);

  const summary = summarizeEarnings(projects, period, thisYear);
  const rate = hourlyRate(summary.total, minutes);
  const outlook = pipeline(projects);
  const label = periodLabel(period);
  const prev = shiftPeriod(period, -1);
  const next = shiftPeriod(period, 1);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-10">
      <h1 className="text-2xl font-semibold">お金</h1>

      <nav aria-label="集計の単位" className="flex gap-1 self-start rounded-md bg-zinc-100 p-1 text-sm">
        {VIEWS.map(({ view, label: viewLabel }) => (
          <Link
            key={view}
            href={hrefOf(switchView(view, period, today))}
            aria-current={view === period.view ? "page" : undefined}
            className={
              view === period.view
                ? "inline-flex min-h-8 items-center rounded bg-white px-3 font-medium shadow-sm"
                : "inline-flex min-h-8 items-center rounded px-3 text-zinc-700"
            }
          >
            {viewLabel}
          </Link>
        ))}
      </nav>

      <section aria-labelledby="period" className="flex flex-col gap-4 rounded-md border border-zinc-200 p-4">
        <h2 id="period" className="text-center text-lg font-semibold">
          {label}の売上
        </h2>
        {(prev || next) && (
          <nav aria-label="期間の移動" className="flex items-center justify-between gap-2">
            {prev ? (
              <Link
                href={hrefOf(prev)}
                className="inline-flex min-h-10 items-center rounded-md border border-zinc-300 px-3 text-sm"
              >
                ← {periodLabel(prev)}
              </Link>
            ) : (
              <span />
            )}
            {next ? (
              <Link
                href={hrefOf(next)}
                className="inline-flex min-h-10 items-center rounded-md border border-zinc-300 px-3 text-sm"
              >
                {periodLabel(next)} →
              </Link>
            ) : (
              <span />
            )}
          </nav>
        )}

        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="flex flex-col">
            <dt className="text-xs text-zinc-600">売上</dt>
            <dd className="text-xl font-semibold">{formatYen(summary.total)}</dd>
          </div>
          <div className="flex flex-col">
            <dt className="text-xs text-zinc-600">件数</dt>
            <dd className="text-xl font-semibold">{summary.count}件</dd>
          </div>
          <div className="flex flex-col">
            <dt className="text-xs text-zinc-600">稼働時間</dt>
            <dd className="text-xl font-semibold">{minutes > 0 ? formatMinutes(minutes) : "0分"}</dd>
          </div>
          <div className="flex flex-col">
            <dt className="text-xs text-zinc-600">時給(売上 ÷ 稼働時間)</dt>
            <dd className="text-xl font-semibold">{rate === null ? "—" : formatYen(rate)}</dd>
          </div>
        </dl>

        <BarChart buckets={summary.buckets} caption={`${label}の売上`} />
        <p className="text-xs text-zinc-600">
          納品・請求済・入金済の案件の金額を、売上日に数えています。売上日は案件の編集画面で直せます。
        </p>
      </section>

      <section aria-labelledby="outlook" className="flex flex-col gap-3 rounded-md border border-zinc-200 p-4">
        <h2 id="outlook" className="text-lg font-semibold">
          これから入る見込み
        </h2>
        <dl className="grid grid-cols-2 gap-3">
          <div className="flex flex-col">
            <dt className="text-xs text-zinc-600">受注・進行</dt>
            <dd className="text-xl font-semibold">{formatYen(outlook.committed.amount)}</dd>
            <dd className="text-xs text-zinc-600">{outlook.committed.count}件</dd>
          </div>
          <div className="flex flex-col">
            <dt className="text-xs text-zinc-600">見積中</dt>
            <dd className="text-xl font-semibold">{formatYen(outlook.estimate.amount)}</dd>
            <dd className="text-xs text-zinc-600">{outlook.estimate.count}件</dd>
          </div>
        </dl>
      </section>

      <section aria-labelledby="items" className="flex flex-col gap-3">
        <h2 id="items" className="text-lg font-semibold">
          {label}に売上にした案件
        </h2>
        {summary.items.length === 0 ? (
          <EmptyState message="この期間に売上にした案件はありません。" />
        ) : (
          <ul className="flex flex-col divide-y divide-zinc-200 rounded-md border border-zinc-200">
            {summary.items.map((project) => (
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
                  <p className="text-sm text-zinc-700">
                    {project.customer.name} ・ 売上日 {project.earned_on.replaceAll("-", "/")}
                  </p>
                </div>
                <p className="shrink-0 font-semibold">{formatYen(project.amount)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
