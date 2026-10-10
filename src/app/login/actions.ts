"use server";

import { redirect } from "next/navigation";
import { parseLoginEmail, type LoginFieldErrors } from "@/lib/auth/email";
import { getSafeRedirectPath } from "@/lib/auth/redirect";
import { getDemoAccount, getSiteUrl, isDemoMode } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export type LoginState =
  | { status: "idle" }
  | { status: "sent"; email: string }
  | { status: "error"; fieldErrors: LoginFieldErrors; message?: string; email: string };

export type DemoLoginState = { status: "idle" } | { status: "error"; message: string };

function readNext(formData: FormData): string {
  const nextValue = formData.get("next");
  return getSafeRedirectPath(typeof nextValue === "string" ? nextValue : null);
}

export async function sendMagicLink(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const raw = formData.get("email");
  // 公開デモでは、新しい登録やログイン用のメールを受け付けない
  if (isDemoMode()) {
    return {
      status: "error",
      fieldErrors: {},
      message: "デモでは、メールでのログインは使えません",
      email: typeof raw === "string" ? raw : "",
    };
  }
  const typed = typeof raw === "string" ? raw : "";
  const parsed = parseLoginEmail(typed);
  if (!parsed.success) {
    return { status: "error", fieldErrors: parsed.fieldErrors, email: typed };
  }
  const email = parsed.data;

  const next = readNext(formData);
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

/** 公開デモの、閲覧専用アカウントでログインする。パスワードはサーバーの環境変数から読む */
export async function signInAsDemo(
  _prevState: DemoLoginState,
  formData: FormData,
): Promise<DemoLoginState> {
  const account = getDemoAccount();
  if (!account) return { status: "error", message: "この環境では、デモは使えません" };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(account);
  if (error) {
    console.error("demo signInWithPassword failed:", error.status, error.message);
    return {
      status: "error",
      message: "デモにログインできませんでした。時間をおいて、もう一度お試しください",
    };
  }

  redirect(readNext(formData));
}
