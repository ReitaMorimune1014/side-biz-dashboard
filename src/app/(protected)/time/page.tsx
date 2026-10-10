import type { Metadata } from "next";
import Link from "next/link";
import { DeleteButton } from "@/components/delete-button";
import { WeeklySummary } from "@/components/weekly-summary";
import { verifySession } from "@/lib/auth/dal";
import { formatDateWithWeekday, todayInTokyo } from "@/lib/date";
import { listProjects } from "@/lib/projects/repository";
import { getSettings } from "@/lib/settings/repository";
import { createClient } from "@/lib/supabase/server";
import { formatMinutes } from "@/lib/time-entries/duration";
import { listTimeEntries, sumMinutesBetween } from "@/lib/time-entries/repository";
import { weeklyUsage } from "@/lib/weekly/usage";
import { weekRange } from "@/lib/weekly/week";
import { createTimeEntryAction, deleteTimeEntryAction } from "./actions";
import { toProjectOptions } from "./project-options";
import { TimeEntryForm } from "./time-entry-form";

export const metadata: Metadata = {
  title: "稼働",
};

export default async function TimePage() {
  await verifySession();

  const supabase = await createClient();
  const [projects, entries, settings] = await Promise.all([
    listProjects(supabase),
    listTimeEntries(supabase),
    getSettings(supabase),
  ]);
  const today = todayInTokyo();
  const range = weekRange(today, settings.week_start);
  const usage = weeklyUsage(
    await sumMinutesBetween(supabase, range.start, range.end),
    settings.weekly_target_minutes,
  );

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-10">
      <h1 className="text-2xl font-semibold">稼働</h1>

      <WeeklySummary usage={usage} range={range} />

      <section aria-labelledby="new-entry" className="flex flex-col gap-4">
        <h2 id="new-entry" className="text-lg font-semibold">
          稼働を記録
        </h2>
        {projects.length === 0 ? (
          <div className="rounded-md border border-dashed border-zinc-400 p-8 text-center">
            <p className="text-zinc-700">稼働を記録するには、先に案件を登録してください。</p>
            <Link href="/projects/new" className="mt-2 inline-block text-sm underline">
              案件を追加する
            </Link>
          </div>
        ) : (
          <TimeEntryForm
            action={createTimeEntryAction}
            projects={toProjectOptions(projects)}
            defaultValues={{ work_date: today }}
            submitLabel="記録する"
          />
        )}
      </section>

      <section aria-labelledby="entries" className="flex flex-col gap-4">
        <h2 id="entries" className="text-lg font-semibold">
          記録
        </h2>
        {entries.length === 0 ? (
          <p className="rounded-md border border-dashed border-zinc-400 p-8 text-center text-zinc-700">
            まだ稼働が記録されていません。
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-zinc-200 rounded-md border border-zinc-200">
            {entries.map((entry) => {
              const name = `${formatDateWithWeekday(entry.work_date)}の「${entry.project.title}」の稼働`;
              return (
                <li
                  key={entry.id}
                  className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between"
                >
                  <div className="flex min-w-0 flex-col gap-1">
                    <p className="flex flex-wrap items-baseline gap-x-3">
                      <span className="text-sm text-zinc-700">
                        {formatDateWithWeekday(entry.work_date)}
                      </span>
                      <span className="font-medium">{formatMinutes(entry.minutes)}</span>
                    </p>
                    <p className="break-words">{entry.project.title}</p>
                    {entry.memo && (
                      <p className="line-clamp-2 text-sm whitespace-pre-line text-zinc-600">
                        {entry.memo}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Link
                      href={`/time/${entry.id}/edit`}
                      aria-label={`${name}を編集`}
                      className="rounded-md border border-zinc-400 px-3 py-1.5 text-sm font-medium"
                    >
                      編集
                    </Link>
                    <DeleteButton
                      action={deleteTimeEntryAction.bind(null, entry.id)}
                      name={name}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
