import { ReactNode, useCallback, useState } from "react";
import { Portal } from "./Portal";
import { usePopper } from "react-popper";
import { useDisclosure } from "@/utils/hooks/useDisclosure";

export type DropdownProps = { children: ReactNode; trigger: ReactNode };

export function Dropdown({ children, trigger }: DropdownProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [referenceElement, setReferenceElement] = useState<HTMLElement | null>(
    null,
  );
  const [popperElement, setPopperElement] = useState<HTMLElement | null>(null);
  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    modifiers: [{ name: "eventListeners", enabled: isOpen }],
  });
  const [openFocusRef, setOpenFocusRef] = useState<HTMLElement | null>(null);

  // Manage focus. When the dropdown gets opened, we put the focus on the first
  // child inside of the dropdown. When the dropdown is closed, we put the focus
  // on the trigger that opened the dropdown in the first place.
  // setTimeouts are required, otherwise the focus does not actually change.
  const focusChangeOnClose = useCallback(() => {
    setTimeout(() => {
      (referenceElement?.childNodes[0] as HTMLElement)?.focus();
    });
  }, [referenceElement?.childNodes]);
  const focusChangeOnOpen = useCallback(() => {
    setTimeout(() => {
      (openFocusRef as HTMLElement)?.focus();
    });
  }, [openFocusRef]);

  const onToggle = useCallback(() => {
    if (isOpen) {
      onClose();
      focusChangeOnClose();
    } else {
      onOpen();
      focusChangeOnOpen();
    }
  }, [focusChangeOnClose, focusChangeOnOpen, isOpen, onClose, onOpen]);

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
          if (e.key === "Escape") {
            onClose();
            focusChangeOnClose();
          }
        }}
        ref={setReferenceElement}
      >
        {trigger}
      </div>
      <Portal>
        <div
          tabIndex={-1}
          ref={setPopperElement}
          style={styles.popper}
          className={`absolute w-48 clip ${isOpen ? "" : "hidden"}`}
          onKeyUp={(e) => {
            if (e.key === "Escape") {
              onClose();
              focusChangeOnClose();
            }
          }}
          onBlur={(e) => {
            // Delay the execution of the blur handler by a frame, so that the
            // onClick handler executes first if the user is clicking on the
            // dropdown trigger to close the dropdown.
            setTimeout(() => {
              if (!openFocusRef?.contains(e.relatedTarget as Node)) {
                onClose();
                focusChangeOnClose();
              }
            }, 100);
          }}
          {...attributes.popper}
        >
          {/* Placeholder to trap focus within the dropdown */}
          <div
            aria-label="start of options"
            tabIndex={0}
            className="focus:outline-none"
          />
          <div
            ref={setOpenFocusRef}
            className="drop-shadow-md bg-base-100 rounded-box flex flex-col items-start overflow-clip"
            tabIndex={0}
          >
            {children}
          </div>
          {/* Placeholder to trap focus within the dropdown */}
          <div
            aria-label="end of options"
            tabIndex={0}
            className="focus:outline-none"
          />
        </div>
      </Portal>
    </>
  );
}
