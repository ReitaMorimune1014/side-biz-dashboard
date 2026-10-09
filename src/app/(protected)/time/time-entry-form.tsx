"use client";

import Link from "next/link";
import { useActionState, type ReactNode } from "react";
import { TIME_ENTRY_MEMO_MAX } from "@/lib/time-entries/schema";
import type { TimeEntryFormState, TimeEntryFormValues } from "./actions";

export type ProjectOption = { id: string; label: string };

type Props = {
  action: (state: TimeEntryFormState, formData: FormData) => Promise<TimeEntryFormState>;
  projects: ProjectOption[];
  defaultValues: TimeEntryFormValues;
  submitLabel: string;
  /** 編集のときだけ渡す */
  cancelHref?: string;
};

const initialState: TimeEntryFormState = { status: "idle" };

const inputClass = "rounded-md border border-zinc-400 px-3 py-2";

function Field({
  id,
  label,
  required,
  error,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium">
        {label} {required && <span className="text-red-700">*</span>}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

export function TimeEntryForm({ action, projects, defaultValues, submitLabel, cancelHref }: Props) {
  const [state, formAction, pending] = useActionState(action, initialState);

  const values = state.status === "error" ? state.values : defaultValues;
  const errors = state.status === "error" ? state.fieldErrors : {};
  const message = state.status === "error" ? state.message : undefined;

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
          aria-invalid={errors.project_id ? true : undefined}
          aria-describedby={errors.project_id ? "project_id-error" : undefined}
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

      <Field id="work_date" label="日付" required error={errors.work_date}>
        <input
          id="work_date"
          name="work_date"
          type="date"
          required
          defaultValue={values.work_date}
          aria-invalid={errors.work_date ? true : undefined}
          aria-describedby={errors.work_date ? "work_date-error" : undefined}
          className={inputClass}
        />
      </Field>

      <fieldset className="flex flex-col gap-1">
        <legend className="mb-1 text-sm font-medium">
          稼働時間 <span className="text-red-700">*</span>
        </legend>
        <div className="flex items-center gap-2">
          <input
            id="hours"
            name="hours"
            type="text"
            inputMode="numeric"
            defaultValue={values.hours}
            aria-invalid={errors.duration ? true : undefined}
            aria-describedby={errors.duration ? "duration-error" : undefined}
            className={`${inputClass} w-20 text-right`}
          />
          <label htmlFor="hours">時間</label>
          <input
            id="minutes"
            name="minutes"
            type="text"
            inputMode="numeric"
            defaultValue={values.minutes}
            aria-invalid={errors.duration ? true : undefined}
            aria-describedby={errors.duration ? "duration-error" : undefined}
            className={`${inputClass} w-20 text-right`}
          />
          <label htmlFor="minutes">分</label>
        </div>
        {errors.duration && (
          <p id="duration-error" className="text-sm text-red-700">
            {errors.duration}
          </p>
        )}
      </fieldset>

      <Field id="memo" label="メモ" error={errors.memo}>
        <textarea
          id="memo"
          name="memo"
          rows={3}
          maxLength={TIME_ENTRY_MEMO_MAX}
          defaultValue={values.memo}
          aria-invalid={errors.memo ? true : undefined}
          aria-describedby={errors.memo ? "memo-error" : undefined}
          className={inputClass}
        />
      </Field>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-zinc-900 px-4 py-2 font-medium text-white disabled:opacity-60"
        >
          {pending ? "保存中…" : submitLabel}
        </button>
        {cancelHref && (
          <Link href={cancelHref} className="text-sm underline">
            キャンセル
          </Link>
        )}
        {state.status === "saved" && !pending && (
          <p role="status" className="text-sm text-green-800">
            記録しました
          </p>
        )}
      </div>
    </form>
  );
}
