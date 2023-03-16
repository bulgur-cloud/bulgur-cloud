import { getDocument } from "@/utils/window";
import { ReactNode, useEffect, useState } from "react";
import { createPortal } from "react-dom";

export function Portal({ children }: { children: ReactNode }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }
  const root = getDocument()?.getElementById("bulgur-portal-root");
  if (!root) {
    throw new Error("Portal root not found");
  }
  return createPortal(children, root);
}
