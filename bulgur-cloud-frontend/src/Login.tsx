import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Center, Input, Spacer, VStack, Button, Text } from "native-base";
import { useEffect, useState } from "react";
import { Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLogin } from "./client/auth";
import { runAsync } from "./client/base";
import { FullPageLoading } from "./Loading";
import { RoutingStackParams } from "./routes";
import { useAppSelector } from "./store";
import { pick } from "./utils";

type LoginParams = NativeStackScreenProps<RoutingStackParams, "Login">;

export function Login({ navigation }: LoginParams) {
  const {
    username: loggedInUsername,
    token,
    state: authState,
  } = useAppSelector((selector) =>
    pick(selector.auth, "token", "username", "state"),
  );
  const { doLogin } = useLogin();
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

  useEffect(() => {
    console.log("checking at login", site, loggedInUsername, authState);
    if (loggedInUsername && token && authState === "done") {
      navigation.replace("Dashboard", {
        store: loggedInUsername,
        path: "",
        isFile: false,
      });
    }
  }, [site, loggedInUsername, token, authState]);

  if (!site) {
    return <FullPageLoading />;
  }

  const onLogin = () => {
    runAsync(async () => {
      await doLogin({ username, password, site });

      navigation.replace("Dashboard", {
        store: username,
        path: "",
        isFile: false,
      });
    });
  };

  return (
    <Center justifyContent="center" flexGrow={1}>
      <SafeAreaView>
        <VStack space={3}>
          <Text fontSize="7xl">Bulgur Cloud</Text>
          <Text>Simple and delicious cloud storage and sharing.</Text>
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
            onSubmitEditing={onLogin}
          />

          <Spacer />
          <Spacer />
          <Center>
            <Button
              flexGrow={2}
              maxWidth={48}
              onPress={onLogin}
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
