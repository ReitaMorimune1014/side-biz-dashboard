import type { Metadata } from "next";
import Link from "next/link";
import { verifySession } from "@/lib/auth/dal";
import { todayInTokyo } from "@/lib/date";
import { listProjects } from "@/lib/projects/repository";
import { createClient } from "@/lib/supabase/server";
import { createInvoiceAction } from "../actions";
import { InvoiceForm } from "../invoice-form";
import { toInvoiceProjectOptions } from "../project-options";

export const metadata: Metadata = {
  title: "請求を作成",
};

export default async function NewInvoicePage() {
  await verifySession();
  const projects = await listProjects(await createClient());

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-4 py-10">
      <h1 className="text-2xl font-semibold">請求を作成</h1>
      {projects.length === 0 ? (
        <div className="rounded-md border border-dashed border-zinc-400 p-8 text-center">
          <p className="text-zinc-700">請求を作成する前に、案件を登録してください。</p>
          <Link href="/projects/new" className="mt-2 inline-block text-sm underline">
            案件を追加する
          </Link>
        </div>
      ) : (
        <InvoiceForm
          action={createInvoiceAction}
          projects={toInvoiceProjectOptions(projects)}
          defaultValues={{ issued_on: todayInTokyo() }}
          submitLabel="作成する"
          prefillAmount
        />
      )}
    </main>
  );
}
