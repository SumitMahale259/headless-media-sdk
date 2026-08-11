import React from "react";
import { useSearch, useCuratedFeed, useMediaEvents, PexelsVideo } from "media-react";
import { ReelSwiper } from "media-ui-react";

export function VideoReels({ query }: { query: string }) {
  const search = useSearch<PexelsVideo>(query, { type: "videos" });
  const curated = useCuratedFeed<PexelsVideo>({ type: "videos" });
  const { trackView } = useMediaEvents();

  const feed = query ? search : curated;

  if (feed.error) return <p className="error">Couldn't load videos: {feed.error.message}</p>;
  if (feed.loading) return <p className="status">Loading…</p>;
  if (feed.items.length === 0) return <p className="status">No results.</p>;

  return (
    <ReelSwiper items={feed.items} onActiveChange={(_i, item) => item && trackView(item, "reels")}>
      {({ getContainerProps, getItemProps, containerRef, itemRef, activeIndex, goNext, goPrev }) => (
        <div ref={containerRef} className="reel-container" {...getContainerProps()}>
          {feed.items.map((video, i) => {
            const { key, ...itemProps } = getItemProps(i);
            const file = video.video_files.find((f) => f.quality === "sd") ?? video.video_files[0];
            return (
              <div key={key} ref={itemRef(i)} className="reel-item" {...itemProps}>
                <video
                  src={file?.link}
                  poster={video.image}
                  autoPlay={i === activeIndex}
                  muted
                  loop
                  playsInline
                  controls
                  className="reel-video"
                />
                <div className="reel-meta">
                  {video.user.name} · {video.duration}s
                </div>
              </div>
            );
          })}
          <div className="reel-controls">
            <button onClick={goPrev} aria-label="Previous video">
              ↑
            </button>
            <button onClick={goNext} aria-label="Next video">
              ↓
            </button>
          </div>
          {feed.hasMore && (
            <button className="reel-load-more" onClick={feed.loadMore} disabled={feed.loadingMore}>
              {feed.loadingMore ? "Loading…" : "Load more"}
            </button>
          )}
        </div>
      )}
    </ReelSwiper>
  );
}
