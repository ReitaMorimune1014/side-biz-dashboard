import Form from "next/form";
import Link from "next/link";

type SelectControl = {
  name: string;
  label: string;
  value: string;
  options: { value: string; label: string }[];
};

type Props = {
  /** 一覧のパス(検索するとこのパスへ GET で移る) */
  action: string;
  searchLabel: string;
  placeholder: string;
  q: string;
  selects: SelectControl[];
  /** 検索・絞り込みの条件があるときだけ渡す */
  clearHref?: string;
};

/**
 * 一覧の検索・絞り込み・並び替え。条件は URL に入るので、戻る・再読み込みでも残る。
 * 検索するとページ番号は送らないので、1ページ目に戻る
 */
export function ListControls({ action, searchLabel, placeholder, q, selects, clearHref }: Props) {
  // 「条件をクリア」で URL が変わったとき、入力欄も URL の値に戻す
  const key = [q, ...selects.map((s) => s.value)].join("\u0000");
  const idPrefix = `${action.replace(/\W/g, "")}-list`;

  return (
    <Form key={key} action={action} className="flex flex-wrap items-end gap-3" role="search">
      <div className="flex min-w-48 flex-1 flex-col gap-1">
        <label htmlFor={`${idPrefix}-q`} className="text-xs text-zinc-600">
          {searchLabel}
        </label>
        <input
          id={`${idPrefix}-q`}
          type="search"
          name="q"
          defaultValue={q}
          placeholder={placeholder}
          maxLength={100}
          className="rounded-md border border-zinc-400 px-3 py-1.5 text-sm"
        />
      </div>
      {selects.map((select) => (
        <div key={select.name} className="flex flex-col gap-1">
          <label htmlFor={`${idPrefix}-${select.name}`} className="text-xs text-zinc-600">
            {select.label}
          </label>
          <select
            id={`${idPrefix}-${select.name}`}
            name={select.name}
            defaultValue={select.value}
            className="max-w-56 rounded-md border border-zinc-400 bg-white px-2 py-1.5 text-sm"
          >
            {select.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      ))}
      <button
        type="submit"
        className="rounded-md bg-zinc-900 px-4 py-1.5 text-sm font-medium text-white"
      >
        検索
      </button>
      {clearHref && (
        <Link href={clearHref} className="self-center text-sm underline">
          条件をクリア
        </Link>
      )}
    </Form>
  );
}
