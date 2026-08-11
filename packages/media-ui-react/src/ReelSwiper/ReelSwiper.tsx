import React, { type ReactNode } from "react";
import { useReelSwiper, UseReelSwiperOptions, UseReelSwiperResult } from "./useReelSwiper";

export interface ReelSwiperProps<T> extends UseReelSwiperOptions<T> {
  children: (state: UseReelSwiperResult<T>) => ReactNode;
}

/**
 * Usage — consumer supplies the scroll-snap CSS (see using-components skill):
 *
 *   <ReelSwiper items={videos} onActiveChange={(i, v) => trackView(v)}>
 *     {({ getContainerProps, getItemProps, containerRef, itemRef, activeIndex }) => (
 *       <div ref={containerRef} className="reel" {...getContainerProps()}>
 *         {videos.map((v, i) => {
 *           const { key, ...itemProps } = getItemProps(i);
 *           return (
 *             <div key={key} ref={itemRef(i)} className="reel-item" {...itemProps}>
 *               <video src={v.video_files[0]?.link} autoPlay={i === activeIndex} muted loop />
 *             </div>
 *           );
 *         })}
 *       </div>
 *     )}
 *   </ReelSwiper>
 */
export function ReelSwiper<T>(props: ReelSwiperProps<T>) {
  const { children, ...options } = props;
  const state = useReelSwiper(options);
  return <>{children(state)}</>;
}
