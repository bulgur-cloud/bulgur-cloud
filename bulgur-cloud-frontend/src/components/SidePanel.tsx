import { useRef, useEffect } from "react";
import { Animated, Platform } from "react-native";

export type SidePanelProps = {
  children?: JSX.Element | JSX.Element[] | string;
  isOpen: boolean;
  side: "left" | "right";
};

/** A sliding panel that can come out of either left or right side of the screen.
 *
 * On the web, this will use a CSS transition to animate the slide.
 * On native, this will use native animations.
 */
export function SidePanel(props: SidePanelProps) {
  if (Platform.OS === "web") {
    return <SlideWeb {...props} />;
  } else {
    return <SlideNative {...props} />;
  }
}

function SlideWeb(props: SidePanelProps) {
  const offsetWhenOpen = props.side === "left" ? 540 : -540;

  return (
    <div
      style={{
        position: "absolute",
        top: 120,
        [props.side]: -540,
        transform: `translateX(${props.isOpen ? offsetWhenOpen : 0}px)`,
        transitionDuration: "0.5s",
        transitionProperty: "transform",
        transitionTimingFunction: "ease-out",
      }}
    >
      {props.children}
    </div>
  );
}

function SlideNative(props: SidePanelProps) {
  const position = useRef(new Animated.Value(-520)).current;
  useEffect(() => {
    Animated.timing(position, {
      toValue: props.isOpen ? 0 : -520,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [props.isOpen]);

  return (
    <Animated.View
      style={{
        position: "absolute",
        top: 120,
        [props.side]: position,
      }}
    >
      {props.children}
    </Animated.View>
  );
}
