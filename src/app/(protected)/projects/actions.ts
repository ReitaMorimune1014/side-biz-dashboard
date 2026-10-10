"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/dal";
import { getActiveCustomer } from "@/lib/customers/repository";
import {
  createProject,
  getProject,
  updateProject,
} from "@/lib/projects/repository";
import {
  isProjectId,
  parseProjectInput,
  parseStatusChange,
  type ProjectFieldErrors,
} from "@/lib/projects/schema";
import { PROJECT_STATUS_LABELS } from "@/lib/projects/status";
import { createClient } from "@/lib/supabase/server";

const PROJECTS_PATH = "/projects";

const FIELDS = ["customer_id", "title", "amount", "due_date", "memo", "status"] as const;

export type ProjectFormValues = Partial<Record<(typeof FIELDS)[number], string>>;

export type ProjectFormState =
  | { status: "idle" }
  | {
      status: "error";
      fieldErrors: ProjectFieldErrors;
      message?: string;
      values: ProjectFormValues;
    };

function readForm(formData: FormData): ProjectFormValues & { expected_status?: string } {
  const values: Record<string, string> = {};
  for (const field of [...FIELDS, "expected_status"]) {
    const value = formData.get(field);
    if (typeof value === "string") values[field] = value;
  }
  return values;
}

const SAVE_FAILED = "保存できませんでした。時間をおいて、もう一度お試しください";
const NOT_FOUND = "案件が見つかりません";
const CONFLICT =
  "ほかの画面で、この案件の状態が変わりました。画面を開き直してから、もう一度変更してください";
const CUSTOMER_REQUIRED = "顧客を選んでください";

function error(
  values: ProjectFormValues,
  fieldErrors: ProjectFieldErrors,
  message?: string,
): ProjectFormState {
  return { status: "error", fieldErrors, message, values };
}

export async function createProjectAction(
  _prevState: ProjectFormState,
  formData: FormData,
): Promise<ProjectFormState> {
  await requireUser();

  const values = readForm(formData);
  const parsed = parseProjectInput(values);
  if (!parsed.success) return error(values, parsed.fieldErrors);

  const supabase = await createClient();
  try {
    if (!(await getActiveCustomer(supabase, parsed.data.customer_id))) {
      return error(values, { customer_id: CUSTOMER_REQUIRED });
    }
    await createProject(supabase, parsed.data);
  } catch (e) {
    console.error("createProject failed:", e);
    return error(values, {}, SAVE_FAILED);
  }

  revalidatePath(PROJECTS_PATH);
  redirect(PROJECTS_PATH);
}

export async function updateProjectAction(
  id: string,
  _prevState: ProjectFormState,
  formData: FormData,
): Promise<ProjectFormState> {
  await requireUser();

  const values = readForm(formData);
  if (!isProjectId(id)) return error(values, {}, NOT_FOUND);

  const input = parseProjectInput(values);
  const change = parseStatusChange(values);
  if (!input.success || !change.success) {
    return error(values, {
      ...(input.success ? {} : input.fieldErrors),
      ...(change.success ? {} : change.fieldErrors),
    });
  }

  const supabase = await createClient();
  let result;
  try {
    const current = await getProject(supabase, id);
    if (!current) return error(values, {}, NOT_FOUND);

    // 論理削除した顧客の案件は、顧客を変えない限りそのまま編集できる
    const customerChanged = input.data.customer_id !== current.customer_id;
    if (customerChanged && !(await getActiveCustomer(supabase, input.data.customer_id))) {
      return error(values, { customer_id: CUSTOMER_REQUIRED });
    }

    result = await updateProject(supabase, id, input.data, change.data);
  } catch (e) {
    console.error("updateProject failed:", e);
    return error(values, {}, SAVE_FAILED);
  }

  if (!result.ok) {
    switch (result.reason) {
      case "invalid_transition": {
        const { from, to } = change.data;
        return error(values, {
          status: `「${PROJECT_STATUS_LABELS[from]}」から「${PROJECT_STATUS_LABELS[to]}」には変更できません`,
        });
      }
      case "conflict":
        return error(values, {}, CONFLICT);
      case "not_found":
        return error(values, {}, NOT_FOUND);
    }
  }

  revalidatePath(PROJECTS_PATH);
  redirect(PROJECTS_PATH);
}
