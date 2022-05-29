import { Button, Center, HStack, Modal, Text } from "native-base";
import { runAsync, STORAGE } from "../client/base";
import { useDelete } from "../client/storage";
import { joinURL } from "../fetch";
import { DashboardParams } from "../routes";

export function DeleteConfirmModal(
  props: Parameters<typeof Modal>[0] & {
    itemName: string;
    isFile: boolean;
  } & DashboardParams,
) {
  const { doDelete } = useDelete();
  const params = props.route.params;

  let titleMessage: string;
  if (props.isFile) {
    titleMessage = `Delete file ${props.itemName}`;
  } else {
    titleMessage = `Delete folder ${props.itemName}`;
  }

  return (
    <Modal {...props}>
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
                    await doDelete(
                      joinURL(
                        STORAGE,
                        params.store,
                        params.path,
                        props.itemName,
                      ),
                    );
                    props.onClose();
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
                  props.onClose();
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
