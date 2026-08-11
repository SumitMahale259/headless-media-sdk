import React from "react";
import {
  useSearch,
  useCuratedFeed,
  useMediaEvents,
  PexelsPhoto,
} from "media-react";
import { Grid, Lightbox, useLightbox } from "media-ui-react";

export function PhotoBrowser({ query }: { query: string }) {
  const search = useSearch<PexelsPhoto>(query, { type: "photos" });
  const curated = useCuratedFeed<PexelsPhoto>({ type: "photos" });
  const { trackView } = useMediaEvents();
  const feed = query ? search : curated;
  const lightbox = useLightbox<PexelsPhoto>({
    items: feed.items,
    onIndexChange: (_index, item) => item && trackView(item, "lightbox"),
  });

  if (feed.error)
    return (
      <p className="error">
        We couldn't load the photos just now. {feed.error.message}
      </p>
    );

  return (
    <section className="photo-browser" aria-label="Photo collection">
      <header className="photo-browser__header">
        <div>
          <span>CURATED COLLECTION</span>
          <h3>
            {query ? (
              <>
                Results for <em>“{query}”</em>
              </>
            ) : (
              <>
                Visual stories, <em>held close.</em>
              </>
            )}
          </h3>
        </div>
        <p>
          {feed.items.length
            ? `${String(feed.items.length).padStart(2, "0")} moments ready to explore`
            : "Gathering the archive..."}
        </p>
      </header>
      <Grid
        items={feed.items}
        hasMore={feed.hasMore}
        loading={feed.loading || feed.loadingMore}
        onLoadMore={feed.loadMore}
      >
        {({ getContainerProps, getItemProps, sentinelRef }) => (
          <div className="photo-browser__masonry" {...getContainerProps()}>
            {feed.items.map((photo, index) => {
              const { key, ...itemProps } = getItemProps(photo, index);
              return (
                <button
                  key={key}
                  className="photo-browser__card"
                  {...itemProps}
                  onClick={() => lightbox.open(index)}
                  style={{ backgroundColor: photo.avg_color ?? "#a8aea0" }}
                  aria-label={`Open photo by ${photo.photographer}`}
                >
                  <img
                    src={photo.src.medium}
                    alt={photo.alt || `Photo by ${photo.photographer}`}
                    loading={index < 8 ? "eager" : "lazy"}
                  />
                  <span className="photo-browser__number">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="photo-browser__action">
                    View
                  </span>
                  <span className="photo-browser__credit">
                    <small>CAPTURED BY</small>
                    {photo.photographer}
                  </span>
                </button>
              );
            })}
            <div ref={sentinelRef} className="photo-browser__sentinel" />
          </div>
        )}
      </Grid>
      {feed.hasMore && (
        <button
          type="button"
          className="photo-browser__more"
          onClick={feed.loadMore}
          disabled={feed.loadingMore}
        >
          {feed.loadingMore ? "Loading..." : "Discover more"}{" "}
          <span>&rarr;</span>
        </button>
      )}
      {feed.loading && <p className="status">Gathering beautiful moments...</p>}
      {!feed.loading && feed.items.length === 0 && (
        <p className="status">No moments found. Try another search.</p>
      )}
      <Lightbox items={feed.items} state={lightbox}>
        {({
          isOpen,
          currentItem,
          getOverlayProps,
          getContentProps,
          getCloseButtonProps,
          next,
          prev,
          hasNext,
          hasPrev,
        }) =>
          isOpen && currentItem ? (
            <div className="lightbox-overlay" {...getOverlayProps()}>
              <div className="lightbox-content" {...getContentProps()}>
                <button className="lightbox-close" {...getCloseButtonProps()}>
                  &times;
                </button>
                <img src={currentItem.src.large2x} alt={currentItem.alt} />
                <div className="lightbox-meta">
                  <span>
                    Photo by{" "}
                    <a
                      href={currentItem.photographer_url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {currentItem.photographer}
                    </a>
                  </span>
                </div>
                {hasPrev && (
                  <button
                    className="lightbox-nav lightbox-nav--prev"
                    onClick={prev}
                    aria-label="Previous"
                  >
                    &lsaquo;
                  </button>
                )}
                {hasNext && (
                  <button
                    className="lightbox-nav lightbox-nav--next"
                    onClick={next}
                    aria-label="Next"
                  >
                    &rsaquo;
                  </button>
                )}
              </div>
            </div>
          ) : null
        }
      </Lightbox>
    </section>
  );
}
