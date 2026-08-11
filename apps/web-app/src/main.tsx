import React from "react";
import ReactDOM from "react-dom/client";
// This app is the ONLY place that imports both media-react (data/auth/events)
// and media-ui-react (display) and wires one to the other.
import { MediaProvider } from "media-react";
import App from "./App";
import "./styles.css";

const apiKey = import.meta.env.VITE_PEXELS_API_KEY as string | undefined;

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <MediaProvider apiKey={apiKey ?? ""}>
      <App />
    </MediaProvider>
  </React.StrictMode>
);
