"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/dal";
import { saveSettings } from "@/lib/settings/repository";
import {
  parseSettingsInput,
  readSettingsForm,
  type SettingsFieldErrors,
  type SettingsFormValues,
} from "@/lib/settings/schema";
import { createClient } from "@/lib/supabase/server";

export type SettingsFormState =
  | { status: "idle" }
  | { status: "saved" }
  | {
      status: "error";
      fieldErrors: SettingsFieldErrors;
      message?: string;
      values: SettingsFormValues;
    };

const SAVE_FAILED = "保存できませんでした。時間をおいて、もう一度お試しください";

export async function saveSettingsAction(
  _prevState: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  await requireUser();

  const values = readSettingsForm(formData);
  const parsed = parseSettingsInput(values);
  if (!parsed.success) return { status: "error", fieldErrors: parsed.fieldErrors, values };

  try {
    await saveSettings(await createClient(), parsed.data);
  } catch (e) {
    console.error("saveSettings failed:", e);
    return { status: "error", fieldErrors: {}, message: SAVE_FAILED, values };
  }

  revalidatePath("/settings");
  revalidatePath("/time");
  return { status: "saved" };
}
