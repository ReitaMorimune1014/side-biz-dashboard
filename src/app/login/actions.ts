"use server";

import { parseLoginEmail, type LoginFieldErrors } from "@/lib/auth/email";
import { getSafeRedirectPath } from "@/lib/auth/redirect";
import { getSiteUrl } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export type LoginState =
  | { status: "idle" }
  | { status: "sent"; email: string }
  | { status: "error"; fieldErrors: LoginFieldErrors; message?: string; email: string };

export async function sendMagicLink(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const raw = formData.get("email");
  const typed = typeof raw === "string" ? raw : "";
  const parsed = parseLoginEmail(typed);
  if (!parsed.success) {
    return { status: "error", fieldErrors: parsed.fieldErrors, email: typed };
  }
  const email = parsed.data;

  const nextValue = formData.get("next");
  const next = getSafeRedirectPath(typeof nextValue === "string" ? nextValue : null);
  const callbackUrl = new URL("/auth/callback", getSiteUrl());
  callbackUrl.searchParams.set("next", next);

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: callbackUrl.toString() },
  });

  if (error) {
    console.error("signInWithOtp failed:", error.status, error.message);
    return {
      status: "error",
      fieldErrors: {},
      message: "メールを送れませんでした。時間をおいて、もう一度お試しください",
      email,
    };
  }

  return { status: "sent", email };
}
