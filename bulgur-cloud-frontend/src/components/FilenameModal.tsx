import {
  Modal,
  Text,
  VStack,
  HStack,
  Button,
  Center,
  Input,
} from "native-base";
import { useState } from "react";

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

/** Returns the filename modal element, and a hook that can be used to open the
 * element.
 */
export function useFilenameModal<
  Actions extends FilenameModalActionMap,
  Primary extends keyof Actions,
  Cancel extends keyof Actions,
>(
  props: FilenameModalProps<Actions, Primary, Cancel>,
): [() => void, JSX.Element] {
  const [isOpen, setOpen] = useState(false);
  return [
    () => {
      setOpen(true);
    },
    <FilenameModal
      // Not actually necessary but trips up the linter
      key={props.title}
      {...props}
      openState={[isOpen, setOpen]}
    />,
  ];
}

function FilenameModal<
  Actions extends FilenameModalActionMap,
  Primary extends keyof Actions,
  Cancel extends keyof Actions,
>(
  props: FilenameModalProps<Actions, Primary, Cancel> & {
    openState: [boolean, (set: boolean) => void];
  },
) {
  const [isOpen, setOpen] = props.openState;
  const [newName, setNewName] = useState(props.initialValue ?? "");

  const primary = props.actions[props.primary];
  const cancel: FilenameModalAction = props.cancel
    ? props.actions[props.cancel]
    : { message: "Cancel" };
  const rest = Object.entries(props.actions)
    .filter(([key]) => key !== props.cancel && key !== props.primary)
    .map(([_key, value]) => value);

  const onSubmit = () => {
    console.log("submit");
    if (primary.action) primary.action(newName);
    setOpen(false);
  };
  const onDismiss = () => {
    console.log("cancel");
    if (cancel.action) cancel.action(newName);
    setOpen(false);
  };

  return (
    <Modal onClose={onDismiss} avoidKeyboard={true} isOpen={isOpen}>
      <Modal.Content maxWidth={96}>
        <Modal.Header>
          <Text>{props.title}</Text>
        </Modal.Header>
        <Modal.Body>
          <VStack space={4}>
            <Input
              variant="underlined"
              placeholder={props.placeHolder ?? "new name"}
              returnKeyType="send"
              autoFocus={true}
              onChangeText={setNewName}
              onSubmitEditing={onSubmit}
              defaultValue={props.initialValue}
            />
            <Center>
              <HStack space={4}>
                <ModalButton
                  onPress={onSubmit}
                  message={primary.message}
                  highlight={true}
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
                <ModalButton onPress={onDismiss} message={cancel.message} />
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
}: {
  onPress: () => void;
  message: string;
  highlight?: boolean;
}) {
  return (
    <Button
      flexGrow={2}
      maxWidth={48}
      bgColor={highlight ? "primary.800" : "primary.600"}
      onPress={onPress}
    >
      <Text color={"lightText"} fontWeight={"semibold"}>
        {message}
      </Text>
    </Button>
  );
}
