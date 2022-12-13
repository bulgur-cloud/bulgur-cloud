import { Text, Box, Heading, Spacer, Button, HStack, Icon } from "native-base";
import { useMemo } from "react";
import { SidePanel } from "./components/SidePanel";
import { storageSlice, useAppDispatch, useAppSelector } from "./store";
import { shallowEquals } from "./utils";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import { runAsync, STORAGE } from "./client/base";
import { joinURL } from "./fetch";
import { useRename } from "./client/storage";
import { useNavigationState } from "@react-navigation/native";

export function SelectionPanel() {
  const isEmpty = useAppSelector(
    (selector) => Object.values(selector.storage.selected).length === 0,
  );

  return (
    <SidePanel isOpen={!isEmpty} side="left">
      <SelectedItems />
    </SidePanel>
  );
}

export function SelectedItems() {
  const selected = useAppSelector(
    (selector) => selector.storage.selected,
    shallowEquals,
  );

  // Group selected items by the folders they are contained in
  const grouped = useMemo(() => {
    const grouped: {
      [containedIn: string]: typeof selected[string][];
    } = {};
    Object.values(selected).forEach((item) => {
      const key = item.path;
      if (grouped[key] === undefined) {
        grouped[key] = [];
      }
      grouped[key].push(item);
    });
    return grouped;
  }, [selected]);

  return (
    <Box
      padding={4}
      paddingLeft={8}
      width={480}
      backgroundColor="white"
      shadow={4}
    >
      <Heading textAlign="center" fontSize={24} fontFamily="Bitter">
        Selected
      </Heading>
      <Spacer height={4} />
      {Object.entries(grouped).map(([path, entries]) => {
        return (
          <Box key={path}>
            <Text>{`/${path}`}</Text>
            <ul>
              {entries.map((entry) => {
                return (
                  <li style={{ overflowWrap: "break-word" }} key={entry.name}>
                    {entry.name}
                  </li>
                );
              })}
            </ul>
          </Box>
        );
      })}
      <HStack>
        <MoveButton />
        <DeleteButton />
        <ClearButton />
      </HStack>
    </Box>
  );
}

function MoveButton() {
  const selected = useAppSelector(
    (selector) => selector.storage.selected,
    shallowEquals,
  );
  const dispatch = useAppDispatch();
  const { doRename } = useRename();
  // TODO: Do this without the horrendous cast
  const params = useNavigationState(
    (state) => state.routes[state.index].params,
  ) as unknown as { store: string; path: string };

  return (
    <Button
      flexGrow={1}
      margin={2}
      startIcon={
        <Icon
          as={MaterialCommunityIcons}
          name="select-place"
          height="100%"
          size={4}
        />
      }
      onPress={() => {
        runAsync(async () => {
          await Promise.all(
            Object.values(selected).map(async ({ store, path, name }) => {
              await doRename(
                joinURL(STORAGE, store, path, name),
                joinURL(params.store, params.path, name),
              );
            }),
          );
          dispatch(storageSlice.actions.clearAllSelected());
        });
      }}
    >
      Move here
    </Button>
  );
}

function DeleteButton() {
  const dispatch = useAppDispatch();

  return (
    <Button
      flexGrow={1}
      margin={2}
      startIcon={
        <Icon
          as={MaterialCommunityIcons}
          name="delete-outline"
          height="100%"
          size={4}
        />
      }
      onPress={() => {
        dispatch(storageSlice.actions.promptAction({ type: "BulkDelete" }));
      }}
    >
      Delete
    </Button>
  );
}

function ClearButton() {
  const dispatch = useAppDispatch();

  return (
    <Button
      flexGrow={1}
      margin={2}
      startIcon={
        <Icon as={MaterialIcons} name="clear" height="100%" size={4} />
      }
      onPress={() => {
        dispatch(storageSlice.actions.clearAllSelected());
      }}
    >
      Clear selection
    </Button>
  );
}
