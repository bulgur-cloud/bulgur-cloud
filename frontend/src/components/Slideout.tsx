import { ReactNode, useMemo } from "react";
import { Portal } from "./Portal";

export type SlideoutProps = {
  children: ReactNode;
  /** The side that the slideout will come out of. */
  side: "left" | "right" | "top" | "bottom";
  /** Toggle whether the slideout is open or not. */
  isOpen: boolean;
  /** Pick where on the screen the slideout will be positioned.
   *
   * By default, it will be centered on the screen. You can use this to move it
   * up higher or lower.
   */
  positionPercent?: number;
  /** Need Internet Explorer support? Want to push the slideout partially off the screen?
   *
   * If this is set to true, the slideout won't be clamped to stay on the
   * screen. For example, a slideout with `{ side: "left", positionPercent: 0, dontClamp: true }`
   * will have the top half of it sticking off the top of the screen.
   *
   * Going by caniuse.com, enabling this is required if you need to support IE9 through 11,
   * "UC Browser for Android", or "QQ Browser".
   */
  dontClamp?: boolean;
};

export function Slideout({
  children,
  side,
  isOpen = false,
  positionPercent = 50,
  dontClamp = false,
}: SlideoutProps) {
  /** We keep the drawer in-view when it's open, and push it out of view when closed. */
  const translate = useMemo(() => {
    const sideSize = side === "left" || side === "right" ? "vh" : "vw";
    // Center it on the side of the screen
    const offsideTranslateValue = `calc(-50% + ${
      positionPercent - 50
    }${sideSize})`;
    // If we do want to clamp, add that
    const offsideTranslate = dontClamp
      ? offsideTranslateValue
      : `clamp(-50${sideSize}, ${offsideTranslateValue}, calc(50${sideSize} - 100%))`;

    if (isOpen) {
      switch (side) {
        case "left":
        case "right":
          return `translate(0px, ${offsideTranslate})`;
        case "top":
        case "bottom":
          return `translate(${offsideTranslate}, 0px)`;
      }
    }
    switch (side) {
      case "left":
        return `translate(-100%, ${offsideTranslate})`;
      case "right":
        return `translate(100%, ${offsideTranslate})`;
      case "top":
        return `translate(${offsideTranslate}, -100%)`;
      case "bottom":
        return `translate(${offsideTranslate}, 100%)`;
    }
  }, [side, positionPercent, dontClamp, isOpen]);
  /** We need to set a second side for the drawer to position it on the screen. It's 2D after all!
   *
   * In particular, we're centering it on the screen.
   */
  const [offSide, offSideValue] = useMemo(() => {
    switch (side) {
      case "left":
        return ["top", "50%"] as const;
      case "right":
        return ["top", "50%"] as const;
      case "top":
        return ["left", "50%"] as const;
      case "bottom":
        return ["left", "50%"] as const;
    }
  }, [side]);

  return (
    <Portal>
      <div
        style={{
          [side]: 0,
          [offSide]: offSideValue,
          transform: translate,
        }}
        className="fixed transition-all"
      >
        {children}
      </div>
    </Portal>
  );
}
