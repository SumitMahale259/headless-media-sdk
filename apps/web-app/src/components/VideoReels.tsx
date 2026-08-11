import React from "react";
import {
  useSearch,
  useCuratedFeed,
  useMediaEvents,
  PexelsVideo,
} from "media-react";
import { ReelSwiper } from "media-ui-react";

export function VideoReels({ query }: { query: string }) {
  const search = useSearch<PexelsVideo>(query, { type: "videos" });
  const curated = useCuratedFeed<PexelsVideo>({ type: "videos" });
  const { trackView } = useMediaEvents();
  const feed = query ? search : curated;

  if (feed.error)
    return (
      <p className="error">
        We couldn't load the reels just now. {feed.error.message}
      </p>
    );
  if (feed.loading) return <p className="status">Loading reels...</p>;
  if (feed.items.length === 0)
    return <p className="status">No reels found. Try another search.</p>;

  return (
    <ReelSwiper
      items={feed.items}
      onActiveChange={(_i, item) => item && trackView(item, "reels")}
    >
      {({
        getContainerProps,
        getItemProps,
        containerRef,
        itemRef,
        activeIndex,
        goNext,
        goPrev,
      }) => {
        const activeVideo = feed.items[activeIndex];
        return (
          <section className="reel-gallery" aria-label="Reel stories">
            <header className="reel-gallery__header">
              <div>
                <span className="reel-gallery__eyebrow">MOTION COLLECTION</span>
                <h3>
                  Watch the <em>moment.</em>
                </h3>
              </div>
              <div className="reel-gallery__count">
                <span>REEL</span>
                <strong>{String(activeIndex + 1).padStart(2, "0")}</strong>
                <em>/ {String(feed.items.length).padStart(2, "0")}</em>
              </div>
            </header>
            <div
              ref={containerRef}
              className="reel-gallery__stream"
              {...getContainerProps()}
            >
              {feed.items.map((video, i) => {
                const { key, ...itemProps } = getItemProps(i);
                const file =
                  video.video_files.find((f) => f.quality === "sd") ??
                  video.video_files[0];
                return (
                  <article
                    key={key}
                    ref={itemRef(i)}
                    className="reel-gallery__slide"
                    {...itemProps}
                  >
                    <video
                      src={file?.link}
                      poster={video.image}
                      autoPlay={i === activeIndex}
                      muted
                      loop
                      playsInline
                      controls
                      className="reel-gallery__video"
                    />
                  </article>
                );
              })}
            </div>
            <footer className="reel-gallery__footer">
              <p>
                Currently showing a visual story by
                <strong> {activeVideo?.user.name ?? "our community"}</strong>
              </p>
              <div className="reel-gallery__nav">
                <button onClick={goPrev} aria-label="Previous reel">
                  Previous
                </button>
                <button onClick={goNext} aria-label="Next reel">
                  Next
                </button>
              </div>
              {feed.hasMore && (
                <button
                  className="reel-gallery__more"
                  onClick={feed.loadMore}
                  disabled={feed.loadingMore}
                >
                  {feed.loadingMore ? "Loading..." : "Load more stories"}
                </button>
              )}
            </footer>
          </section>
        );
      }}
    </ReelSwiper>
  );
}
