import { Link, StackActions } from "@react-navigation/native";
import { RoutingStackParams } from "./routes";

export function BLink<Route extends keyof RoutingStackParams>({
  screen,
  params,
  ...rest
}: {
  screen: Route;
  params: RoutingStackParams[Route];
} & Omit<Parameters<typeof Link>[0], "to" | "action">) {
  return (
    <Link
      to={{
        screen,
        params,
      }}
      action={StackActions.push(screen, params)}
      {...rest}
    />
  );
}
