import type { Metadata } from "next";
import Link from "next/link";
import { verifySession } from "@/lib/auth/dal";
import { listActiveCustomers } from "@/lib/customers/repository";
import { createClient } from "@/lib/supabase/server";
import { deleteCustomerAction } from "./actions";
import { DeleteButton } from "@/components/delete-button";

export const metadata: Metadata = {
  title: "顧客",
};

export default async function CustomersPage() {
  await verifySession();
  const customers = await listActiveCustomers(await createClient());

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-10">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">顧客</h1>
        <Link
          href="/customers/new"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
        >
          顧客を追加
        </Link>
      </div>

      {customers.length === 0 ? (
        <div className="rounded-md border border-dashed border-zinc-400 p-8 text-center">
          <p className="text-zinc-700">まだ顧客が登録されていません。</p>
          <Link href="/customers/new" className="mt-2 inline-block text-sm underline">
            最初の顧客を追加する
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col divide-y divide-zinc-200 rounded-md border border-zinc-200">
          {customers.map((customer) => (
            <li
              key={customer.id}
              className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between"
            >
              <div className="min-w-0">
                <p className="font-medium break-words">{customer.name}</p>
                {customer.memo && (
                  <p className="mt-1 line-clamp-2 text-sm whitespace-pre-line text-zinc-600">
                    {customer.memo}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 gap-2">
                <Link
                  href={`/customers/${customer.id}/edit`}
                  aria-label={`「${customer.name}」を編集`}
                  className="rounded-md border border-zinc-400 px-3 py-1.5 text-sm font-medium"
                >
                  編集
                </Link>
                <DeleteButton
                  action={deleteCustomerAction.bind(null, customer.id)}
                  name={customer.name}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
