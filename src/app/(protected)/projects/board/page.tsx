import type { Metadata } from "next";
import Link from "next/link";
import { verifySession } from "@/lib/auth/dal";
import { formatYen } from "@/lib/money";
import { groupProjectsByStatus } from "@/lib/projects/board";
import { listProjects } from "@/lib/projects/repository";
import {
  PROJECT_STATUS_LABELS,
  backStatuses,
  forwardStatuses,
} from "@/lib/projects/status";
import { createClient } from "@/lib/supabase/server";
import { ViewTabs } from "../view-tabs";
import { MoveButtons } from "./move-buttons";

export const metadata: Metadata = {
  title: "案件のかんばん",
};

export default async function ProjectBoardPage() {
  await verifySession();
  const columns = groupProjectsByStatus(await listProjects(await createClient()));

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">案件</h1>
        <div className="flex items-center gap-3">
          <ViewTabs current="/projects/board" />
          <Link
            href="/projects/new"
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
          >
            案件を追加
          </Link>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {columns.map((column) => {
          const headingId = `column-${column.status}`;
          return (
            <section
              key={column.status}
              aria-labelledby={headingId}
              className="flex flex-col gap-3 rounded-md bg-zinc-50 p-3"
            >
              <h2 id={headingId} className="flex items-center gap-2 text-sm font-semibold">
                {PROJECT_STATUS_LABELS[column.status]}
                <span className="rounded-full bg-zinc-200 px-2 text-xs font-medium text-zinc-800">
                  {column.items.length}
                  <span className="sr-only">件</span>
                </span>
              </h2>

              {column.items.length === 0 ? (
                <p className="text-xs text-zinc-500">案件はありません</p>
              ) : (
                <ul className="grid gap-2 sm:grid-cols-2">
                  {column.items.map((project) => (
                    <li
                      key={project.id}
                      className="flex flex-col gap-2 rounded-md border border-zinc-200 bg-white p-3"
                    >
                      <Link
                        href={`/projects/${project.id}/edit`}
                        className="font-medium break-words underline-offset-2 hover:underline"
                      >
                        {project.title}
                      </Link>
                      <p className="text-xs text-zinc-700">
                        {project.customer.name}
                        {project.customer.deleted && "(削除済み)"}
                      </p>
                      <p className="flex flex-wrap gap-x-3 text-xs text-zinc-700">
                        <span className="font-medium">{formatYen(project.amount)}</span>
                        <span>納期 {project.due_date?.replaceAll("-", "/") ?? "未定"}</span>
                      </p>
                      <MoveButtons
                        projectId={project.id}
                        title={project.title}
                        from={project.status}
                        forward={forwardStatuses(project.status)}
                        back={backStatuses(project.status)}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </main>
  );
}
