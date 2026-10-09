"use client";

import { useActionState } from "react";
import { PROJECT_STATUS_LABELS, type ProjectStatus } from "@/lib/projects/status";
import { moveProjectAction, type MoveProjectState } from "../actions";

type Props = {
  projectId: string;
  title: string;
  from: ProjectStatus;
  options: readonly ProjectStatus[];
};

const initialState: MoveProjectState = { status: "idle" };

export function MoveButtons({ projectId, title, from, options }: Props) {
  const [state, formAction, pending] = useActionState(
    async (_prev: MoveProjectState, formData: FormData) =>
      moveProjectAction(projectId, from, String(formData.get("to") ?? "")),
    initialState,
  );

  if (options.length === 0) return null;

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {options.map((to) => (
          <button
            key={to}
            type="submit"
            name="to"
            value={to}
            disabled={pending}
            aria-label={`「${title}」を${PROJECT_STATUS_LABELS[to]}にする`}
            className={
              to === "lost"
                ? "rounded-md border border-zinc-400 px-2.5 py-1 text-xs font-medium text-zinc-700 disabled:opacity-60"
                : "rounded-md bg-zinc-900 px-2.5 py-1 text-xs font-medium text-white disabled:opacity-60"
            }
          >
            {PROJECT_STATUS_LABELS[to]}にする
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
