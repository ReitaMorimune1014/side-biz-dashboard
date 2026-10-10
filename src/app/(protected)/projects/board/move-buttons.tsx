"use client";

import { PROJECT_STATUS_LABELS, type ProjectStatus } from "@/lib/projects/status";
import { useMoveProject } from "../use-move-project";

type Props = {
  projectId: string;
  title: string;
  from: ProjectStatus;
  forward: readonly ProjectStatus[];
  back: readonly ProjectStatus[];
};

const primaryClass =
  "inline-flex min-h-8 items-center rounded-md bg-zinc-900 px-3 text-xs font-medium text-white disabled:opacity-60";
const secondaryClass =
  "inline-flex min-h-8 items-center rounded-md border border-zinc-400 px-3 text-xs font-medium text-zinc-700 disabled:opacity-60";
const backClass =
  "inline-flex min-h-8 items-center px-1 text-xs text-zinc-600 underline disabled:opacity-60";

export function MoveButtons({ projectId, title, from, forward, back }: Props) {
  const [state, formAction, pending] = useMoveProject(projectId, from);

  if (forward.length === 0 && back.length === 0) return null;

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        {forward.map((to) => (
          <button
            key={to}
            type="submit"
            name="to"
            value={to}
            disabled={pending}
            aria-label={`「${title}」を${PROJECT_STATUS_LABELS[to]}にする`}
            className={to === "lost" ? secondaryClass : primaryClass}
          >
            {PROJECT_STATUS_LABELS[to]}にする
          </button>
        ))}
        {back.map((to) => (
          <button
            key={to}
            type="submit"
            name="to"
            value={to}
            disabled={pending}
            aria-label={`「${title}」を${PROJECT_STATUS_LABELS[to]}に戻す`}
            className={backClass}
          >
            {PROJECT_STATUS_LABELS[to]}に戻す
          </button>
        ))}
      </div>
      {pending && (
        <p role="status" className="text-xs text-zinc-600">
          移動中…
        </p>
      )}
      {state.status === "error" && (
        <p role="alert" className="text-xs text-red-700">
          {state.message}
        </p>
      )}
    </form>
  );
}
