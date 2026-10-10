import type { Metadata } from "next";
import Link from "next/link";
import { DeleteButton } from "@/components/delete-button";
import { ListControls } from "@/components/list-controls";
import { Pagination } from "@/components/pagination";
import { EmptyState } from "@/components/states";
import { verifySession } from "@/lib/auth/dal";
import {
  CUSTOMER_SORTS,
  CUSTOMER_SORT_LABELS,
  applyCustomerListQuery,
  customerListParams,
  hasCustomerFilters,
  parseCustomerListQuery,
} from "@/lib/customers/list";
import { listActiveCustomers } from "@/lib/customers/repository";
import { listHref } from "@/lib/list/query";
import { createClient } from "@/lib/supabase/server";
import { deleteCustomerAction } from "./actions";

export const metadata: Metadata = {
  title: "顧客",
};

const PATH = "/customers";

export default async function CustomersPage({ searchParams }: PageProps<"/customers">) {
  await verifySession();
  const query = parseCustomerListQuery(await searchParams);
  const allCustomers = await listActiveCustomers(await createClient());
  const page = applyCustomerListQuery(allCustomers, query);
  const customers = page.items;
  const clearHref = listHref(PATH, customerListParams({ ...query, q: "" }, 1));

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

      {allCustomers.length > 0 && (
        <ListControls
          action={PATH}
          searchLabel="顧客を検索"
          placeholder="名前・メモ"
          q={query.q}
          selects={[
            {
              name: "sort",
              label: "並び順",
              value: query.sort,
              options: CUSTOMER_SORTS.map((s) => ({ value: s, label: CUSTOMER_SORT_LABELS[s] })),
            },
          ]}
          clearHref={hasCustomerFilters(query) ? clearHref : undefined}
        />
      )}

      {allCustomers.length === 0 ? (
        <EmptyState
          message="まだ顧客が登録されていません。"
          action={{ href: "/customers/new", label: "最初の顧客を追加する" }}
        />
      ) : customers.length === 0 ? (
        <EmptyState
          message="条件に合う顧客はありません。"
          action={{ href: clearHref, label: "条件をクリアする" }}
        />
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

      {customers.length > 0 && (
        <Pagination
          page={page}
          hrefFor={(n) => listHref(PATH, customerListParams(query, n))}
          label="顧客のページ"
        />
      )}
    </main>
  );
}
