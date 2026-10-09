"use client";

import { PROJECT_STATUS_LABELS, type ProjectStatus } from "@/lib/projects/status";
import { useMoveProject } from "./use-move-project";

type Props = {
  projectId: string;
  title: string;
  from: ProjectStatus;
  options: readonly ProjectStatus[];
};

/** 選んだだけでは送らず、「変更」ボタンで送る(キーボードで選択肢を見ている途中に変わらないように) */
export function StatusSelect({ projectId, title, from, options }: Props) {
  const [state, formAction, pending] = useMoveProject(projectId, from);
  const selectId = `status-${projectId}`;

  if (options.length === 0) return null;

  return (
    <form action={formAction} className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <label htmlFor={selectId} className="sr-only">
          「{title}」の状態
        </label>
        <select
          id={selectId}
          name="to"
          defaultValue={from}
          disabled={pending}
          className="rounded-md border border-zinc-400 px-2 py-1 text-sm"
        >
          <option value={from}>{PROJECT_STATUS_LABELS[from]}(今の状態)</option>
          {options.map((to) => (
            <option key={to} value={to}>
              {PROJECT_STATUS_LABELS[to]}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={pending}
          className="rounded-md border border-zinc-400 px-3 py-1 text-sm font-medium disabled:opacity-60"
        >
          {pending ? "変更中…" : "変更"}
        </button>
      </div>
      {state.status === "error" && (
        <p role="alert" className="text-xs text-red-700">
          {state.message}
        </p>
      )}
    </form>
  );
}
