import { Modal, Text, Input, Center, HStack, Button } from "native-base";
import React, { useState } from "react";
import { runAsync, STORAGE } from "../client/base";
import { useRename } from "../client/storage";
import { joinURL } from "../fetch";
import { DashboardParams } from "../routes";

export function RenameModal(
  props: Parameters<typeof Modal>[0] & { itemName: string } & DashboardParams,
) {
  const [newName, setNewName] = useState("");
  const { doRename } = useRename();
  const { path, store } = props.route.params;

  function runRename() {
    runAsync(async () => {
      await doRename(
        joinURL(STORAGE, store, path, props.itemName),
        joinURL(store, path, newName),
      );
      props.onClose();
    });
  }

  return (
    <Modal {...props}>
      <Modal.Content maxWidth={96}>
        <Modal.Header>
          <Text>Rename {props.itemName}</Text>
        </Modal.Header>
        <Modal.Body>
          <Input
            variant="underlined"
            placeholder="New name"
            returnKeyType="send"
            autoFocus={true}
            onChangeText={setNewName}
            defaultValue={props.itemName}
            selectTextOnFocus={true}
            onSubmitEditing={runRename}
          />
        </Modal.Body>
        <Modal.Footer>
          <Center>
            <HStack space={4}>
              <Button
                flexGrow={2}
                maxWidth={48}
                onPress={runRename}
                bgColor={"primary.800"}
              >
                <Text color={"lightText"} fontWeight={"semibold"}>
                  Rename
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
