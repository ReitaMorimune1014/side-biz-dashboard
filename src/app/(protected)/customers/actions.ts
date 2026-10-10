"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/dal";
import {
  createCustomer,
  softDeleteCustomer,
  updateCustomer,
} from "@/lib/customers/repository";
import {
  isCustomerId,
  parseCustomerInput,
  type CustomerFieldErrors,
} from "@/lib/customers/schema";
import { createClient } from "@/lib/supabase/server";

const CUSTOMERS_PATH = "/customers";

export type CustomerFormValues = { name: string; memo: string };

export type CustomerFormState =
  | { status: "idle" }
  | {
      status: "error";
      fieldErrors: CustomerFieldErrors;
      message?: string;
      values: CustomerFormValues;
    };

function readForm(formData: FormData): CustomerFormValues {
  const name = formData.get("name");
  const memo = formData.get("memo");
  return {
    name: typeof name === "string" ? name : "",
    memo: typeof memo === "string" ? memo : "",
  };
}

const SAVE_FAILED = "保存できませんでした。時間をおいて、もう一度お試しください";
const NOT_FOUND = "顧客が見つかりません。削除された可能性があります";

export async function createCustomerAction(
  _prevState: CustomerFormState,
  formData: FormData,
): Promise<CustomerFormState> {
  await requireUser();

  const values = readForm(formData);
  const parsed = parseCustomerInput(values);
  if (!parsed.success) {
    return { status: "error", fieldErrors: parsed.fieldErrors, values };
  }

  try {
    await createCustomer(await createClient(), parsed.data);
  } catch (error) {
    console.error("createCustomer failed:", error);
    return { status: "error", fieldErrors: {}, message: SAVE_FAILED, values };
  }

  revalidatePath(CUSTOMERS_PATH);
  redirect(CUSTOMERS_PATH);
}

export async function updateCustomerAction(
  id: string,
  _prevState: CustomerFormState,
  formData: FormData,
): Promise<CustomerFormState> {
  await requireUser();

  const values = readForm(formData);
  if (!isCustomerId(id)) {
    return { status: "error", fieldErrors: {}, message: NOT_FOUND, values };
  }
  const parsed = parseCustomerInput(values);
  if (!parsed.success) {
    return { status: "error", fieldErrors: parsed.fieldErrors, values };
  }

  let updated;
  try {
    updated = await updateCustomer(await createClient(), id, parsed.data);
  } catch (error) {
    console.error("updateCustomer failed:", error);
    return { status: "error", fieldErrors: {}, message: SAVE_FAILED, values };
  }
  if (!updated) {
    return { status: "error", fieldErrors: {}, message: NOT_FOUND, values };
  }

  revalidatePath(CUSTOMERS_PATH);
  redirect(CUSTOMERS_PATH);
}

export async function deleteCustomerAction(id: string): Promise<void> {
  await requireUser();

  if (isCustomerId(id)) {
    const deleted = await softDeleteCustomer(await createClient(), id);
    if (!deleted) console.warn("softDeleteCustomer: not found", id);
  }

  revalidatePath(CUSTOMERS_PATH);
  redirect(CUSTOMERS_PATH);
}
