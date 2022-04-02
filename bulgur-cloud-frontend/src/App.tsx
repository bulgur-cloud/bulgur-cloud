import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

import React from "react";
import { NativeBaseProvider, extendTheme } from "native-base";
import { Provider } from "react-redux";

import {
  useFonts,
  Bitter_200ExtraLight,
  Bitter_400Regular,
  Bitter_600SemiBold,
  Bitter_200ExtraLight_Italic,
  Bitter_400Regular_Italic,
  Bitter_600SemiBold_Italic,
} from "@expo-google-fonts/bitter";

import { registerRootComponent } from "expo";
import { Dashboard } from "./Dashboard";
import { Login } from "./Login";
import { store } from "./store";
import { FullPageLoading } from "./Loading";
import { useClient } from "./client";
import { isString } from "./typeUtils";
import { ErrorDisplay } from "./ErrorDisplay";

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
        200: {
          normal: "Bitter_200ExtraLight",
          italic: "Bitter_200ExtraLight_Italic",
        },
        400: {
          normal: "Bitter_400Regular",
          italic: "Bitter_400Regular_Italic",
        },
        600: {
          normal: "Bitter_600SemiBold",
          italic: "Bitter_600SemiBold_Italic",
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
        <Provider store={store}>
          <App />
          <StatusBar style="auto" />
          <ErrorDisplay />
        </Provider>
      </NativeBaseProvider>
    </SafeAreaProvider>
  );
}

function App() {
  const [fontsLoaded] = useFonts({
    Bitter_200ExtraLight,
    Bitter_400Regular,
    Bitter_600SemiBold,
    Bitter_200ExtraLight_Italic,
    Bitter_400Regular_Italic,
    Bitter_600SemiBold_Italic,
  });
  const { state, username } = useClient();

  if (!fontsLoaded || state === "loading" || state === "uninitialized") {
    return <FullPageLoading />;
  }

  if (isString(username)) {
    return <Dashboard />;
  } else {
    return <Login />;
  }
}

registerRootComponent(Base);
