import {
  Button,
  Center,
  HStack,
  Modal,
  Text,
  VStack,
} from "native-base";
import React, { useEffect, useState } from "react";
import { runAsync, useClient } from "../client";
import { useAppSelector } from "../store";
import { joinURL } from "../fetch";


export function DeleteConfirmModal(
  props: Parameters<typeof Modal>[0] & { itemName: string; isFile: boolean },
) {
  const currentPath = useAppSelector((state) => state.storage.currentPath);
  const { peekFolder, deletePath } = useClient();
  const [folderContentsCount, setFolderContentsCount] = useState<undefined | null | number>();

  let titleMessage: string;
  if (props.isFile) {
    titleMessage = `Delete file ${props.itemName}`;
  } else {
    titleMessage = `Delete folder ${props.itemName}`;
    if (folderContentsCount) {
      titleMessage = `${titleMessage}, which has ${folderContentsCount} items inside`;
    }
  }
  useEffect(() => {
    if (!props.isFile && folderContentsCount === undefined) {
      runAsync(async () => {
        const out = await peekFolder(joinURL(currentPath, props.itemName));
        if (out) setFolderContentsCount(out.entries.length);
      });
    }
  }, [props.itemName, props.isFile]);

  return (
    <Modal {...props}>
      <Modal.Content maxWidth={96}>
        <Modal.Header>
          <Text>
            {titleMessage}
          </Text>
        </Modal.Header>
        <Modal.Body>
          <VStack space={4}>
            <Center>
              <HStack space={4}>
                <Button
                  flexGrow={2}
                  maxWidth={48}
                  onPress={() => {
                    runAsync(async () => {
                      console.log(joinURL(currentPath, props.itemName));
                      await deletePath(joinURL(currentPath, props.itemName));
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
          </VStack>
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}
