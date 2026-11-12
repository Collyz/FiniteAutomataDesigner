"use client";

import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
} from "@floating-ui/react";

/**
 * Positions a dropdown menu relative to its trigger button and keeps it
 * inside the viewport (flips above when there's no room below and shifts
 * horizontally to stay on screen).
 */
export function useDropdownFloating(open: boolean) {
  return useFloating({
    open,
    placement: "bottom-start",
    strategy: "fixed",
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(8),
      flip({ padding: 8 }),
      shift({ padding: 8 }),
      // No `size` middleware: capping maxHeight to the space below makes the
      // menu always "fit" there, which stops `flip` from ever flipping it up.
    ],
  });
}
