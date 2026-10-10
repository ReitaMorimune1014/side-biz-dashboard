import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DeleteButton } from "@/components/delete-button";
import { verifySession } from "@/lib/auth/dal";
import { formatDateWithWeekday } from "@/lib/date";
import { listProjects } from "@/lib/projects/repository";
import { createClient } from "@/lib/supabase/server";
import { splitMinutes } from "@/lib/time-entries/duration";
import { getTimeEntry } from "@/lib/time-entries/repository";
import { isTimeEntryId } from "@/lib/time-entries/schema";
import { deleteTimeEntryAction, updateTimeEntryAction } from "../../actions";
import { toProjectOptions } from "../../project-options";
import { TimeEntryForm } from "../../time-entry-form";

export const metadata: Metadata = {
  title: "稼働を編集",
};

export default async function EditTimeEntryPage({ params }: PageProps<"/time/[id]/edit">) {
  await verifySession();

  const { id } = await params;
  if (!isTimeEntryId(id)) notFound();

  const supabase = await createClient();
  const [entry, projects] = await Promise.all([getTimeEntry(supabase, id), listProjects(supabase)]);
  if (!entry) notFound();

  const { hours, minutes } = splitMinutes(entry.minutes);

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-4 py-10">
      <h1 className="text-2xl font-semibold">稼働を編集</h1>
      <TimeEntryForm
        action={updateTimeEntryAction.bind(null, entry.id)}
        projects={toProjectOptions(projects)}
        defaultValues={{
          project_id: entry.project_id,
          work_date: entry.work_date,
          hours: String(hours),
          minutes: String(minutes),
          memo: entry.memo ?? "",
        }}
        submitLabel="保存する"
        cancelHref="/time"
      />
      <div className="border-t border-zinc-200 pt-6">
        <DeleteButton
          action={deleteTimeEntryAction.bind(null, entry.id)}
          name={`${formatDateWithWeekday(entry.work_date)}の「${entry.project.title}」の稼働`}
        />
      </div>
    </main>
  );
}
