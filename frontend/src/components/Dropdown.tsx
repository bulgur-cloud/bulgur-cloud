import { useDisclosure } from "@/utils/hooks/useDisclosure";
import { debounce } from "debounce";
import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { Portal } from "./Portal";

export type DropdownProps = { children: ReactNode; trigger: ReactNode };

export function Dropdown({ children, trigger }: DropdownProps) {
  const { isOpen, onClose, onToggle } = useDisclosure(false);
  const dropdownTriggerRef = useRef<HTMLDivElement>(null);
  const dropdownItemsRef = useRef<HTMLDivElement>(null);
  const openFocusRef = useRef<HTMLDivElement>(null);

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
        onClick={(e) => {
          // Single click, enter button, or the first click of a double click
          if (e.detail === 1 || e.detail === 0 || e.buttons === 1) {
            onToggle();
          }
        }}
        onKeyUp={(e) => {
          if (e.key === "Escape") onClose();
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
            if (e.key === "Escape") onClose();
          }}
          onBlur={(e) => {
            // Delay the execution of the blur handler by a frame, so that the
            // onClick handler executes first if the user is clicking on the
            // dropdown trigger to close the dropdown.
            setTimeout(() => {
              if (
                !dropdownItemsRef.current?.contains(e.relatedTarget as Node)
              ) {
                onClose();
              }
            });
          }}
          style={{ visibility: isOpen ? "visible" : "hidden" }}
          className={`absolute w-48 clip`}
        >
          <div
            ref={openFocusRef}
            className="drop-shadow-md bg-base-100 rounded-box flex flex-col items-start overflow-clip"
          >
            {children}
          </div>
        </div>
      </Portal>
    </>
  );
}
