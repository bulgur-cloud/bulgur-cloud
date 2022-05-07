import { Button, Center, Spacer, Text, VStack } from "native-base";
import { NotFoundParams } from "./routes";

export function NotFound(params: NotFoundParams) {
  return (
    <Center>
      <VStack space={4}>
        <Text>
          What you are looking for no longer exists, or maybe never existed.
        </Text>
        <Spacer />
        {params.navigation.canGoBack() ? (
          <Button
            onPress={() => {
              params.navigation.goBack();
            }}
          >
            Go back
          </Button>
        ) : (
          <></>
        )}
      </VStack>
    </Center>
  );
}
