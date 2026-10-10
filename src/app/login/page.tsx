import type { Metadata } from "next";
import { getSafeRedirectPath } from "@/lib/auth/redirect";
import { isDemoMode } from "@/lib/env";
import { DemoLoginForm } from "./demo-login-form";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "ログイン",
};

const NOTICES = new Map<string, string>([
  ["expired", "セッションが切れました。もう一度ログインしてください。"],
  [
    "link_invalid",
    "リンクが無効か、期限が切れています。もう一度メールを送ってください。リンクは、送信したのと同じブラウザで開いてください。",
  ],
]);

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const next = getSafeRedirectPath(firstParam(params.next));
  const noticeKey = firstParam(params.error) ?? firstParam(params.reason);
  const notice = noticeKey ? NOTICES.get(noticeKey) : undefined;
  const demo = isDemoMode();

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-4 py-16">
      <h1 className="text-2xl font-semibold">{demo ? "公開デモ" : "ログイン"}</h1>
      {notice && (
        <p role="alert" className="rounded-md bg-amber-50 p-4 text-sm text-amber-900">
          {notice}
        </p>
      )}
      {demo ? (
        <>
          <p className="text-sm text-zinc-700">
            ダミーのデータで、画面を自由に見られます。閲覧専用のため、追加・変更・削除はできません。
          </p>
          <DemoLoginForm next={next} />
        </>
      ) : (
        <>
          <p className="text-sm text-zinc-700">
            メールアドレスに、ログイン用のリンクを送ります。初めての方も、同じ手順で登録できます。
          </p>
          <LoginForm next={next} />
        </>
      )}
    </main>
  );
}
