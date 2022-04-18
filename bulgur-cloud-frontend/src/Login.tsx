import { Center, Input, Spacer, VStack, Button, Text } from "native-base";
import React, { useEffect, useState } from "react";
import { Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useClient } from "./client";
import { FullPageLoading } from "./Loading";

export function Login() {
  const { login } = useClient();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [site, setSite] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (Platform.OS === "web") {
      if (__DEV__) {
        setSite("http://localhost:8000");
      } else {
        setSite(`${window.location.protocol}//${window.location.host}`);
      }
    } else {
      setSite("");
    }
  }, []);

  if (!site) {
    return <FullPageLoading />;
  }
  
  return (
    <Center justifyContent="center" flexGrow={1}>
      <SafeAreaView>
        <VStack space={3}>
          <Text fontSize="7xl">Bulgur Cloud</Text>
          <Text>
            Simple and delicious cloud storage and sharing.
          </Text>
          <Spacer />
          <Input
            variant="underlined"
            placeholder="Username"
            textContentType={"username"}
            returnKeyType={"next"}
            autoFocus={true}
            onChangeText={setUsername}
          />
          <Input
            variant="underlined"
            placeholder="Password"
            secureTextEntry={true}
            textContentType={"password"}
            passwordRules={
              "minlength: 16; maxlength: 24; required: lower; required: upper; required: digit; required: [-];"
            }
            returnKeyType={"send"}
            onChangeText={setPassword}
            onSubmitEditing={() => {
              login.run({ username, password, site });
            }}
          />

          <Spacer />
          <Spacer />
          <Center>
            <Button
              flexGrow={2}
              maxWidth={48}
              onPress={() => {
                login.run({ username, password, site });
              }}
              bgColor={"primary.800"}
            >
              <Text color={"lightText"} fontWeight={"semibold"}>
                Login
              </Text>
            </Button>
          </Center>
        </VStack>
      </SafeAreaView>
    </Center>
  );
}
