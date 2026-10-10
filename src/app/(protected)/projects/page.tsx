import type { Metadata } from "next";
import Link from "next/link";
import { verifySession } from "@/lib/auth/dal";
import { formatYen } from "@/lib/money";
import { listProjects } from "@/lib/projects/repository";
import { PROJECT_STATUS_LABELS } from "@/lib/projects/status";
import { createClient } from "@/lib/supabase/server";
import { StatusSelect } from "./status-select";
import { ViewTabs } from "./view-tabs";

export const metadata: Metadata = {
  title: "案件",
};

export default async function ProjectsPage() {
  await verifySession();
  const projects = await listProjects(await createClient());

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

      {projects.length === 0 ? (
        <div className="rounded-md border border-dashed border-zinc-400 p-8 text-center">
          <p className="text-zinc-700">まだ案件が登録されていません。</p>
          <Link href="/projects/new" className="mt-2 inline-block text-sm underline">
            最初の案件を追加する
          </Link>
        </div>
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
              <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
                <StatusSelect
                  key={`${project.id}-${project.status}`}
                  projectId={project.id}
                  title={project.title}
                  from={project.status}
                />
                <Link
                  href={`/projects/${project.id}/edit`}
                  aria-label={`「${project.title}」を編集`}
                  className="rounded-md border border-zinc-400 px-3 py-1.5 text-sm font-medium"
                >
                  編集
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
