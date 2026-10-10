import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EmptyState } from "@/components/states";
import { verifySession } from "@/lib/auth/dal";
import { getCustomerNames } from "@/lib/customers/repository";
import { formatDateTimeInTokyo } from "@/lib/date";
import { describeHistory, historyCustomerIds } from "@/lib/projects/history";
import { getProject, listProjectHistory } from "@/lib/projects/repository";
import { isProjectId } from "@/lib/projects/schema";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "案件の変更履歴",
};

export default async function ProjectHistoryPage({
  params,
}: PageProps<"/projects/[id]/history">) {
  const { readOnly } = await verifySession();

  const { id } = await params;
  if (!isProjectId(id)) notFound();

  const supabase = await createClient();
  const [project, history] = await Promise.all([
    getProject(supabase, id),
    listProjectHistory(supabase, id),
  ]);
  if (!project) notFound();
  const customers = await getCustomerNames(supabase, historyCustomerIds(history));

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-10">
      <div className="flex flex-col gap-2">
        <Link href="/projects" className="text-sm underline">
          案件の一覧へ戻る
        </Link>
        <h1 className="text-2xl font-semibold break-words">「{project.title}」の変更履歴</h1>
        {!readOnly && (
          <Link href={`/projects/${project.id}/edit`} className="self-start text-sm underline">
            この案件を編集する
          </Link>
        )}
      </div>

      {history.length === 0 ? (
        <EmptyState message="まだ変更の記録はありません。履歴は、この機能を入れた後の作成・変更から残ります。" />
      ) : (
        <ol className="flex flex-col divide-y divide-zinc-200 rounded-md border border-zinc-200">
          {history.map((entry) => {
            const { operation, lines } = describeHistory(entry, customers);
            return (
              <li key={entry.id} className="flex flex-col gap-3 p-4">
                <p className="flex flex-wrap items-center gap-2">
                  <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-800">
                    {operation}
                  </span>
                  <time dateTime={entry.changedAt} className="text-sm text-zinc-700">
                    {formatDateTimeInTokyo(entry.changedAt)}
                  </time>
                </p>
                <dl className="flex flex-col gap-2 text-sm">
                  {lines.map((line) => (
                    <div key={line.field} className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
                      <dt className="shrink-0 font-medium sm:w-16">{line.label}</dt>
                      <dd className="min-w-0 break-words whitespace-pre-wrap">
                        {line.before === null ? (
                          line.after
                        ) : line.field === "memo" ? (
                          <div className="flex flex-col gap-1">
                            <p className="rounded bg-zinc-50 p-2 text-zinc-600">
                              <span className="block text-xs">変更前</span>
                              {line.before}
                            </p>
                            <p className="rounded bg-zinc-50 p-2">
                              <span className="block text-xs text-zinc-600">変更後</span>
                              {line.after}
                            </p>
                          </div>
                        ) : (
                          <>
                            <span className="text-zinc-600">{line.before}</span>
                            <span aria-hidden="true" className="px-1.5 text-zinc-500">
                              →
                            </span>
                            <span className="sr-only">から</span>
                            <span className="font-medium">{line.after}</span>
                            <span className="sr-only">に変更</span>
                          </>
                        )}
                      </dd>
                    </div>
                  ))}
                </dl>
              </li>
            );
          })}
        </ol>
      )}
    </main>
  );
}
