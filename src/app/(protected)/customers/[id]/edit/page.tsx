import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DeleteButton } from "@/components/delete-button";
import { verifySession } from "@/lib/auth/dal";
import { getActiveCustomer } from "@/lib/customers/repository";
import { isCustomerId } from "@/lib/customers/schema";
import { createClient } from "@/lib/supabase/server";
import { deleteCustomerAction, updateCustomerAction } from "../../actions";
import { CustomerForm } from "../../customer-form";

export const metadata: Metadata = {
  title: "顧客を編集",
};

export default async function EditCustomerPage({
  params,
}: PageProps<"/customers/[id]/edit">) {
  await verifySession();

  const { id } = await params;
  if (!isCustomerId(id)) notFound();
  const customer = await getActiveCustomer(await createClient(), id);
  if (!customer) notFound();

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-4 py-10">
      <h1 className="text-2xl font-semibold">顧客を編集</h1>
      <CustomerForm
        action={updateCustomerAction.bind(null, customer.id)}
        defaultValues={{ name: customer.name, memo: customer.memo ?? "" }}
        submitLabel="保存する"
      />
      <div className="border-t border-zinc-200 pt-6">
        <DeleteButton
          action={deleteCustomerAction.bind(null, customer.id)}
          name={customer.name}
        />
      </div>
    </main>
  );
}
