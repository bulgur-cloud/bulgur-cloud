import {
  createNativeStackNavigator,
  NativeStackScreenProps,
} from "@react-navigation/native-stack";

export type RoutingStackParams = {
  Login: undefined;
  Dashboard: {
    store: string;
    path: string;
  };
};

export const Stack: any = createNativeStackNavigator<RoutingStackParams>();
export const LINKING = {
  prefixes: ["bulgur-cloud://"],
  config: {
    screens: {
      Login: "",
      Dashboard: "s/:store/",
    },
  },
};

export type DashboardParams = NativeStackScreenProps<
  RoutingStackParams,
  "Dashboard"
>;

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RoutingStackParams {}
  }
}
