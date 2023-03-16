import { Portal } from "@/components/Portal";
import { BError } from "@/utils/error";
import { shallowEquals } from "@/utils/object";
import { errorSlice, useAppDispatch, useAppSelector } from "@/utils/store";
import { IconX } from "@tabler/icons-react";
import { useCallback, useMemo } from "react";

export function ErrorDisplay() {
  const errors = useAppSelector((state) => state.error.errors, shallowEquals);

  const errorPairs = useMemo(() => Object.entries(errors), [errors]);

  return (
    <Portal>
      <div className="toast toast-end toast-bottom">
        {errorPairs.map(([key, error]) => (
          <ErrorToast key={key} id={key} error={error} />
        ))}
      </div>
    </Portal>
  );
}

function ErrorToast({ error, id }: { error: BError; id: string }) {
  const dispatch = useAppDispatch();
  const dismissError = useCallback(
    () => dispatch(errorSlice.actions.clearError(id)),
    [dispatch, id],
  );

  return (
    <div className="alert alert-error flex flex-col max-w-prose items-start">
      <div className="flex flex-row w-full">
        <h6 className="flex-grow">{error.title}</h6>
        <button onClick={dismissError} className="btn btn-square btn-ghost">
          <IconX />
        </button>
      </div>
      <p>{error.description}</p>
      <pre>{error.code}</pre>
    </div>
  );
}
