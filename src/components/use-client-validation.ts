import { useEffect, useRef, useState, type FormEvent } from "react";

export type FieldErrors<F extends string> = Partial<Record<F, string>>;

type Options<F extends string> = {
  /** サーバーアクションと同じ検証。FormData を受け取り、項目ごとのエラーを返す(なければ空) */
  validate: (formData: FormData) => FieldErrors<F>;
  /** useActionState の state。新しい結果が届いたら、サーバーのエラーを表示する */
  serverState: unknown;
  serverErrors: FieldErrors<F>;
  /** 入力欄の name と、エラーを出す項目が違うとき(例: hours → duration) */
  fieldOf?: (name: string) => F | undefined;
};

/**
 * 送信前に、サーバーと同じ検証を画面でも行う。
 * - エラーがあれば送信を止め、最初のエラーの項目へカーソルを移す
 * - 一度エラーが出た項目は、入力のたびに検証し直す(直ればエラーが消える)
 * サーバー側の検証は残るので、ここを通らずに送られても保存はされない
 */
export function useClientValidation<F extends string>({
  validate,
  serverState,
  serverErrors,
  fieldOf,
}: Options<F>) {
  const formRef = useRef<HTMLFormElement>(null);
  // 画面で検証した結果。basis はそのときの serverState で、サーバーから新しい結果が届いたら使わない
  const [local, setLocal] = useState<{ basis: unknown; errors: FieldErrors<F> } | null>(null);
  const [focusRequest, setFocusRequest] = useState(0);

  const errors = local && local.basis === serverState ? local.errors : serverErrors;

  useEffect(() => {
    if (focusRequest === 0) return;
    formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }, [focusRequest]);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    const next = validate(new FormData(event.currentTarget));
    setLocal({ basis: serverState, errors: next });
    if (Object.keys(next).length > 0) {
      event.preventDefault();
      setFocusRequest((n) => n + 1);
    }
  }

  function onChange(event: FormEvent<HTMLFormElement>) {
    const target = event.target as Partial<HTMLInputElement>;
    if (typeof target.name !== "string") return;
    const field = fieldOf ? fieldOf(target.name) : (target.name as F);
    if (!field || !(field in errors)) return;

    const message = validate(new FormData(event.currentTarget))[field];
    const next = { ...errors };
    if (message) next[field] = message;
    else delete next[field];
    setLocal({ basis: serverState, errors: next });
  }

  return { formRef, errors, onSubmit, onChange };
}
