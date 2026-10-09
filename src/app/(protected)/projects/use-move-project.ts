"use client";

import { useActionState } from "react";
import type { ProjectStatus } from "@/lib/projects/status";
import { moveProjectAction, type MoveProjectState } from "./actions";

const initialState: MoveProjectState = { status: "idle" };

/** フォームの "to" の値へ、状態を移す。from は画面に表示している状態 */
export function useMoveProject(projectId: string, from: ProjectStatus) {
  return useActionState(
    async (_prev: MoveProjectState, formData: FormData) =>
      moveProjectAction(projectId, from, String(formData.get("to") ?? "")),
    initialState,
  );
}
