"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/dal";
import { getProject } from "@/lib/projects/repository";
import { createClient } from "@/lib/supabase/server";
import {
  createTimeEntry,
  deleteTimeEntry,
  updateTimeEntry,
} from "@/lib/time-entries/repository";
import {
  isTimeEntryId,
  parseTimeEntryInput,
  type TimeEntryFieldErrors,
} from "@/lib/time-entries/schema";

const TIME_PATH = "/time";

const FIELDS = ["project_id", "work_date", "hours", "minutes", "memo"] as const;

export type TimeEntryFormValues = Partial<Record<(typeof FIELDS)[number], string>>;

export type TimeEntryFormState =
  | { status: "idle" }
  | { status: "saved" }
  | {
      status: "error";
      fieldErrors: TimeEntryFieldErrors;
      message?: string;
      values: TimeEntryFormValues;
    };

function readForm(formData: FormData): TimeEntryFormValues {
  const values: TimeEntryFormValues = {};
  for (const field of FIELDS) {
    const value = formData.get(field);
    if (typeof value === "string") values[field] = value;
  }
  return values;
}

const SAVE_FAILED = "保存できませんでした。時間をおいて、もう一度お試しください";
const NOT_FOUND = "稼働の記録が見つかりません。削除された可能性があります";
const PROJECT_NOT_FOUND = "案件を選んでください";

function error(
  values: TimeEntryFormValues,
  fieldErrors: TimeEntryFieldErrors,
  message?: string,
): TimeEntryFormState {
  return { status: "error", fieldErrors, message, values };
}

/** 記録した後も同じ画面で続けて入力できるように、転送せずに saved を返す */
export async function createTimeEntryAction(
  _prevState: TimeEntryFormState,
  formData: FormData,
): Promise<TimeEntryFormState> {
  await requireUser();

  const values = readForm(formData);
  const parsed = parseTimeEntryInput(values);
  if (!parsed.success) return error(values, parsed.fieldErrors);

  const supabase = await createClient();
  try {
    if (!(await getProject(supabase, parsed.data.project_id))) {
      return error(values, { project_id: PROJECT_NOT_FOUND });
    }
    await createTimeEntry(supabase, parsed.data);
  } catch (e) {
    console.error("createTimeEntry failed:", e);
    return error(values, {}, SAVE_FAILED);
  }

  revalidatePath(TIME_PATH);
  return { status: "saved" };
}

export async function updateTimeEntryAction(
  id: string,
  _prevState: TimeEntryFormState,
  formData: FormData,
): Promise<TimeEntryFormState> {
  await requireUser();

  const values = readForm(formData);
  if (!isTimeEntryId(id)) return error(values, {}, NOT_FOUND);

  const parsed = parseTimeEntryInput(values);
  if (!parsed.success) return error(values, parsed.fieldErrors);

  const supabase = await createClient();
  let updated;
  try {
    if (!(await getProject(supabase, parsed.data.project_id))) {
      return error(values, { project_id: PROJECT_NOT_FOUND });
    }
    updated = await updateTimeEntry(supabase, id, parsed.data);
  } catch (e) {
    console.error("updateTimeEntry failed:", e);
    return error(values, {}, SAVE_FAILED);
  }
  if (!updated) return error(values, {}, NOT_FOUND);

  revalidatePath(TIME_PATH);
  redirect(TIME_PATH);
}

export async function deleteTimeEntryAction(id: string): Promise<void> {
  await requireUser();

  if (isTimeEntryId(id)) {
    const deleted = await deleteTimeEntry(await createClient(), id);
    if (!deleted) console.warn("deleteTimeEntry: not found", id);
  }

  revalidatePath(TIME_PATH);
  redirect(TIME_PATH);
}
