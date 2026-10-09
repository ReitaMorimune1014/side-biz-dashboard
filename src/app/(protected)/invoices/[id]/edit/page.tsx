import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DeleteButton } from "@/components/delete-button";
import { verifySession } from "@/lib/auth/dal";
import { getInvoice } from "@/lib/invoices/repository";
import { isInvoiceId } from "@/lib/invoices/schema";
import { listProjects } from "@/lib/projects/repository";
import { createClient } from "@/lib/supabase/server";
import { deleteInvoiceAction, updateInvoiceAction } from "../../actions";
import { InvoiceForm } from "../../invoice-form";
import { toInvoiceProjectOptions } from "../../project-options";

export const metadata: Metadata = {
  title: "請求を編集",
};

export default async function EditInvoicePage({ params }: PageProps<"/invoices/[id]/edit">) {
  await verifySession();

  const { id } = await params;
  if (!isInvoiceId(id)) notFound();

  const supabase = await createClient();
  const [invoice, projects] = await Promise.all([getInvoice(supabase, id), listProjects(supabase)]);
  if (!invoice) notFound();

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-4 py-10">
      <h1 className="text-2xl font-semibold">請求を編集</h1>
      <InvoiceForm
        action={updateInvoiceAction.bind(null, invoice.id)}
        projects={toInvoiceProjectOptions(projects)}
        defaultValues={{
          project_id: invoice.project_id,
          amount: String(invoice.amount),
          issued_on: invoice.issued_on,
          due_on: invoice.due_on,
          paid_on: invoice.paid_on ?? "",
        }}
        submitLabel="保存する"
        showPaidOn
      />
      <div className="border-t border-zinc-200 pt-6">
        <DeleteButton
          action={deleteInvoiceAction.bind(null, invoice.id)}
          name={`「${invoice.project.title}」の${invoice.issued_on.replaceAll("-", "/")}発行の請求`}
        />
      </div>
    </main>
  );
}
