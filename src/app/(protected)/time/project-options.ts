import type { Project } from "@/lib/projects/repository";
import type { ProjectOption } from "./time-entry-form";

/** 同じ題名の案件を見分けられるように、顧客名を添える */
export function toProjectOptions(projects: Project[]): ProjectOption[] {
  return projects.map((project) => ({
    id: project.id,
    label: `${project.title}(${project.customer.name})`,
  }));
}
