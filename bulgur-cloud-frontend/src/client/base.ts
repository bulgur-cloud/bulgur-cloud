import { errorSlice, store } from "../store";

export const STORAGE = "storage";

export function runAsync(
  fn: () => Promise<void>,
  onError?: (error: unknown) => Promise<void>,
) {
  fn().catch((error) => {
    console.error(error);
    store.dispatch(
      errorSlice.actions.addError({
        key: `${new Date().getTime()}`,
        error,
      }),
    );
    if (onError) onError(error);
  });
}

export enum HttpStatusCode {
  UNAUTHORIZED = 401,
  NOT_FOUND = 404,
}

export function isOkResponse(responseCode: number): boolean {
  return 200 <= responseCode && responseCode < 300;
}
