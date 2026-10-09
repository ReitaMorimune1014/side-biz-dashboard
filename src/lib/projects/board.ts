import { PROJECT_STATUSES, type ProjectStatus } from './status'

export type BoardColumn<T> = { status: ProjectStatus; items: T[] }

/** 状態ごとの列に分ける。列は PROJECT_STATUSES の順で、空の列も返す。列の中は元の順を保つ */
export function groupProjectsByStatus<T extends { status: ProjectStatus }>(
  projects: readonly T[],
): BoardColumn<T>[] {
  const columns = new Map<ProjectStatus, T[]>(PROJECT_STATUSES.map((status) => [status, []]))
  for (const project of projects) {
    columns.get(project.status)?.push(project)
  }
  return PROJECT_STATUSES.map((status) => ({ status, items: columns.get(status) ?? [] }))
}
