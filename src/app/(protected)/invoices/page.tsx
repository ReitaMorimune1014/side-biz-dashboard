import type { Metadata } from "next";
import Link from "next/link";
import { DeleteButton } from "@/components/delete-button";
import { verifySession } from "@/lib/auth/dal";
import { todayInTokyo } from "@/lib/date";
import { listInvoices } from "@/lib/invoices/repository";
import {
  INVOICE_STATUS_LABELS,
  invoiceStatus,
  type InvoiceStatus,
} from "@/lib/invoices/status";
import { formatYen } from "@/lib/money";
import { createClient } from "@/lib/supabase/server";
import { deleteInvoiceAction, markUnpaidAction, recordPaymentAction } from "./actions";
import { MarkUnpaidForm, RecordPaymentForm } from "./payment-controls";

export const metadata: Metadata = {
  title: "請求",
};

const BADGE_CLASS: Record<InvoiceStatus, string> = {
  unpaid: "bg-zinc-100 text-zinc-800",
  paid: "bg-green-100 text-green-800",
  overdue: "bg-red-100 text-red-800",
};

const formatDate = (date: string) => date.replaceAll("-", "/");

export default async function InvoicesPage() {
  await verifySession();

  const invoices = await listInvoices(await createClient());
  const today = todayInTokyo();

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-10">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">請求</h1>
        <Link
          href="/invoices/new"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
        >
          請求を作成
        </Link>
      </div>

      {invoices.length === 0 ? (
        <div className="rounded-md border border-dashed border-zinc-400 p-8 text-center">
          <p className="text-zinc-700">まだ請求がありません。</p>
          <Link href="/invoices/new" className="mt-2 inline-block text-sm underline">
            最初の請求を作成する
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col divide-y divide-zinc-200 rounded-md border border-zinc-200">
          {invoices.map((invoice) => {
            const status = invoiceStatus(invoice, today);
            const name = `「${invoice.project.title}」の${formatDate(invoice.issued_on)}発行の請求`;
            return (
              <li key={invoice.id} className="flex flex-col gap-3 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 flex-col gap-1">
                    <p className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded px-2 py-0.5 text-xs font-medium ${BADGE_CLASS[status]}`}
                      >
                        {INVOICE_STATUS_LABELS[status]}
                      </span>
                      <span className="font-medium break-words">{invoice.project.title}</span>
                    </p>
                    <p className="text-sm text-zinc-700">{invoice.project.customer_name}</p>
                    <dl className="flex flex-wrap gap-x-4 text-sm text-zinc-700">
                      <div className="flex gap-1">
                        <dt>金額</dt>
                        <dd className="font-medium">{formatYen(invoice.amount)}</dd>
                      </div>
                      <div className="flex gap-1">
                        <dt>発行日</dt>
                        <dd>{formatDate(invoice.issued_on)}</dd>
                      </div>
                      <div className="flex gap-1">
                        <dt>支払期限</dt>
                        <dd className={status === "overdue" ? "font-medium text-red-700" : undefined}>
                          {formatDate(invoice.due_on)}
                        </dd>
                      </div>
                      {invoice.paid_on && (
                        <div className="flex gap-1">
                          <dt>入金日</dt>
                          <dd>{formatDate(invoice.paid_on)}</dd>
                        </div>
                      )}
                    </dl>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Link
                      href={`/invoices/${invoice.id}/edit`}
                      aria-label={`${name}を編集`}
                      className="rounded-md border border-zinc-400 px-3 py-1.5 text-sm font-medium"
                    >
                      編集
                    </Link>
                    <DeleteButton action={deleteInvoiceAction.bind(null, invoice.id)} name={name} />
                  </div>
                </div>
                {status === "paid" ? (
                  <MarkUnpaidForm action={markUnpaidAction.bind(null, invoice.id)} name={name} />
                ) : (
                  <RecordPaymentForm
                    action={recordPaymentAction.bind(null, invoice.id)}
                    name={name}
                    defaultPaidOn={today}
                    inputId={`paid-on-${invoice.id}`}
                  />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
