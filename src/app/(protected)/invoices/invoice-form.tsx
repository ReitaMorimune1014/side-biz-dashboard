"use client";

import Link from "next/link";
import { useActionState, useRef, type ReactNode } from "react";
import type { InvoiceFormState, InvoiceFormValues } from "./actions";

export type InvoiceProjectOption = { id: string; label: string; amount: number };

type Props = {
  action: (state: InvoiceFormState, formData: FormData) => Promise<InvoiceFormState>;
  projects: InvoiceProjectOption[];
  defaultValues: InvoiceFormValues;
  submitLabel: string;
  /** 作成のときは、案件を選ぶと案件の金額を入れる(自分で金額を入力していなければ) */
  prefillAmount?: boolean;
  /** 編集のときだけ、入金日の欄を出す */
  showPaidOn?: boolean;
};

const initialState: InvoiceFormState = { status: "idle" };

const inputClass = "rounded-md border border-zinc-400 px-3 py-2";

function Field({
  id,
  label,
  required,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium">
        {label} {required && <span className="text-red-700">*</span>}
      </label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="text-xs text-zinc-600">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

function describedBy(id: string, error?: string, hint?: string) {
  if (error) return `${id}-error`;
  if (hint) return `${id}-hint`;
  return undefined;
}

export function InvoiceForm({
  action,
  projects,
  defaultValues,
  submitLabel,
  prefillAmount,
  showPaidOn,
}: Props) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const amountRef = useRef<HTMLInputElement>(null);
  const amountEdited = useRef(false);

  const values = state.status === "error" ? state.values : defaultValues;
  const errors = state.status === "error" ? state.fieldErrors : {};
  const message = state.status === "error" ? state.message : undefined;
  const amountHint = "税込の円。整数で入力します(例: 120000)";
  const paidOnHint = "未入金なら空のままにします";

  function handleProjectChange(projectId: string) {
    if (!prefillAmount || amountEdited.current || !amountRef.current) return;
    const project = projects.find((p) => p.id === projectId);
    if (project) amountRef.current.value = String(project.amount);
  }

  return (
    <form action={formAction} className="flex flex-col gap-5" noValidate>
      {message && (
        <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-800">
          {message}
        </p>
      )}

      <Field id="project_id" label="案件" required error={errors.project_id}>
        <select
          id="project_id"
          name="project_id"
          required
          defaultValue={values.project_id ?? ""}
          onChange={(e) => handleProjectChange(e.target.value)}
          aria-invalid={errors.project_id ? true : undefined}
          aria-describedby={describedBy("project_id", errors.project_id)}
          className={inputClass}
        >
          <option value="" disabled>
            選んでください
          </option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.label}
            </option>
          ))}
        </select>
      </Field>

      <Field id="amount" label="金額(円)" required error={errors.amount} hint={amountHint}>
        <input
          ref={amountRef}
          id="amount"
          name="amount"
          type="text"
          inputMode="numeric"
          required
          defaultValue={values.amount}
          onInput={() => {
            amountEdited.current = true;
          }}
          aria-invalid={errors.amount ? true : undefined}
          aria-describedby={describedBy("amount", errors.amount, amountHint)}
          className={inputClass}
        />
      </Field>

      <Field id="issued_on" label="発行日" required error={errors.issued_on}>
        <input
          id="issued_on"
          name="issued_on"
          type="date"
          required
          defaultValue={values.issued_on}
          aria-invalid={errors.issued_on ? true : undefined}
          aria-describedby={describedBy("issued_on", errors.issued_on)}
          className={inputClass}
        />
      </Field>

      <Field id="due_on" label="支払期限" required error={errors.due_on}>
        <input
          id="due_on"
          name="due_on"
          type="date"
          required
          defaultValue={values.due_on}
          aria-invalid={errors.due_on ? true : undefined}
          aria-describedby={describedBy("due_on", errors.due_on)}
          className={inputClass}
        />
      </Field>

      {showPaidOn && (
        <Field id="paid_on" label="入金日" error={errors.paid_on} hint={paidOnHint}>
          <input
            id="paid_on"
            name="paid_on"
            type="date"
            defaultValue={values.paid_on}
            aria-invalid={errors.paid_on ? true : undefined}
            aria-describedby={describedBy("paid_on", errors.paid_on, paidOnHint)}
            className={inputClass}
          />
        </Field>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-zinc-900 px-4 py-2 font-medium text-white disabled:opacity-60"
        >
          {pending ? "保存中…" : submitLabel}
        </button>
        <Link href="/invoices" className="text-sm underline">
          キャンセル
        </Link>
      </div>
    </form>
  );
}
