import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { Portal } from "./Portal";

export type DropdownProps = { children: ReactNode; trigger: ReactNode };

export function Dropdown({ children, trigger }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownTriggerRef = useRef<HTMLDivElement>(null);
  const dropdownItemsRef = useRef<HTMLDivElement>(null);
  const openFocusRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => {
    setIsOpen(false);
  }, [setIsOpen]);

  // Manage focus. When the dropdown gets opened, we put the focus on the first
  // child inside of the dropdown. When the dropdown is closed, we put the focus
  // on the trigger that opened the dropdown in the first place.
  //
  // useEffect delays the processing of this by a frame, which is actually
  // necessary otherwise the focus will not be set.
  useEffect(() => {
    if (isOpen) {
      (openFocusRef.current?.childNodes[0] as HTMLElement)?.focus();
    } else {
      (dropdownTriggerRef.current?.childNodes[0] as HTMLElement)?.focus();
    }
  }, [isOpen]);

  const toggle = useCallback(() => {
    if (isOpen) {
      close();
    } else {
      setIsOpen(true);
    }
  }, [isOpen, close]);

  if (dropdownItemsRef.current && dropdownTriggerRef.current) {
    const triggerRect = dropdownTriggerRef.current.getBoundingClientRect();
    const itemsRect = dropdownItemsRef.current.getBoundingClientRect();
    dropdownItemsRef.current.style.left = `${
      triggerRect.right - itemsRect.width
    }px`;
    dropdownItemsRef.current.style.top = `${triggerRect.bottom}px`;
  }

  return (
    <>
      <div
        onClick={toggle}
        onKeyUp={(e) => {
          if (e.key === "Escape") close();
        }}
        ref={dropdownTriggerRef}
      >
        {trigger}
      </div>
      <Portal>
        <div
          tabIndex={-1}
          ref={dropdownItemsRef}
          onKeyUp={(e) => {
            if (e.key === "Escape") close();
          }}
          onBlur={(e) => {
            if (!dropdownItemsRef.current?.contains(e.relatedTarget as Node)) {
              close();
            }
          }}
          style={{ visibility: isOpen ? "visible" : "hidden" }}
          className={`absolute w-48 p-4`}
        >
          <div
            ref={openFocusRef}
            className="drop-shadow-md bg-base-100 rounded-box p-4 flex flex-col items-start"
          >
            {children}
          </div>
        </div>
      </Portal>
    </>
  );
}
