import type { NextRequest } from "next/server";
import { verifySession } from "@/lib/auth/dal";
import { csvResponse } from "@/lib/csv";
import { todayInTokyo } from "@/lib/date";
import { toSearchParams } from "@/lib/list/query";
import { projectsToCsv } from "@/lib/projects/csv";
import { filterProjectList, parseProjectListQuery } from "@/lib/projects/list";
import { listProjects } from "@/lib/projects/repository";
import { createClient } from "@/lib/supabase/server";

/** 案件の一覧を、今の検索・絞り込み・並び順のまま、全件 CSV にする(所有者の絞り込みは RLS) */
export async function GET(request: NextRequest) {
  await verifySession();
  const query = parseProjectListQuery(toSearchParams(request.nextUrl.searchParams));
  const projects = filterProjectList(await listProjects(await createClient()), query);

  const today = todayInTokyo();
  return csvResponse(projectsToCsv(projects), `案件_${today}.csv`, `projects_${today}.csv`);
}
