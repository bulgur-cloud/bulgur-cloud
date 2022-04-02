import {
  Center,
  HStack,
  Icon,
  Text,
  VStack,
} from "native-base";
import React, { useEffect } from "react";
import { runAsync, useClient } from "./client";
import { FullPageLoading } from "./Loading";
import { File } from "./storage/File";
import { useAppSelector } from "./store";
import { FontAwesome5 } from "@expo/vector-icons";
import { urlUp1Level } from "./fetch";
import { FolderList } from "./storage/FolderList";
import { FillSpacer } from "./FillSpacer";


function StorageItem() {
  const isFolder = useAppSelector((state) => state.storage.is_folder);
  if (isFolder) {
    return <FolderList />;
  } else {
    return <File />;
  }
}

function BackButton() {
  const { username, loadFolder } = useClient();
  const currentPath = useAppSelector((state) => state.storage.currentPath);

  console.log(username);
  console.log(currentPath);

  if (`${username}/` === currentPath) {
    // Nothing to back out to
    return (
      <Icon
        as={FontAwesome5}
        color="primary.400"
        name="arrow-left"
        size="md"
        accessibilityElementsHidden={true}
      />
    );
  } else {
    return (
      <Icon
        as={FontAwesome5}
        color="primary.800"
        name="arrow-left"
        size="md"
        accessibilityLabel="Go back"
        onPress={() => {
          runAsync(async () => {
            await loadFolder(urlUp1Level(currentPath));
          });
        }}
      />
    );
  }
}

export function Dashboard() {
  const { username, state: authState, loadFolder } = useClient();
  const state = useAppSelector((state) => state.storage.state);

  useEffect(() => {
    if (authState === "done" && state === "uninitialized") {
      runAsync(async () => {
        await loadFolder(`${username}/`);
      });
    }
  }, [authState, state]);

  if (authState !== "done") {
    return <FullPageLoading />;
  }

  return (
    <Center paddingTop={16}>
      <VStack
        width="100%"
        maxWidth="2xl"
        space={4}
        justifyItems="left"
        alignItems="left"
      >
        <HStack
          space={4}
          marginBottom={4}
          paddingBottom={4}
          borderBottomColor="primary.900"
          borderBottomWidth={2}
        >
          <BackButton />
          <FillSpacer />
          <Text>{username}</Text>
        </HStack>
        <StorageItem />
      </VStack>
    </Center>
  );
}
