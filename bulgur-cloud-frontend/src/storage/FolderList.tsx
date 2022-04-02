import { Center, Text, VStack } from "native-base";
import React from "react";
import { useAppSelector } from "../store";
import { CreateNewDirectory, UploadButton } from "../Upload";
import { FolderListEntry } from "./FolderListEntry";

export function FolderList() {
  const contents = useAppSelector((state) => state.storage.contents);

  if (contents.length === 0) {
    return (
      <Center>
        <Text color="darkText">This folder is empty.</Text>
      </Center>
    );
  }

  return (
    <VStack space={3}>
      {contents.map((item, index) => (
        <FolderListEntry item={item} key={index} />
      ))}
      <UploadButton />
      <CreateNewDirectory />
    </VStack>
  );
}
