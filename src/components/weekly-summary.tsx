import Link from "next/link";
import { formatDateWithWeekday } from "@/lib/date";
import { formatMinutes } from "@/lib/time-entries/duration";
import type { UsageLevel, WeeklyUsage } from "@/lib/weekly/usage";

type Props = {
  usage: WeeklyUsage;
  range: { start: string; end: string };
};

const BAR_CLASS: Record<UsageLevel, string> = {
  in_progress: "bg-zinc-900",
  achieved: "bg-green-600",
};

function Message({ usage }: { usage: WeeklyUsage }) {
  if (usage.level === "in_progress") {
    return (
      <p className="text-sm text-zinc-700">目標まで、あと{formatMinutes(usage.remainingMinutes)}</p>
    );
  }
  return (
    <p role="status" className="rounded-md bg-green-50 p-3 text-sm text-green-800">
      {usage.extraMinutes === 0
        ? "今週の目標を達成しました。"
        : `今週の目標を達成しました。目標より${formatMinutes(usage.extraMinutes)}多く稼働しています。`}
    </p>
  );
}

export function WeeklySummary({ usage, range }: Props) {
  return (
    <section aria-labelledby="weekly" className="flex flex-col gap-3 rounded-md border border-zinc-200 p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="weekly" className="text-lg font-semibold">
          今週の稼働
        </h2>
        <p className="text-sm text-zinc-600">
          {formatDateWithWeekday(range.start)}〜{formatDateWithWeekday(range.end)}
        </p>
      </div>
      <p className="text-xl">
        <span className="font-semibold">{formatMinutes(usage.totalMinutes)}</span>
        <span className="text-zinc-700"> / {formatMinutes(usage.targetMinutes)}</span>
        <span className="ml-2 text-base text-zinc-700">({usage.percent}%)</span>
      </p>
      <div
        role="progressbar"
        aria-label="今週の目標の消化率"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.min(usage.percent, 100)}
        className="h-2 overflow-hidden rounded-full bg-zinc-200"
      >
        <div
          className={`h-full ${BAR_CLASS[usage.level]}`}
          style={{ width: `${Math.min(usage.percent, 100)}%` }}
        />
      </div>
      <Message usage={usage} />
      <Link href="/settings" className="self-start text-sm underline">
        目標時間を変更する
      </Link>
    </section>
  );
}
