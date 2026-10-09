"use client";

import { useState } from "react";
import {
  PROJECT_STATUSES,
  PROJECT_STATUS_LABELS,
  type ProjectStatus,
} from "@/lib/projects/status";
import { useMoveProject } from "./use-move-project";

type Props = {
  projectId: string;
  title: string;
  from: ProjectStatus;
};

/**
 * 選んだだけでは送らず、「変更」ボタンで送る(キーボードで選択肢を見ている途中に変わらないように)。
 * 変更に成功すると from が変わるので、呼び出し側で key に状態を含めて作り直す
 */
export function StatusSelect({ projectId, title, from }: Props) {
  const [state, formAction, pending] = useMoveProject(projectId, from);
  const [selected, setSelected] = useState<ProjectStatus>(from);
  const selectId = `status-${projectId}`;
  const dirty = selected !== from;

  return (
    <form action={formAction} className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <label htmlFor={selectId} className="sr-only">
          「{title}」の状態
        </label>
        <span className="relative">
          <select
            id={selectId}
            name="to"
            value={selected}
            onChange={(e) => setSelected(e.target.value as ProjectStatus)}
            disabled={pending}
            className="w-24 rounded-md border border-zinc-400 px-2 py-1 text-center text-sm [text-align-last:center]"
          >
            {PROJECT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {PROJECT_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
          {dirty && (
            <span
              aria-hidden="true"
              className="absolute -top-1 -right-1 size-2.5 rounded-full bg-red-600"
            />
          )}
        </span>
        {dirty && <span className="sr-only">未保存の変更があります</span>}
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
