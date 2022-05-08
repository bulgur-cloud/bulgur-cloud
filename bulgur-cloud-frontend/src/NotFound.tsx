import { useNavigation } from "@react-navigation/native";
import { Button, Center, Spacer, Text, VStack } from "native-base";

export function NotFound() {
  const navigation = useNavigation();

  return (
    <Center>
      <VStack space={4}>
        <Text>
          What you are looking for no longer exists, or maybe never existed.
        </Text>
        <Spacer />
        {navigation.canGoBack() ? (
          <Button
            onPress={() => {
              navigation.goBack();
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
