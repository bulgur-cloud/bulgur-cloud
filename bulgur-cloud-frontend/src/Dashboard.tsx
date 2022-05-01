import {
  Center,
  CloseIcon,
  HStack,
  Icon,
  IconButton,
  Spacer,
  Text,
  VStack,
} from "native-base";
import React, { useEffect } from "react";
import { runAsync, useClient } from "./client";
import { File } from "./storage/File";
import { storageSlice, useAppDispatch, useAppSelector } from "./store";
import { FontAwesome5 } from "@expo/vector-icons";
import { joinURL, urlUp1Level } from "./fetch";
import { FolderList } from "./storage/FolderList";
import { FillSpacer } from "./FillSpacer";
import { DashboardParams } from "./routes";

function StorageItem(params: DashboardParams) {
  const isFolder = useAppSelector((state) => state.storage.is_folder);
  if (isFolder) {
    return <FolderList {...params} />;
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
            await loadFolder.run(urlUp1Level(currentPath));
          });
        }}
      />
    );
  }
}

export function Dashboard(params: DashboardParams) {
  const { username, isAuthenticated, loadFolder, logout } = useClient();
  const state = useAppSelector((state) => state.storage.state);
  const { store, path } = params.route.params;

  useEffect(() => {
    runAsync(async () => {
      await loadFolder.run(joinURL(store, path));
    });
  }, [isAuthenticated, state, path]);

  useEffect(() => {
    if (!isAuthenticated) {
      params.navigation.replace("Login");
    }
  }, [isAuthenticated]);

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
          <MiddleSection />
          <HStack space={2}>
            <Text>{username}</Text>
            <Text
              color="primary.400"
              onPress={() => {
                logout.run();
                params.navigation.replace("Login");
              }}
            >
              (Logout)
            </Text>
          </HStack>
        </HStack>
        <StorageItem {...params} />
      </VStack>
    </Center>
  );
}

function MiddleSection() {
  const dispatch = useAppDispatch();
  const numMarkedForMove = useAppSelector(
    (state) => Object.keys(state.storage.markedForMove).length,
  );

  if (numMarkedForMove === 0) return <FillSpacer />;
  return (
    <FillSpacer>
      <Center>
        <HStack space={2}>
          {numMarkedForMove === 1 ? (
            <Text>{numMarkedForMove} item is marked to be moved</Text>
          ) : (
            <Text>{numMarkedForMove} items are marked to be moved</Text>
          )}
          <Spacer />
          <IconButton
            variant="unstyled"
            accessibilityLabel="Dismiss error"
            onPress={() => {
              dispatch(storageSlice.actions.clearMarksForMove());
            }}
            icon={<CloseIcon size="2" color="darkText" />}
          />
        </HStack>
      </Center>
    </FillSpacer>
  );
}
