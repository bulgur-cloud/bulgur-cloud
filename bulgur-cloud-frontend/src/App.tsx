import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

import React from "react";
import { NativeBaseProvider, extendTheme, View } from "native-base";
import { Provider } from "react-redux";

import {
  useFonts,
  Bitter_400Regular,
  Bitter_600SemiBold,
  Bitter_400Regular_Italic,
} from "@expo-google-fonts/bitter";

import { registerRootComponent } from "expo";
import { Dashboard } from "./Dashboard";
import { Login } from "./Login";
import { store } from "./store";
import { FullPageLoading } from "./Loading";
import { ErrorDisplay } from "./ErrorDisplay";
import { NavigationContainer } from "@react-navigation/native";
import { isDashboardRoute, LINKING, Stack } from "./routes";
import { urlFileName } from "./fetch";
import { NotFound } from "./NotFound";
import { useEnsureAuthInitialized } from "./client/auth";

function Base() {
  const theme = extendTheme({
    colors: {
      primary: {
        50: "#f2f2f2",
        100: "#d9d9d9",
        200: "#bfbfbf",
        300: "#a6a6a6",
        400: "#8c8c8c",
        500: "#737373",
        600: "#595959",
        700: "#404040",
        800: "#262626",
        900: "#0d0d0d",
      },
    },
    fontConfig: {
      Bitter: {
        400: {
          normal: "Bitter_400Regular",
          italic: "Bitter_400Regular_Italic",
        },
        600: {
          normal: "Bitter_600SemiBold",
        },
      },
    },
    fonts: {
      heading: "Bitter",
      body: "Bitter",
      mono: "Bitter",
    },
    fontSizes: {
      "2xs": 12,
      xs: 14,
      sm: 16,
      md: 18,
      lg: 20,
      xl: 22,
      "2xl": 26,
      "3xl": 32,
      "4xl": 38,
      "5xl": 50,
      "6xl": 62,
      "7xl": 74,
      "8xl": 98,
      "9xl": 130,
    },
  });

  return (
    <SafeAreaProvider>
      <NativeBaseProvider theme={theme}>
        <View paddingX={8} paddingY={4}>
          <Provider store={store}>
            <NavigationContainer
              linking={LINKING}
              fallback={FullPageLoading}
              documentTitle={{
                formatter: (options, route) => {
                  console.log("formatter", route);
                  let name: string | undefined = options?.title;
                  if (isDashboardRoute(route)) {
                    let path: string | undefined = route.params?.path;
                    if (path !== undefined && path !== "") {
                      name = urlFileName(path);
                    } else {
                      name = route.params?.store;
                    }
                  }
                  if (name === undefined) {
                    name = "";
                  } else {
                    name = `${name} - `;
                  }
                  return `${name}Bulgur Cloud`;
                },
              }}
            >
              <App />
              <StatusBar style="auto" />
              <ErrorDisplay />
            </NavigationContainer>
          </Provider>
        </View>
      </NativeBaseProvider>
    </SafeAreaProvider>
  );
}

function App() {
  const [fontsLoaded] = useFonts({
    Bitter_400Regular,
    Bitter_600SemiBold,
    Bitter_400Regular_Italic,
  });
  const state = useEnsureAuthInitialized();

  if (!fontsLoaded || state === "loading" || state === "uninitialized") {
    return <FullPageLoading />;
  }

  return (
    <Stack.Navigator initialRouteName="Login">
      <Stack.Screen name="Login" component={Login} />
      <Stack.Screen name="Dashboard" component={Dashboard} />
      <Stack.Screen name="NotFound" component={NotFound} />
    </Stack.Navigator>
  );
}

registerRootComponent(Base);
