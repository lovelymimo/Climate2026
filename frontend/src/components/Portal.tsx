import { createPortal } from "react-dom";
import type { ReactNode } from "react";

type PortalProps = {
  children: ReactNode;
};

export function Portal({ children }: PortalProps) {
  return createPortal(children, document.body);
}
