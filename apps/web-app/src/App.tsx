import React, { useState } from "react";
import { SearchBar } from "./components/SearchBar";
import { PhotoBrowser } from "./components/PhotoBrowser";
import { VideoReels } from "./components/VideoReels";
import { EventLog } from "./components/EventLog";

type Tab = "photos" | "videos";

export default function App() {
  const [tab, setTab] = useState<Tab>("photos");
  const [query, setQuery] = useState("");

  return (
    <div className="app">
      <header className="app__header">
        <h1>Headless Media SDK — Demo</h1>
        <nav className="tabs">
          <button className={tab === "photos" ? "active" : ""} onClick={() => setTab("photos")}>
            Photos
          </button>
          <button className={tab === "videos" ? "active" : ""} onClick={() => setTab("videos")}>
            Videos (Reels)
          </button>
        </nav>
        <SearchBar onSearch={setQuery} placeholder={tab === "photos" ? "Search photos…" : "Search videos…"} />
      </header>

      <main className="app__main">{tab === "photos" ? <PhotoBrowser query={query} /> : <VideoReels query={query} />}</main>

      <EventLog />
    </div>
  );
}
