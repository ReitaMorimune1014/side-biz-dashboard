import type { Metadata } from "next";
import Link from "next/link";
import { ListControls } from "@/components/list-controls";
import { Pagination } from "@/components/pagination";
import { EmptyState } from "@/components/states";
import { verifySession } from "@/lib/auth/dal";
import { listHref } from "@/lib/list/query";
import { formatYen } from "@/lib/money";
import {
  PROJECT_SORTS,
  PROJECT_SORT_LABELS,
  applyProjectListQuery,
  hasProjectFilters,
  parseProjectListQuery,
  projectListParams,
} from "@/lib/projects/list";
import { listProjects } from "@/lib/projects/repository";
import { PROJECT_STATUSES, PROJECT_STATUS_LABELS } from "@/lib/projects/status";
import { createClient } from "@/lib/supabase/server";
import { StatusSelect } from "./status-select";
import { ViewTabs } from "./view-tabs";

export const metadata: Metadata = {
  title: "案件",
};

const PATH = "/projects";

export default async function ProjectsPage({ searchParams }: PageProps<"/projects">) {
  await verifySession();
  const query = parseProjectListQuery(await searchParams);
  const allProjects = await listProjects(await createClient());
  const page = applyProjectListQuery(allProjects, query);
  const projects = page.items;
  const clearHref = listHref(PATH, projectListParams({ ...query, q: "", status: null }, 1));

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">案件</h1>
        <div className="flex items-center gap-3">
          <ViewTabs current="/projects" />
          <Link
            href="/projects/new"
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
          >
            案件を追加
          </Link>
        </div>
      </div>

      {allProjects.length > 0 && (
        <ListControls
          action={PATH}
          searchLabel="案件を検索"
          placeholder="題名・顧客名・メモ"
          q={query.q}
          selects={[
            {
              name: "status",
              label: "状態",
              value: query.status ?? "",
              options: [
                { value: "", label: "すべて" },
                ...PROJECT_STATUSES.map((s) => ({ value: s, label: PROJECT_STATUS_LABELS[s] })),
              ],
            },
            {
              name: "sort",
              label: "並び順",
              value: query.sort,
              options: PROJECT_SORTS.map((s) => ({ value: s, label: PROJECT_SORT_LABELS[s] })),
            },
          ]}
          clearHref={hasProjectFilters(query) ? clearHref : undefined}
        />
      )}

      {allProjects.length === 0 ? (
        <EmptyState
          message="まだ案件が登録されていません。"
          action={{ href: "/projects/new", label: "最初の案件を追加する" }}
        />
      ) : projects.length === 0 ? (
        <EmptyState
          message="条件に合う案件はありません。"
          action={{ href: clearHref, label: "条件をクリアする" }}
        />
      ) : (
        <ul className="flex flex-col divide-y divide-zinc-200 rounded-md border border-zinc-200">
          {projects.map((project) => (
            <li
              key={project.id}
              className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between"
            >
              <div className="flex min-w-0 flex-col gap-1">
                <p className="flex flex-wrap items-center gap-2">
                  <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-800">
                    {PROJECT_STATUS_LABELS[project.status]}
                  </span>
                  <span className="font-medium break-words">{project.title}</span>
                </p>
                <p className="text-sm text-zinc-700">
                  {project.customer.name}
                  {project.customer.deleted && "(削除済み)"}
                </p>
                <dl className="flex flex-wrap gap-x-4 text-sm text-zinc-700">
                  <div className="flex gap-1">
                    <dt>金額</dt>
                    <dd className="font-medium">{formatYen(project.amount)}</dd>
                  </div>
                  <div className="flex gap-1">
                    <dt>納期</dt>
                    <dd>{project.due_date?.replaceAll("-", "/") ?? "未定"}</dd>
                  </div>
                </dl>
              </div>
              <div className="flex shrink-0 flex-wrap items-start gap-2 sm:flex-col sm:items-end">
                <StatusSelect
                  key={`${project.id}-${project.status}`}
                  projectId={project.id}
                  title={project.title}
                  from={project.status}
                />
                <Link
                  href={`/projects/${project.id}/edit`}
                  aria-label={`「${project.title}」を編集`}
                  className="inline-flex min-h-9 items-center rounded-md border border-zinc-400 px-3 text-sm font-medium"
                >
                  編集
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}

      {projects.length > 0 && (
        <Pagination
          page={page}
          hrefFor={(n) => listHref(PATH, projectListParams(query, n))}
          label="案件のページ"
        />
      )}
    </main>
  );
}
