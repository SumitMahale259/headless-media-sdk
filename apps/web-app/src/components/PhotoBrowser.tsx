import React from "react";
import { useSearch, useCuratedFeed, useMediaEvents, PexelsPhoto } from "media-react";
import { Grid, Lightbox, useLightbox } from "media-ui-react";

/**
 * The only file that imports BOTH packages for the photo flow: media-react
 * supplies data/auth/events, media-ui-react supplies display behavior. All
 * markup, classNames, and layout below is this app's own — media-ui-react
 * shipped none of it.
 */
export function PhotoBrowser({ query }: { query: string }) {
  const search = useSearch<PexelsPhoto>(query, { type: "photos" });
  const curated = useCuratedFeed<PexelsPhoto>({ type: "photos" });
  const { trackView, trackDownload } = useMediaEvents();

  const feed = query ? search : curated;
  const lightbox = useLightbox<PexelsPhoto>({
    items: feed.items,
    onIndexChange: (_i, item) => item && trackView(item, "lightbox"),
  });

  if (feed.error) {
    return <p className="error">Couldn't load photos: {feed.error.message}</p>;
  }

  return (
    <>
      <Grid items={feed.items} hasMore={feed.hasMore} loading={feed.loading || feed.loadingMore} onLoadMore={feed.loadMore}>
        {({ getContainerProps, getItemProps, sentinelRef }) => (
          <div className="photo-grid" {...getContainerProps()}>
            {feed.items.map((photo, i) => {
              const { key, ...itemProps } = getItemProps(photo, i);
              return (
                <button
                  key={key}
                  className="photo-grid__item"
                  {...itemProps}
                  onClick={() => lightbox.open(i)}
                  style={{ backgroundColor: photo.avg_color ?? "#222" }}
                  aria-label={`Open photo by ${photo.photographer}`}
                >
                  <img src={photo.src.medium} alt={photo.alt || `Photo by ${photo.photographer}`} loading="lazy" />
                </button>
              );
            })}
            <div ref={sentinelRef} className="sentinel" />
          </div>
        )}
      </Grid>
      {feed.hasMore && (
        <button
          type="button"
          onClick={feed.loadMore}
          disabled={feed.loadingMore}
        >
          {feed.loadingMore ? "Loading…" : "Load more"}
        </button>
      )}

      {feed.loading && <p className="status">Loading…</p>}
      {!feed.loading && feed.items.length === 0 && <p className="status">No results.</p>}

      <Lightbox items={feed.items} state={lightbox}>
        {({ isOpen, currentItem, getOverlayProps, getContentProps, getCloseButtonProps, next, prev, hasNext, hasPrev }) =>
          isOpen && currentItem ? (
            <div className="lightbox-overlay" {...getOverlayProps()}>
              <div className="lightbox-content" {...getContentProps()}>
                <button className="lightbox-close" {...getCloseButtonProps()}>
                  ×
                </button>
                <img src={currentItem.src.large2x} alt={currentItem.alt} />
                <div className="lightbox-meta">
                  <span>
                    Photo by{" "}
                    <a href={currentItem.photographer_url} target="_blank" rel="noreferrer">
                      {currentItem.photographer}
                    </a>
                  </span>
                  <button onClick={() => trackDownload(currentItem, "large2x")}>Download</button>
                </div>
                {hasPrev && (
                  <button className="lightbox-nav lightbox-nav--prev" onClick={prev} aria-label="Previous">
                    ‹
                  </button>
                )}
                {hasNext && (
                  <button className="lightbox-nav lightbox-nav--next" onClick={next} aria-label="Next">
                    ›
                  </button>
                )}
              </div>
            </div>
          ) : null
        }
      </Lightbox>
    </>
  );
}
