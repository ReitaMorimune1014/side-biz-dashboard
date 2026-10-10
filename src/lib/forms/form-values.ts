/**
 * フォームの値を、項目名ごとの文字列で取り出す。ない項目やファイルは空文字にする。
 * サーバーアクションと、送信前の画面の検証の両方で使う
 */
export function readFields<F extends string>(
  formData: FormData,
  fields: readonly F[],
): Record<F, string> {
  const values = {} as Record<F, string>
  for (const field of fields) {
    const value = formData.get(field)
    values[field] = typeof value === 'string' ? value : ''
  }
  return values
}

/** parse*Input の結果から、項目ごとのエラーだけを取り出す。成功なら空 */
export function fieldErrorsOf<E extends object>(
  result: { success: true } | { success: false; fieldErrors: E },
): E {
  return result.success ? ({} as E) : result.fieldErrors
}
