import { Pressable } from "native-base";
import { Platform } from "react-native";

export type RightClickableProps = {
  action: () => void;
  children?: JSX.Element | JSX.Element[] | string;
};

/** A wrapper to make components "right clickable".
 *
 * This can be used to trigger an action, either when the component is right
 * clicked (on the web) or when it is long-pressed (on the desktop).
 */
export function RightClickable(props: RightClickableProps) {
  return (
    <DivOrSkip
      onContextMenuCapture={(event) => {
        event.preventDefault();
        props.action();
      }}
    >
      <Pressable onLongPress={props.action}>{props.children}</Pressable>
    </DivOrSkip>
  );
}

/** Returns a `div` on web, otherwise an empty component. */
function DivOrSkip(
  props: React.DetailedHTMLProps<
    React.HTMLAttributes<HTMLDivElement>,
    HTMLDivElement
  > & {
    children: JSX.Element;
  },
) {
  if (Platform.OS === "web") {
    return <div {...props} />;
  }
  return props.children;
}
