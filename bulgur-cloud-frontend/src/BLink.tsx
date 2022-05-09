import * as React from "react";
import { Link, StackActions, useLinkTo } from "@react-navigation/native";
import { TextProps } from "react-native";
import { RoutingStackParams } from "./routes";

export function BLink<Route extends keyof RoutingStackParams>(
  props: TextProps & {
    screen: Route;
    params: RoutingStackParams[Route];
  },
) {
  return (
    <Link
      to={{
        screen: props.screen,
        params: props.params,
      }}
      action={StackActions.push(props.screen, props.params)}
    >
      {props.children}
    </Link>
  );
}
