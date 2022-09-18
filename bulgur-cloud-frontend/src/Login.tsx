import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Center, Input, Spacer, VStack, Button, Text } from "native-base";
import { useEffect, useState } from "react";
import { Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLogin } from "./client/auth";
import { runAsync } from "./client/base";
import { FullPageLoading } from "./Loading";
import { decodeRedirectForRoute, RoutingStackParams } from "./routes";
import { useAppSelector } from "./store";
import { pick, shallowEquals } from "./utils";
import { Banner } from "./components/Banner";

type LoginParams = NativeStackScreenProps<RoutingStackParams, "Login">;

export function Login({ navigation, route }: LoginParams) {
  const {
    username: loggedInUsername,
    access_token,
    state: authState,
  } = useAppSelector(
    (selector) => pick(selector.auth, "access_token", "username", "state"),
    shallowEquals,
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
    if (loggedInUsername && access_token && authState === "done") {
      navigation.replace("Dashboard", {
        store: loggedInUsername,
        path: "",
        isFile: false,
      });
    }
    // We only want this to run ONCE at the start, otherwise it will re-trigger
    // after we login and override the login redirect, if any.
  }, []);

  if (!site) {
    return <FullPageLoading />;
  }

  const redirect = route.params?.redirect;
  const onLogin = () => {
    runAsync(async () => {
      await doLogin({ username, password, site });

      if (redirect) {
        const redirectRoute = decodeRedirectForRoute(redirect);
        console.log("parameter redirect", redirectRoute);
        navigation.replace(redirectRoute.name, redirectRoute.params);
      } else {
        console.log("default redirect");
        navigation.replace("Dashboard", {
          store: username,
          path: "",
          isFile: false,
        });
      }
    });
  };

  const isLoading = authState === "loading";

  return (
    <Center justifyContent="center" flexGrow={1}>
      <SafeAreaView>
        <VStack space={3}>
          <Banner bannerKey="login" />
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
              disabled={isLoading ? true : false}
              flexGrow={2}
              maxWidth={48}
              onPress={onLogin}
              bgColor={isLoading ? "primary.600" : "primary.800"}
            >
              <Text color={"lightText"} fontWeight={"semibold"}>
                {isLoading ? "Logging in" : "Login"}
              </Text>
            </Button>
          </Center>
        </VStack>
      </SafeAreaView>
    </Center>
  );
}
