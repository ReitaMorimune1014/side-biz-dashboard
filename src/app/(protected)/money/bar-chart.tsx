import type { Bucket } from "@/lib/earnings/summary";
import { formatCompactYen, formatYen } from "@/lib/money";

type Props = {
  buckets: Bucket[];
  /** 表の見出し(読み上げ用) */
  caption: string;
};

/** 棒が多い(日ごと)ときは、目盛りの文字を間引く */
function showTick(index: number, length: number): boolean {
  if (length <= 12) return true;
  return index === 0 || index === length - 1 || (index + 1) % 5 === 0;
}

/**
 * ライブラリを使わない棒グラフ。見た目のグラフは読み上げから外し、
 * 同じ内容を表で読み上げる
 */
export function BarChart({ buckets, caption }: Props) {
  const max = Math.max(...buckets.map((b) => b.amount), 1);
  const showAmounts = buckets.length <= 12;
  // 月ごと(12本)は、スマホ幅だと金額の文字が隣と重なるので、640px 以上だけ出す
  const amountClass = buckets.length > 6 ? "hidden sm:block" : "";

  return (
    <figure className="flex flex-col gap-2">
      <div aria-hidden="true" className="flex h-48 items-end gap-0.5 border-b border-zinc-300 px-1 pt-5 sm:px-4">
        {buckets.map((bucket) => {
          const percent = (bucket.amount / max) * 100;
          return (
            <div
              key={bucket.key}
              title={`${bucket.label}: ${formatYen(bucket.amount)}(${bucket.count}件)`}
              className="relative flex h-full flex-1 items-end justify-center"
            >
              {showAmounts && bucket.amount > 0 && (
                <span
                  className={`absolute inset-x-0 text-center text-[10px] whitespace-nowrap text-zinc-700 ${amountClass}`}
                  style={{ bottom: `calc(${percent}% + 2px)` }}
                >
                  {formatCompactYen(bucket.amount)}
                </span>
              )}
              <div
                className="w-full max-w-16 rounded-t bg-green-600"
                style={{ height: bucket.amount > 0 ? `max(${percent}%, 2px)` : 0 }}
              />
            </div>
          );
        })}
      </div>
      <div aria-hidden="true" className="flex gap-0.5 px-1 sm:px-4">
        {buckets.map((bucket, index) => (
          <span key={bucket.key} className="flex-1 text-center text-[10px] text-zinc-600">
            {showTick(index, buckets.length) ? bucket.label : ""}
          </span>
        ))}
      </div>
      <table className="sr-only">
        <caption>{caption}</caption>
        <thead>
          <tr>
            <th scope="col">期間</th>
            <th scope="col">売上</th>
            <th scope="col">件数</th>
          </tr>
        </thead>
        <tbody>
          {buckets.map((bucket) => (
            <tr key={bucket.key}>
              <th scope="row">{bucket.label}</th>
              <td>{formatYen(bucket.amount)}</td>
              <td>{bucket.count}件</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
