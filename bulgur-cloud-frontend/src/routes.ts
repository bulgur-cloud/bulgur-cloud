import { getStateFromPath, getPathFromState } from "@react-navigation/native";
import {
  createNativeStackNavigator,
  NativeStackScreenProps,
} from "@react-navigation/native-stack";

export type RoutingStackParams = {
  Login: undefined;
  Dashboard: {
    store: string;
    path: string;
    isFile: boolean;
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
  getStateFromPath: (path: string, config: any) => {
    if (path.startsWith("/s/")) {
      const matches =
        /^[/]s[/](?<store>[^/]+)[/](?<path>.*)(?<trailingSlash>[/]?)$/.exec(
          path,
        );
      const out = {
        routes: [
          {
            name: "Dashboard",
            path,
            params: {
              store: matches?.groups?.store,
              path: matches?.groups?.path,
              isFile: matches?.groups?.trailingSlash === "",
            },
          },
        ],
      };
      return out;
    }
    const state = getStateFromPath(path, config);
    return state;
  },
  getPathFromState: (state: any, config: any) => {
    const route = state.routes[0];
    if (route?.name === "Dashboard") {
      const params: RoutingStackParams["Dashboard"] = route.params;
      let path = params.path;
      // If it's a folder, make sure it has a trailing slash
      if (!params.isFile && !path.endsWith("/") && path !== "") {
        path = `${path}/`;
      }
      return `/s/${params.store}/${path}`;
    }
    return getPathFromState(state, config);
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
