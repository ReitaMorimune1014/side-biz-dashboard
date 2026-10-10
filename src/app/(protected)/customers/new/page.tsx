import type { Metadata } from "next";
import { verifyWritableSession } from "@/lib/auth/dal";
import { createCustomerAction } from "../actions";
import { CustomerForm } from "../customer-form";

export const metadata: Metadata = {
  title: "顧客を追加",
};

export default async function NewCustomerPage() {
  await verifyWritableSession();

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-4 py-10">
      <h1 className="text-2xl font-semibold">顧客を追加</h1>
      <CustomerForm action={createCustomerAction} submitLabel="追加する" />
    </main>
  );
}
