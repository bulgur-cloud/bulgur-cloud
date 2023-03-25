import { Portal } from "@/components/Portal";
import { describeUnsafeFilename, isSafeFilename } from "@/utils/filename";
import { useEffect, useState } from "react";
import { FocusOn } from "react-focus-on";

/** Wait this many ms before warning users about an unsafe filename.
 *
 * This is required to avoid the warning flickering as the user types. The
 * warning is also displayed if the user tries to submit an unsafe filename.
 */
const UNSAFE_FILENAME_WARNING_DELAY = 800;

export type BaseFilenameModalAction = {
  message: string;
  action?: (_name: string) => void;
};

type BaseFilenameModalActionMap = {
  [key: string]: BaseFilenameModalAction;
};

export type BaseFilenameModalProps<
  Actions extends BaseFilenameModalActionMap,
  Primary extends keyof Actions,
  Cancel extends keyof Actions,
> = {
  idPrefix?: string;
  actions: Actions;
  title: string;
  placeHolder?: string;
  initialValue?: string;
  primary: Primary;
  /** Which action is used to cancel this modal.
   *
   * If missing, one will be automatically added. You only need to add one if
   * you want to rename the button, or if you want to do a special action when
   * the modal is dismissed.
   *
   * If you do add one, the action will rename the button and
   */
  cancel?: Cancel;
};

export function BaseFilenameModal<
  Actions extends BaseFilenameModalActionMap,
  Primary extends keyof Actions,
  Cancel extends keyof Actions,
>(
  props: BaseFilenameModalProps<Actions, Primary, Cancel> & {
    onDismiss: () => void;
  },
) {
  const [newName, setNewName] = useState(props.initialValue ?? "");

  const safety = isSafeFilename(newName);
  const isUnsafe = !!safety;
  const description = isUnsafe ? describeUnsafeFilename(safety) : undefined;

  const [shouldDisplay, setShouldDisplay] = useState(false);

  useEffect(() => {
    if (description === undefined) {
      setShouldDisplay(false);
    } else {
      const timeout = setTimeout(() => {
        setShouldDisplay(true);
      }, UNSAFE_FILENAME_WARNING_DELAY);
      return () => {
        clearTimeout(timeout);
      };
    }
  }, [description]);

  const primary = props.actions[props.primary];
  const cancel: BaseFilenameModalAction = props.cancel
    ? props.actions[props.cancel]
    : { message: "Cancel" };
  const rest = Object.entries(props.actions)
    .filter(([key]) => key !== props.cancel && key !== props.primary)
    .map(([_key, value]) => value);

  const onSubmit = () => {
    if (isUnsafe) {
      console.log("tried to submit unsafe filename");
      setShouldDisplay(true);
    } else {
      console.log("submit");
      if (primary.action) primary.action(newName);
      props.onDismiss();
    }
  };

  return (
    <Portal>
      <div className="modal modal-open">
        <FocusOn
          className="modal-box flex flex-col w-full m-4"
          onClickOutside={props.onDismiss}
          onEscapeKey={props.onDismiss}
        >
          <h2 className="text-xl">{props.title}</h2>
          <SafetyLabel
            shouldDisplay={shouldDisplay}
            description={description}
          />
          <input
            id={props.idPrefix ? `${props.idPrefix}-filename-input` : undefined}
            className="input input-bordered my-4"
            placeholder={props.placeHolder ?? "new name"}
            enterKeyHint="done"
            type="text"
            defaultValue={props.initialValue}
            onSubmit={onSubmit}
            onChange={(event) => setNewName(event.target.value)}
          />
          <div className="flex flex-row">
            <ModalButton
              id={
                props.idPrefix ? `${props.idPrefix}-filename-submit` : undefined
              }
              onPress={onSubmit}
              message={primary.message}
              highlight={true}
              isDisabled={isUnsafe && shouldDisplay && newName !== ""}
            />
            {rest.map((action) => (
              <ModalButton
                id={
                  props.idPrefix
                    ? `${props.idPrefix}-filename-${action.message}`
                    : undefined
                }
                key={action.message}
                onPress={() => {
                  if (action.action) action.action(newName);
                }}
                message={action.message}
              />
            ))}
            <ModalButton
              id={
                props.idPrefix ? `${props.idPrefix}-filename-cancel` : undefined
              }
              onPress={props.onDismiss}
              message={cancel.message}
            />
          </div>
        </FocusOn>
      </div>
    </Portal>
  );
}

export function ModalButton({
  id,
  onPress,
  message,
  highlight,
  isDisabled,
}: {
  id?: string;
  onPress: () => void;
  message: string;
  highlight?: boolean;
  isDisabled?: boolean;
}) {
  return (
    <button
      id={id}
      className={`btn m-2 flex-grow max-w- ${
        highlight ? " btn-primary" : "btn-secondary"
      }`}
      onClick={onPress}
      disabled={isDisabled}
    >
      {message}
    </button>
  );
}

function SafetyLabel({
  description,
  shouldDisplay,
}: {
  description?: string;
  shouldDisplay: boolean;
}) {
  return (
    <span
      className={`text-xs italic text-warning ${
        shouldDisplay ? "opacity-100" : "opacity-0"
      } h-4`}
    >
      {description}
    </span>
  );
}
