import { Text, Box, Heading, Spacer, Button, HStack } from "native-base";
import { useMemo } from "react";
import { SidePanel } from "./components/SidePanel";
import { useAppSelector } from "./store";
import { shallowEquals } from "./utils";

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
            <Text>In {`/${path}`}</Text>
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
        <Button flexGrow={1} margin={2}>
          Move here
        </Button>
        <Button flexGrow={1} margin={2}>
          Delete
        </Button>
      </HStack>
    </Box>
  );
}
