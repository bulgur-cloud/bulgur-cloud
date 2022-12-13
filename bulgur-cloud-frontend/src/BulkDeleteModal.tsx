import { Button, Center, HStack, Modal, Text } from "native-base";
import { runAsync, STORAGE } from "./client/base";
import { useDelete } from "./client/storage";
import { joinURL } from "./fetch";
import { storageSlice, useAppDispatch, useAppSelector } from "./store";
import { shallowEquals } from "./utils";

export function BulkDeleteModal() {
  const { doDelete } = useDelete();
  const action = useAppSelector(
    ({ storage: { action } }) => action?.type === "BulkDelete",
  );
  const selected = useAppSelector(
    (selector) => selector.storage.selected,
    shallowEquals,
  );
  const dispatch = useAppDispatch();

  if (action === false) return <></>;

  function dismissPrompt() {
    dispatch(storageSlice.actions.dismissPrompt());
  }

  return (
    <Modal isOpen={true}>
      <Modal.Content maxWidth={96}>
        <Modal.Header>
          <Text>Delete all selected files?</Text>
        </Modal.Header>
        <Modal.Footer>
          <Center>
            <HStack space={4}>
              <Button
                flexGrow={2}
                maxWidth={48}
                onPress={() => {
                  runAsync(async () => {
                    await Promise.all(
                      Object.values(selected).map(
                        async ({ store, path, name }) => {
                          await doDelete(joinURL(STORAGE, store, path, name));
                        },
                      ),
                    );
                    dispatch(storageSlice.actions.clearAllSelected());
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
