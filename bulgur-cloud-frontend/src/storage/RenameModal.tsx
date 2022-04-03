import {
  Modal,
  Text,
  VStack,
  Input,
  Center,
  HStack,
  Button,
} from "native-base";
import React, { useState } from "react";
import { runAsync, useClient } from "../client";
import { joinURL } from "../fetch";
import { useAppSelector } from "../store";

export function RenameModal(
  props: Parameters<typeof Modal>[0] & { itemName: string },
) {
  const [newName, setNewName] = useState("");
  const currentPath = useAppSelector((state) => state.storage.currentPath);
  const { rename } = useClient();

  return (
    <Modal {...props}>
      <Modal.Content maxWidth={96}>
        <Modal.Header>
          <Text>Rename {props.itemName}</Text>
        </Modal.Header>
        <Modal.Body>
          <VStack space={4}>
            <Input
              variant="underlined"
              placeholder="New name"
              returnKeyType="send"
              autoFocus={true}
              onChangeText={setNewName}
            />
            <Center>
              <HStack space={4}>
                <Button
                  flexGrow={2}
                  maxWidth={48}
                  onPress={() => {
                    runAsync(async () => {
                      await rename([
                        {
                          from: joinURL(currentPath, props.itemName),
                          to: joinURL(currentPath, newName),
                        },
                      ]);
                      props.onClose();
                    });
                  }}
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
          </VStack>
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}
