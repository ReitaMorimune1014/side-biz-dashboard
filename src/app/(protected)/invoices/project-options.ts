import type { Project } from "@/lib/projects/repository";
import type { InvoiceProjectOption } from "./invoice-form";

/** 同じ題名の案件を見分けられるように、顧客名を添える */
export function toInvoiceProjectOptions(projects: Project[]): InvoiceProjectOption[] {
  return projects.map((project) => ({
    id: project.id,
    label: `${project.title}(${project.customer.name})`,
    amount: project.amount,
  }));
}
