import { ReactNode } from "react";
import { createPortal } from "react-dom";

export function Portal({ children }: { children: ReactNode }) {
  const root = document.getElementById("bulgur-portal-root");
  if (!root) {
    throw new Error(
      "Portal root not found! Did you remove it from _document.tsx?",
    );
  }
  return createPortal(children, root);
}
