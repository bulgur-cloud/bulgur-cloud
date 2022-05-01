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
import { useClient } from "./client";
import { File } from "./storage/File";
import { storageSlice, useAppDispatch, useAppSelector } from "./store";
import { FontAwesome5 } from "@expo/vector-icons";
import { urlUp1Level } from "./fetch";
import { FolderList } from "./storage/FolderList";
import { FillSpacer } from "./FillSpacer";
import { DashboardParams } from "./routes";
import { useNavigation } from "@react-navigation/native";
import { useSWRConfig } from "swr";

function StorageItem(params: DashboardParams) {
  if (params.route.params.isFile) {
    return <File {...params} />;
  } else {
    return <FolderList {...params} />;
  }
}

function BackButton(params: DashboardParams) {
  const navigation = useNavigation();
  const { store, path } = params.route.params;

  if (path === "") {
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
          navigation.navigate("Dashboard", {
            store,
            path: urlUp1Level(path),
            isFile: false,
          });
        }}
      />
    );
  }
}

export function Dashboard(params: DashboardParams) {
  const { username, isAuthenticated, logout } = useClient();
  const { cache } = useSWRConfig();

  const doLogout = () => {
    logout.run();
    // Type mismatch, function is available: https://github.com/vercel/swr/issues/1887
    // @ts-ignore
    cache.clear();
    params.navigation.replace("Login");
  };

  useEffect(() => {
    if (!isAuthenticated) {
      doLogout();
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
          <BackButton {...params} />
          <MiddleSection />
          <HStack space={2}>
            <Text>{username}</Text>
            <Text color="primary.400" onPress={doLogout}>
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
