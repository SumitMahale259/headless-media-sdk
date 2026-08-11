import React from "react";
import ReactDOM from "react-dom/client";
// This app is the ONLY place that imports both media-react (data/auth/events)
// and media-ui-react (display) and wires one to the other.
import { MediaProvider } from "media-react";
import App from "./App";
import "./styles.css";

const apiKey = import.meta.env.VITE_PEXELS_API_KEY as string | undefined;

if (!apiKey) {
  // Fail loud in dev rather than silently 401-ing on every request.
  console.warn(
    "[web-app] VITE_PEXELS_API_KEY is not set. Copy .env.example to .env and add a free key from https://www.pexels.com/api/."
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <MediaProvider apiKey={apiKey ?? ""}>
      <App />
    </MediaProvider>
  </React.StrictMode>
);
