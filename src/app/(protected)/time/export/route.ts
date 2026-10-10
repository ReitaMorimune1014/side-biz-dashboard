import type { NextRequest } from "next/server";
import { verifySession } from "@/lib/auth/dal";
import { csvResponse } from "@/lib/csv";
import { todayInTokyo } from "@/lib/date";
import { toSearchParams } from "@/lib/list/query";
import { listProjects } from "@/lib/projects/repository";
import { createClient } from "@/lib/supabase/server";
import { timeEntriesToCsv } from "@/lib/time-entries/csv";
import { filterTimeEntryList, parseTimeEntryListQuery } from "@/lib/time-entries/list";
import { listTimeEntries } from "@/lib/time-entries/repository";

/** 稼働の一覧を、今の検索・絞り込み・並び順のまま、全件 CSV にする(所有者の絞り込みは RLS) */
export async function GET(request: NextRequest) {
  await verifySession();
  const query = parseTimeEntryListQuery(toSearchParams(request.nextUrl.searchParams));

  const supabase = await createClient();
  const [projects, entries] = await Promise.all([listProjects(supabase), listTimeEntries(supabase)]);
  const customerNames = new Map(projects.map((p) => [p.id, p.customer.name]));

  const today = todayInTokyo();
  return csvResponse(
    timeEntriesToCsv(filterTimeEntryList(entries, query), customerNames),
    `稼働_${today}.csv`,
    `time-entries_${today}.csv`,
  );
}
