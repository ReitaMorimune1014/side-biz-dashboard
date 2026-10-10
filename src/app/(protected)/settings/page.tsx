import type { Metadata } from "next";
import { verifySession } from "@/lib/auth/dal";
import { getSettings } from "@/lib/settings/repository";
import { createClient } from "@/lib/supabase/server";
import { splitMinutes } from "@/lib/time-entries/duration";
import { SettingsForm } from "./settings-form";

export const metadata: Metadata = {
  title: "設定",
};

export default async function SettingsPage() {
  const { readOnly } = await verifySession();

  const settings = await getSettings(await createClient());
  const { hours, minutes } = splitMinutes(settings.weekly_target_minutes);

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-4 py-10">
      <h1 className="text-2xl font-semibold">設定</h1>
      <SettingsForm
        defaultValues={{
          hours: String(hours),
          minutes: String(minutes),
          week_start: String(settings.week_start),
        }}
        readOnly={readOnly}
      />
    </main>
  );
}
