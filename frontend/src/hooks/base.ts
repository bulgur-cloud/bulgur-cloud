import { errorSlice, useAppDispatch } from "../utils/store";

export const STORAGE = "storage";

export function useRunAsync() {
  const dispatch = useAppDispatch();

  /** Runs an async function, catching and storing any errors. */
  function runAsync(
    fn: () => Promise<void>,
    onError?: (_error: unknown) => Promise<void>,
  ) {
    return fn().catch((error) => {
      console.error(error);
      dispatch(
        errorSlice.actions.addError({
          key: `${new Date().getTime()}`,
          error,
        }),
      );
      if (onError) onError(error);
    });
  }
  return { runAsync };
}

export enum HttpStatusCode {
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  NOT_FOUND = 404,
}

export function isOkResponse(responseCode: number): boolean {
  return 200 <= responseCode && responseCode < 300;
}
