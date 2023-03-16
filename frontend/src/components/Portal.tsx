import { getDocument } from "@/utils/window";
import { ReactNode } from "react";
import { createPortal } from "react-dom";

export function Portal({ children }: { children: ReactNode }) {
  const root = getDocument()?.getElementById("bulgur-portal-root");
  if (!root) {
    return null;
  }

  return createPortal(children, root);
}
