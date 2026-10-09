import Link from "next/link";
import { formatDateWithWeekday } from "@/lib/date";
import { formatMinutes } from "@/lib/time-entries/duration";
import type { UsageLevel, WeeklyUsage } from "@/lib/weekly/usage";

type Props = {
  usage: WeeklyUsage;
  range: { start: string; end: string };
};

const BAR_CLASS: Record<UsageLevel, string> = {
  ok: "bg-zinc-900",
  warning: "bg-amber-500",
  over: "bg-red-600",
};

function Message({ usage }: { usage: WeeklyUsage }) {
  switch (usage.level) {
    case "ok":
      return <p className="text-sm text-zinc-700">残り{formatMinutes(usage.remainingMinutes)}</p>;
    case "warning":
      return (
        <p role="status" className="rounded-md bg-amber-50 p-3 text-sm text-amber-900">
          {usage.remainingMinutes === 0
            ? "今週の目標時間に達しました。"
            : `今週の目標の80%を超えました。残りは${formatMinutes(usage.remainingMinutes)}です。`}
        </p>
      );
    case "over":
      return (
        <p role="status" className="rounded-md bg-red-50 p-3 text-sm text-red-800">
          今週の目標を{formatMinutes(usage.overMinutes)}超えています。記録はこのまま続けられます。
        </p>
      );
  }
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
