import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { verifySession } from "@/lib/auth/dal";
import { listActiveCustomers } from "@/lib/customers/repository";
import { getProject } from "@/lib/projects/repository";
import { isProjectId } from "@/lib/projects/schema";
import { nextStatuses } from "@/lib/projects/status";
import { createClient } from "@/lib/supabase/server";
import { updateProjectAction } from "../../actions";
import { ProjectForm } from "../../project-form";

export const metadata: Metadata = {
  title: "案件を編集",
};

export default async function EditProjectPage({ params }: PageProps<"/projects/[id]/edit">) {
  await verifySession();

  const { id } = await params;
  if (!isProjectId(id)) notFound();

  const supabase = await createClient();
  const [project, activeCustomers] = await Promise.all([
    getProject(supabase, id),
    listActiveCustomers(supabase),
  ]);
  if (!project) notFound();

  const customers: { id: string; name: string; deleted?: boolean }[] = activeCustomers.map(
    ({ id, name }) => ({ id, name }),
  );
  if (!customers.some((customer) => customer.id === project.customer_id)) {
    customers.unshift({ id: project.customer_id, name: project.customer.name, deleted: true });
  }

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-4 py-10">
      <h1 className="text-2xl font-semibold">案件を編集</h1>
      <ProjectForm
        action={updateProjectAction.bind(null, project.id)}
        customers={customers}
        defaultValues={{
          customer_id: project.customer_id,
          title: project.title,
          amount: String(project.amount),
          due_date: project.due_date ?? "",
          memo: project.memo ?? "",
          status: project.status,
        }}
        status={{
          current: project.status,
          options: [project.status, ...nextStatuses(project.status)],
        }}
        submitLabel="保存する"
      />
    </main>
  );
}
