import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "leaflet/dist/leaflet.css";

// Deployment trace marker for prod verification
console.error("FRONTEND BUILD ID:", "2026-01-13-ADMIN-NAV-TEST");
// Temporary proof: ensure new bundle is loaded
alert("NEW FRONTEND BUILD LOADED");

createRoot(document.getElementById("root")!).render(<App />);
