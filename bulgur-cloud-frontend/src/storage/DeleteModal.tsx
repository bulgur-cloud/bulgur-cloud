import { Button, Center, HStack, Modal, Text } from "native-base";
import { runAsync, STORAGE } from "../client/base";
import { useDelete } from "../client/storage";
import { joinURL } from "../fetch";
import {
  StorageAction,
  storageSlice,
  useAppDispatch,
  useAppSelector,
} from "../store";

export function DeleteModal() {
  const { doDelete } = useDelete();
  const action = useAppSelector(({ storage: { action } }) =>
    action?.type !== StorageAction.Delete ? undefined : action,
  );
  const dispatch = useAppDispatch();

  if (action === undefined) return <></>;
  const { store, path, name, isFile } = action;

  let titleMessage: string;
  if (isFile) {
    titleMessage = `Delete file ${name}`;
  } else {
    titleMessage = `Delete folder ${name}`;
  }

  function dismissPrompt() {
    dispatch(storageSlice.actions.dismissPrompt());
  }

  return (
    <Modal isOpen={true}>
      <Modal.Content maxWidth={96}>
        <Modal.Header>
          <Text>{titleMessage}</Text>
        </Modal.Header>
        <Modal.Footer>
          <Center>
            <HStack space={4}>
              <Button
                flexGrow={2}
                maxWidth={48}
                onPress={() => {
                  runAsync(async () => {
                    await doDelete(joinURL(STORAGE, store, path, name));
                    dismissPrompt();
                  });
                }}
                bgColor={"primary.800"}
              >
                <Text color={"lightText"} fontWeight={"semibold"}>
                  Delete
                </Text>
              </Button>
              <Button
                flexGrow={2}
                maxWidth={48}
                onPress={() => {
                  dismissPrompt();
                }}
                bgColor={"primary.600"}
              >
                <Text color={"lightText"} fontWeight={"semibold"}>
                  Cancel
                </Text>
              </Button>
            </HStack>
          </Center>
        </Modal.Footer>
      </Modal.Content>
    </Modal>
  );
}
