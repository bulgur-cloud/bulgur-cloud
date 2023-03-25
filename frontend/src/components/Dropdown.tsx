import { ReactNode, useState } from "react";
import { Portal } from "./Portal";
import { usePopper } from "react-popper";
import { useDisclosure } from "@/utils/hooks/useDisclosure";
import { FocusOn } from "react-focus-on";

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

  return (
    <>
      <button ref={setReferenceElement} onClick={onOpen}>
        {trigger}
      </button>
      <Portal>
        {isOpen && (
          <FocusOn
            onClickOutside={onClose}
            onEscapeKey={onClose}
            returnFocus={true}
            scrollLock={false}
          >
            <div
              ref={setPopperElement}
              style={styles.popper}
              className={`absolute w-48 clip ${isOpen ? "" : "hidden"}`}
              {...attributes.popper}
            >
              <div className="drop-shadow-md bg-base-100 rounded-box flex flex-col items-start overflow-clip">
                {children}
              </div>
            </div>
          </FocusOn>
        )}
      </Portal>
    </>
  );
}
