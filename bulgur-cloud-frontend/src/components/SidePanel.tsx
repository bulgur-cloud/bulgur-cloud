import {  Icon } from "native-base";
import { useRef, useEffect, useState } from "react";
import { Animated, Platform } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

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
  const [isCollapsed, setIsCollapsed] = useState(false);
  const offsetWhenOpen = props.side === "left" ? 540 : -540;

  useEffect(() => {
    setIsCollapsed(false);
  }, [props.isOpen]);

  let offset = 0;
  if (props.isOpen) {
    offset = offsetWhenOpen;
    if (isCollapsed) {
      offset = (props.side === "left" ? 115 : -115);
    }
  }

  return (
    <div
      style={{
        position: "absolute",
        top: 120,
        [props.side]: -540,
        transform: `translateX(${offset}px)`,
        transitionDuration: "0.5s",
        transitionProperty: "transform",
        transitionTimingFunction: "ease-out",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          [props.side]: 420,
          padding: "1rem",
          zIndex: 99,
          transform: `rotate(${isCollapsed ? 0.5 : 0}turn)`,
          transitionDuration: "0.5s",
          transitionProperty: "transform",
          transitionTimingFunction: "ease-out",
        }}
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <Icon
          as={MaterialIcons}
          name="chevron-left"

          color="black"
          size={8}
        />
      </div>
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

  // TODO: Collapse functionality!

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
