import React, { useState } from "react";
import {
  Button,
  Center,
  Fab,
  HStack,
  Icon,
  Modal,
  VStack,
  Text,
  Input,
  View,
} from "native-base";
import { Platform } from "react-native";
import { runAsync, useClient } from "./client";
import { ERR_NOT_IMPLEMENTED } from "./error";
import { FontAwesome5 } from "@expo/vector-icons";
import { useAppSelector } from "./store";
import { joinURL } from "./fetch";

function selectFiles(): Promise<null | File[]> {
  if (Platform.OS === "web") {
    return new Promise((resolve) => {
      const picker = document.createElement("input");
      picker.type = "file";
      picker.multiple = true;
      picker.accept = "*";
      picker.onchange = () => {
        // Cancelled prompt
        if (!picker.files) {
          resolve(null);
          return;
        }

        const files = Array.from(picker.files);
        resolve(files);
        return;
      };
      picker.click();
    });
  } else {
    throw ERR_NOT_IMPLEMENTED;
  }
}

export function UploadButton() {
  const { upload } = useClient();
  const currentPath = useAppSelector((state) => state.storage.currentPath);

  return (
    <Fab
      placement="bottom-right"
      accessibilityLabel="upload"
      icon={
        <Icon
          as={FontAwesome5}
          name="cloud-upload-alt"
          height="100%"
          size={4}
        />
      }
      onPress={() => {
        runAsync(async () => {
          console.log("Bringing up file selection prompt");
          const files = await selectFiles();
          if (files === null || files.length === 0) {
            console.log("File selection prompt rejected");
            return;
          }
          console.log(`Picked ${files.length} files`);

          upload(currentPath, files);
        });
      }}
    ></Fab>
  );
}

export function CreateNewDirectory() {
  const [showCreateNewFolderModal, setCreateNewFolderModal] = useState(false);

  return (
    <View>
      <Fab
        placement="bottom-right"
        right={24}
        accessibilityLabel="upload"
        icon={
          <Icon as={FontAwesome5} name="folder-plus" height="100%" size={4} />
        }
        onPress={() => {
          console.log("Displaying the create new folder modal");
          setCreateNewFolderModal(true);
        }}
      ></Fab>
      <CreateNewFolderModal isOpen={showCreateNewFolderModal} />
    </View>
  );
}

export function CreateNewFolderModal(props: Parameters<typeof Modal>[0]) {
  const [newName, setNewName] = useState("");
  const currentPath = useAppSelector((state) => state.storage.currentPath);
  const { upload } = useClient();

  return (
    <Modal {...props}>
      <Modal.Content maxWidth={96}>
        <Modal.Header>
          <Text>Create a new folder</Text>
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
                      // An empty upload will just create the folder in the path
                      await upload(joinURL(currentPath, newName), []);
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
