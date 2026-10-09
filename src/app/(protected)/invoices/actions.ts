"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/dal";
import {
  createInvoice,
  deleteInvoice,
  getInvoice,
  setInvoicePaidOn,
  updateInvoice,
} from "@/lib/invoices/repository";
import {
  isInvoiceId,
  parseInvoiceInput,
  parsePaidOn,
  type InvoiceFieldErrors,
} from "@/lib/invoices/schema";
import { getProject } from "@/lib/projects/repository";
import { createClient } from "@/lib/supabase/server";

const INVOICES_PATH = "/invoices";

const FIELDS = ["project_id", "amount", "issued_on", "due_on", "paid_on"] as const;

export type InvoiceFormValues = Partial<Record<(typeof FIELDS)[number], string>>;

export type InvoiceFormState =
  | { status: "idle" }
  | {
      status: "error";
      fieldErrors: InvoiceFieldErrors;
      message?: string;
      values: InvoiceFormValues;
    };

function readForm(formData: FormData): InvoiceFormValues {
  const values: InvoiceFormValues = {};
  for (const field of FIELDS) {
    const value = formData.get(field);
    if (typeof value === "string") values[field] = value;
  }
  return values;
}

const SAVE_FAILED = "保存できませんでした。時間をおいて、もう一度お試しください";
const NOT_FOUND = "請求が見つかりません。削除された可能性があります";
const PROJECT_NOT_FOUND = "案件を選んでください";

function error(
  values: InvoiceFormValues,
  fieldErrors: InvoiceFieldErrors,
  message?: string,
): InvoiceFormState {
  return { status: "error", fieldErrors, message, values };
}

export async function createInvoiceAction(
  _prevState: InvoiceFormState,
  formData: FormData,
): Promise<InvoiceFormState> {
  await requireUser();

  const values = readForm(formData);
  const parsed = parseInvoiceInput(values);
  if (!parsed.success) return error(values, parsed.fieldErrors);

  const supabase = await createClient();
  try {
    if (!(await getProject(supabase, parsed.data.project_id))) {
      return error(values, { project_id: PROJECT_NOT_FOUND });
    }
    await createInvoice(supabase, parsed.data);
  } catch (e) {
    console.error("createInvoice failed:", e);
    return error(values, {}, SAVE_FAILED);
  }

  revalidatePath(INVOICES_PATH);
  redirect(INVOICES_PATH);
}

export async function updateInvoiceAction(
  id: string,
  _prevState: InvoiceFormState,
  formData: FormData,
): Promise<InvoiceFormState> {
  await requireUser();

  const values = readForm(formData);
  if (!isInvoiceId(id)) return error(values, {}, NOT_FOUND);

  const parsed = parseInvoiceInput(values);
  if (!parsed.success) return error(values, parsed.fieldErrors);

  const supabase = await createClient();
  let updated;
  try {
    if (!(await getProject(supabase, parsed.data.project_id))) {
      return error(values, { project_id: PROJECT_NOT_FOUND });
    }
    updated = await updateInvoice(supabase, id, parsed.data);
  } catch (e) {
    console.error("updateInvoice failed:", e);
    return error(values, {}, SAVE_FAILED);
  }
  if (!updated) return error(values, {}, NOT_FOUND);

  revalidatePath(INVOICES_PATH);
  redirect(INVOICES_PATH);
}

export async function deleteInvoiceAction(id: string): Promise<void> {
  await requireUser();

  if (isInvoiceId(id)) {
    const deleted = await deleteInvoice(await createClient(), id);
    if (!deleted) console.warn("deleteInvoice: not found", id);
  }

  revalidatePath(INVOICES_PATH);
  redirect(INVOICES_PATH);
}

export type PaymentState = { status: "idle" } | { status: "error"; message: string };

/** 一覧の「入金を記録」。発行日より前の入金日は受け付けない */
export async function recordPaymentAction(
  id: string,
  _prevState: PaymentState,
  formData: FormData,
): Promise<PaymentState> {
  await requireUser();
  if (!isInvoiceId(id)) return { status: "error", message: NOT_FOUND };

  const supabase = await createClient();
  try {
    const invoice = await getInvoice(supabase, id);
    if (!invoice) return { status: "error", message: NOT_FOUND };

    const paidOn = parsePaidOn(formData.get("paid_on"), invoice.issued_on);
    if (!paidOn.success) return { status: "error", message: paidOn.message };

    if (!(await setInvoicePaidOn(supabase, id, paidOn.data))) {
      return { status: "error", message: NOT_FOUND };
    }
  } catch (e) {
    console.error("recordPayment failed:", e);
    return { status: "error", message: SAVE_FAILED };
  }

  revalidatePath(INVOICES_PATH);
  return { status: "idle" };
}

/** 一覧の「未入金に戻す」 */
export async function markUnpaidAction(id: string): Promise<void> {
  await requireUser();

  if (isInvoiceId(id)) {
    const updated = await setInvoicePaidOn(await createClient(), id, null);
    if (!updated) console.warn("markUnpaid: not found", id);
  }

  revalidatePath(INVOICES_PATH);
}
