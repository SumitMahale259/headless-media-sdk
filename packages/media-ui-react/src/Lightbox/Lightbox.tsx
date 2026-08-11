import React, { type ReactNode } from "react";
import { useLightbox, UseLightboxOptions, UseLightboxResult } from "./useLightbox";

export interface LightboxProps<T> extends UseLightboxOptions<T> {
  children: (state: UseLightboxResult<T>) => ReactNode;
  /**
   * Pass the return value of your own `useLightbox(...)` call when something
   * outside this component (e.g. a Grid item's onClick) needs to call
   * `open(index)`. If omitted, Lightbox manages its own internal state —
   * fine for a self-contained demo, but then nothing outside its subtree
   * can open it.
   */
  state?: UseLightboxResult<T>;
}

/**
 * Usage A — controlled (typical: a Grid click needs to open a Lightbox that
 * lives elsewhere in the tree):
 *
 *   const lightbox = useLightbox({ items: photos });
 *   // Grid item: onClick={() => lightbox.open(i)}
 *   <Lightbox items={photos} state={lightbox}>
 *     {({ isOpen, currentItem, getOverlayProps, getContentProps, getCloseButtonProps, next, prev }) =>
 *       isOpen && currentItem ? (
 *         <div className="overlay" {...getOverlayProps()}>
 *           <div className="content" {...getContentProps()}>
 *             <button {...getCloseButtonProps()}>×</button>
 *             <img src={currentItem.src.large} alt={currentItem.alt} />
 *           </div>
 *         </div>
 *       ) : null
 *     }
 *   </Lightbox>
 *
 * Usage B — uncontrolled: omit `state`, the trigger must live inside the
 * same render-prop closure (rare in practice, useful for quick demos).
 */
export function Lightbox<T>(props: LightboxProps<T>) {
  const { children, state: externalState, ...options } = props;
  // Hooks can't be called conditionally, so we always call useLightbox() —
  // its result is simply discarded when an externalState is supplied.
  const internalState = useLightbox(options);
  const state = externalState ?? internalState;
  return <>{children(state)}</>;
}
