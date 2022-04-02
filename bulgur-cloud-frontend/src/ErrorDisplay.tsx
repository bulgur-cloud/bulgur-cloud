import {
  Alert,
  Center,
  HStack,
  VStack,
  Text,
  IconButton,
  CloseIcon,
  Box,
  Stack,
} from "native-base";
import React from "react";
import { errorSlice, useAppDispatch, useAppSelector } from "./store";

export function ErrorDisplay() {
  const dispatch = useAppDispatch();
  let errors = useAppSelector((state) => state.error.errors);

  return (
    <Center>
      <Stack
        space={3}
        width="90%"
        maxWidth="400"
        top={8}
        position="fixed"
      >
        {Object.entries(errors).map(([key, error]) => {
          return (
            <Alert
              w="100%"
              status="error"
              backgroundColor="primary.800"
              key={key}
            >
              <VStack space={2} flexShrink={1} w="100%">
                <HStack flexShrink={1} space={2} justifyContent="space-between">
                  <HStack space={2} flexShrink={1}>
                    <Alert.Icon mt="1" color="lightText" accessibilityLabel="error" />
                    <Text fontSize="md" color="lightText">
                      {error}
                    </Text>
                  </HStack>

                  <IconButton
                    variant="unstyled"
                    accessibilityLabel="Dismiss error"
                    onPress={() => {
                      dispatch(errorSlice.actions.clearError(key));
                    }}
                    icon={<CloseIcon size="3" color="lightText" />}
                  />
                </HStack>
              </VStack>
            </Alert>
          );
        })}
      </Stack>
    </Center>
  );
}
