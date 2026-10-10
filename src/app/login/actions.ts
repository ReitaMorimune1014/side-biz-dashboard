"use server";

import { isValidEmail } from "@/lib/auth/email";
import { getSafeRedirectPath } from "@/lib/auth/redirect";
import { getSiteUrl } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export type LoginState =
  | { status: "idle" }
  | { status: "sent"; email: string }
  | { status: "error"; message: string };

export async function sendMagicLink(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!isValidEmail(email)) {
    return { status: "error", message: "メールアドレスの形式が正しくありません" };
  }

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
      message: "メールを送れませんでした。時間をおいて、もう一度お試しください",
    };
  }

  return { status: "sent", email };
}
