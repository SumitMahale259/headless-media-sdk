import React, { useState } from "react";
import { SearchBar } from "./components/SearchBar";
import { PhotoBrowser } from "./components/PhotoBrowser";
import { VideoReels } from "./components/VideoReels";
import { EventLog } from "./components/EventLog";

type Tab = "photos" | "videos";
const quickSearches = ["Wedding", "Portrait", "Concert", "Sports"];

export default function App() {
  const [tab, setTab] = useState<Tab>("photos");
  const [query, setQuery] = useState("");
  const switchTab = (next: Tab) => {
    setTab(next);
    setQuery("");
  };

  return (
    <div className="app">
      <main id="top">
        <section className="gallery-shell" id="gallery">
          <div className="gallery-heading">
            <div>
              <p className="section-kicker">YOUR VISUAL ARCHIVE</p>
              <h2>
                Find your <em>favourite</em> frames.
              </h2>
            </div>
            <p className="gallery-heading__note">
              Make every image and reel feel within reach.
            </p>
          </div>
          <div className="gallery-tools">
            <div className="tabs" role="tablist" aria-label="Media type">
              <button
                className={tab === "photos" ? "active" : ""}
                onClick={() => switchTab("photos")}
                role="tab"
                aria-selected={tab === "photos"}
              >
                Photos
              </button>
              <button
                className={tab === "videos" ? "active" : ""}
                onClick={() => switchTab("videos")}
                role="tab"
                aria-selected={tab === "videos"}
              >
                Reels
              </button>
            </div>
            <SearchBar
              onSearch={setQuery}
              placeholder={
                tab === "photos"
                  ? "Search moments, people, places..."
                  : "Search reels..."
              }
            />
          </div>
          <div className="quick-searches" aria-label="Suggested searches">
            <span>Try</span>
            {quickSearches.map((term) => (
              <button key={term} onClick={() => setQuery(term)}>
                {term}
              </button>
            ))}
          </div>
          <div className="app__main">
            {tab === "photos" ? (
              <PhotoBrowser query={query} />
            ) : (
              <VideoReels query={query} />
            )}
          </div>
        </section>
      </main>
      {/* <EventLog /> */}
    </div>
  );
}
