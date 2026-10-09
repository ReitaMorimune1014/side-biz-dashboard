"use client";

import { useActionState } from "react";
import { WEEKDAY_LABELS, type Weekday } from "@/lib/weekly/week";
import {
  saveSettingsAction,
  type SettingsFormState,
  type SettingsFormValues,
} from "./actions";

const initialState: SettingsFormState = { status: "idle" };

const inputClass = "rounded-md border border-zinc-400 px-3 py-2";

const WEEKDAYS: Weekday[] = [1, 2, 3, 4, 5, 6, 0];

export function SettingsForm({ defaultValues }: { defaultValues: SettingsFormValues }) {
  const [state, formAction, pending] = useActionState(saveSettingsAction, initialState);

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

      <fieldset className="flex flex-col gap-1">
        <legend className="mb-1 text-sm font-medium">
          週の目標時間 <span className="text-red-700">*</span>
        </legend>
        <div className="flex items-center gap-2">
          <input
            id="hours"
            name="hours"
            type="text"
            inputMode="numeric"
            defaultValue={values.hours}
            aria-invalid={errors.target ? true : undefined}
            aria-describedby={errors.target ? "target-error" : "target-hint"}
            className={`${inputClass} w-20 text-right`}
          />
          <label htmlFor="hours">時間</label>
          <input
            id="minutes"
            name="minutes"
            type="text"
            inputMode="numeric"
            defaultValue={values.minutes}
            aria-invalid={errors.target ? true : undefined}
            aria-describedby={errors.target ? "target-error" : "target-hint"}
            className={`${inputClass} w-20 text-right`}
          />
          <label htmlFor="minutes">分</label>
        </div>
        {errors.target ? (
          <p id="target-error" className="text-sm text-red-700">
            {errors.target}
          </p>
        ) : (
          <p id="target-hint" className="text-xs text-zinc-600">
            稼働画面に、今週の消化率を表示します。目標に届いたら「達成」と表示します
          </p>
        )}
      </fieldset>

      <div className="flex flex-col gap-1">
        <label htmlFor="week_start" className="text-sm font-medium">
          週の開始曜日 <span className="text-red-700">*</span>
        </label>
        <select
          id="week_start"
          name="week_start"
          defaultValue={values.week_start}
          aria-invalid={errors.week_start ? true : undefined}
          aria-describedby={errors.week_start ? "week_start-error" : undefined}
          className={`${inputClass} w-32`}
        >
          {WEEKDAYS.map((day) => (
            <option key={day} value={day}>
              {WEEKDAY_LABELS[day]}
            </option>
          ))}
        </select>
        {errors.week_start && (
          <p id="week_start-error" className="text-sm text-red-700">
            {errors.week_start}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-zinc-900 px-4 py-2 font-medium text-white disabled:opacity-60"
        >
          {pending ? "保存中…" : "保存する"}
        </button>
        {state.status === "saved" && !pending && (
          <p role="status" className="text-sm text-green-800">
            保存しました
          </p>
        )}
      </div>
    </form>
  );
}
