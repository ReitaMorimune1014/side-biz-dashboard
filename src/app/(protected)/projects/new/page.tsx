import type { Metadata } from "next";
import Link from "next/link";
import { verifySession } from "@/lib/auth/dal";
import { listActiveCustomers } from "@/lib/customers/repository";
import { createClient } from "@/lib/supabase/server";
import { createProjectAction } from "../actions";
import { ProjectForm } from "../project-form";

export const metadata: Metadata = {
  title: "案件を追加",
};

export default async function NewProjectPage() {
  await verifySession();
  const customers = await listActiveCustomers(await createClient());

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-4 py-10">
      <h1 className="text-2xl font-semibold">案件を追加</h1>
      {customers.length === 0 ? (
        <div className="rounded-md border border-dashed border-zinc-400 p-8 text-center">
          <p className="text-zinc-700">案件を追加する前に、顧客を登録してください。</p>
          <Link href="/customers/new" className="mt-2 inline-block text-sm underline">
            顧客を追加する
          </Link>
        </div>
      ) : (
        <>
          <p className="text-sm text-zinc-700">新しい案件は「見積」の状態で登録されます。</p>
          <ProjectForm
            action={createProjectAction}
            customers={customers.map(({ id, name }) => ({ id, name }))}
            submitLabel="追加する"
          />
        </>
      )}
    </main>
  );
}
