import {
  Modal,
  Text,
  VStack,
  HStack,
  Button,
  Center,
  Input,
} from "native-base";
import { useEffect, useState } from "react";
import { describeUnsafeFilename, isSafeFilename } from "../filenameUtils";

/** Wait this many ms before warning users about an unsafe filename.
 *
 * This is required to avoid the warning flickering as the user types. The
 * warning is also displayed if the user tries to submit an unsafe filename.
 */
const UNSAFE_FILENAME_WARNING_DELAY = 800;

export type FilenameModalAction = {
  message: string;
  action?: (name: string) => void;
};

type FilenameModalActionMap = {
  [key: string]: FilenameModalAction;
};

export type FilenameModalProps<
  Actions extends FilenameModalActionMap,
  Primary extends keyof Actions,
  Cancel extends keyof Actions,
> = {
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

export function FilenameModal<
  Actions extends FilenameModalActionMap,
  Primary extends keyof Actions,
  Cancel extends keyof Actions,
>(
  props: FilenameModalProps<Actions, Primary, Cancel> & {
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
  const cancel: FilenameModalAction = props.cancel
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
  const onClose = () => {
    console.log("cancel");
    if (cancel.action) cancel.action(newName);
    props.onDismiss();
  };

  return (
    <Modal onClose={onClose} avoidKeyboard={true} isOpen={true}>
      <Modal.Content maxWidth={96}>
        <Modal.Header>
          <Text>{props.title}</Text>
        </Modal.Header>
        <Modal.Body>
          <VStack space={4}>
            <SafetyLabel
              shouldDisplay={shouldDisplay}
              description={description}
            />
            <Input
              variant="underlined"
              placeholder={props.placeHolder ?? "new name"}
              returnKeyType="send"
              autoFocus={true}
              onChangeText={setNewName}
              onSubmitEditing={onSubmit}
              defaultValue={props.initialValue}
              backgroundColor={
                isUnsafe && shouldDisplay ? "amber.100" : undefined
              }
            />
            <Center>
              <HStack space={4}>
                <ModalButton
                  onPress={onSubmit}
                  message={primary.message}
                  highlight={true}
                  isDisabled={isUnsafe && shouldDisplay}
                />
                {rest.map((action) => (
                  <ModalButton
                    key={action.message}
                    onPress={() => {
                      if (action.action) action.action(newName);
                    }}
                    message={action.message}
                  />
                ))}
                <ModalButton
                  onPress={props.onDismiss}
                  message={cancel.message}
                />
              </HStack>
            </Center>
          </VStack>
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}

function ModalButton({
  onPress,
  message,
  highlight,
  isDisabled,
}: {
  onPress: () => void;
  message: string;
  highlight?: boolean;
  isDisabled?: boolean;
}) {
  return (
    <Button
      flexGrow={2}
      maxWidth={48}
      bgColor={highlight ? "primary.800" : "primary.600"}
      onPress={onPress}
      isDisabled={isDisabled}
    >
      <Text color={"lightText"} fontWeight={"semibold"}>
        {message}
      </Text>
    </Button>
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
    <Text
      fontSize="xs"
      fontStyle="italic"
      color="amber.900"
      opacity={shouldDisplay ? 100 : 0}
    >
      {description ?? " "}
    </Text>
  );
}
