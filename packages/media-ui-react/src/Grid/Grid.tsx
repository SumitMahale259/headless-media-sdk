import React, { type ReactNode } from "react";
import { useGrid, UseGridOptions, UseGridResult } from "./useGrid";

export interface GridProps<T> extends UseGridOptions<T> {
  /**
   * Render prop — the ONLY way this component produces output. Grid itself
   * renders zero DOM of its own beyond what you return here, plus one
   * invisible sentinel node it wires up for you via `sentinelRef`.
   */
  children: (state: UseGridResult<T>) => ReactNode;
}

/**
 * Usage (consumer owns every element and every class name):
 *
 *   <Grid items={photos} hasMore={hasMore} loading={loading} onLoadMore={loadMore}>
 *     {({ getContainerProps, getItemProps, sentinelRef }) => (
 *       <div className="my-grid" {...getContainerProps()}>
 *         {photos.map((p, i) => {
 *           const { key, ...itemProps } = getItemProps(p, i);
 *           return <img key={key} {...itemProps} src={p.src.medium} />;
 *         })}
 *         <div ref={sentinelRef} />
 *       </div>
 *     )}
 *   </Grid>
 */
export function Grid<T>(props: GridProps<T>) {
  const { children, ...options } = props;
  const state = useGrid(options);
  return <>{children(state)}</>;
}
