"use client";

import { useFormStatus } from "react-dom";

function SubmitButton({ name }: { name: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-label={`「${name}」を削除`}
      className="rounded-md border border-red-700 px-3 py-1.5 text-sm font-medium text-red-700 disabled:opacity-60"
    >
      {pending ? "削除中…" : "削除"}
    </button>
  );
}

export function DeleteButton({ action, name }: { action: () => Promise<void>; name: string }) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!window.confirm(`「${name}」を削除しますか?`)) event.preventDefault();
      }}
    >
      <SubmitButton name={name} />
    </form>
  );
}
