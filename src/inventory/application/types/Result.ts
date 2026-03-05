export type Result<T, E> =
  | Readonly<{ ok: true; value: T }>
  | Readonly<{ ok: false; error: E }>

export const Result = {
  ok<T, E = never>(value: T): Result<T, E> {
    return { ok: true, value }
  },
  err<T = never, E = unknown>(error: E): Result<T, E> {
    return { ok: false, error }
  },
}
