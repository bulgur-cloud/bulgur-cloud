import {
  getStateFromPath,
  getPathFromState,
  Route,
  useNavigation,
  NavigationProp,
} from "@react-navigation/native";
import {
  createNativeStackNavigator,
  NativeStackScreenProps,
} from "@react-navigation/native-stack";
import { Base64 } from "js-base64";

export type RoutingStackParams = {
  Login: undefined | {
    redirect: string;
  };
  Dashboard: {
    store: string;
    path: string;
    isFile: boolean;
  };
  NotFound: undefined;
};

export const Stack: any = createNativeStackNavigator<RoutingStackParams>();
export const LINKING = {
  prefixes: ["bulgur-cloud://"],
  config: {
    screens: {
      Login: "",
      Dashboard: "s/:store/",
      NotFound: "*",
    },
  },
  getStateFromPath: (path: string, config: any) => {
    console.log("getStateFromPath", path);
    if (path.startsWith("/s/")) {
      const matches =
        /^[/]s[/](?<store>[^/]+)[/](?<path>.*?)(?<trailingSlash>[/]?)$/.exec(
          decodeURI(path),
        );
      const out = {
        routes: [
          {
            name: "Dashboard",
            path,
            params: {
              store: matches?.groups?.store,
              path: matches?.groups?.path,
              isFile:
                matches?.groups?.trailingSlash === "" &&
                matches?.groups?.path !== "",
            },
          },
        ],
      };
      return out;
    }
    const state = getStateFromPath(path, config);
    console.log("getStateFromPath state", state);
    return state;
  },
  getPathFromState: (state: any, config: any) => {
    const route = state.routes[state.index ?? (state.routes.length - 1)];
    console.log("getPathFromState", state, config);
    if (isDashboardRoute(route)) {
      const params = route.params;
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
export type DashboardRoute = Route<
  "Dashboard",
  RoutingStackParams["Dashboard"]
>;

export function isDashboardRoute(
  route?: Route<string, any>,
): route is DashboardRoute {
  return route?.name === "Dashboard";
}

export function useAppNavigation() {
  return useNavigation<NavigationProp<RoutingStackParams>>();
}

export function encodeRouteForRedirect(route: { name: string; params: object | undefined}) {
  return Base64.encode(
    JSON.stringify(route)
  );
}

export function decodeRedirectForRoute(redirect: string): { name: keyof RoutingStackParams; params: RoutingStackParams[keyof RoutingStackParams] } {
  // TODO: Add some validation here. Not critical, but would be nice to catch
  // any bad redirects early in case someone partially copies and pastes a URL
  // with a redirect or routes change between versions and someone had the old
  // version.
  return JSON.parse(Base64.decode(redirect));
}
