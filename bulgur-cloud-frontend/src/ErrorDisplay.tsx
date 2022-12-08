import {
  Alert,
  Center,
  HStack,
  VStack,
  Text,
  IconButton,
  CloseIcon,
  Stack,
  Spacer,
} from "native-base";
import { errorSlice, useAppDispatch, useAppSelector } from "./store";
import { shallowEquals } from "./utils";

export function ErrorDisplay() {
  const dispatch = useAppDispatch();
  const errors = useAppSelector((state) => state.error.errors, shallowEquals);

  return (
    <Center>
      <Stack space={3} width="90%" maxWidth="400" top={8} position="fixed">
        {Object.entries(errors).map(([key, error]) => {
          return (
            <Alert
              w="100%"
              status="error"
              backgroundColor="primary.800"
              color="lightText"
              key={key}
            >
              <VStack space={2} flexShrink={1} w="100%">
                <HStack flexShrink={1} space={2} justifyContent="space-between">
                  <HStack space={2} flexShrink={1}>
                    <Alert.Icon
                      mt="1"
                      color="lightText"
                      accessibilityLabel="error"
                    />
                    <Text fontSize="md" color="lightText">
                      {error.title}
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
                <Spacer size={4} />
                <Text color="lightText">{error.description}</Text>
                <Spacer />
                <Text color="lightText">
                  error code:{" "}
                  <Text fontFamily="monospace" fontSize="xs" color="lightText">
                    {error.code}
                  </Text>
                </Text>
              </VStack>
            </Alert>
          );
        })}
      </Stack>
    </Center>
  );
}
