import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./shared/foundation/styles/kit.css";
import "./styles.css";
import "./styles/shell.css";
import "./styles/page-one.css";
import "./styles/page-two.css";

const root = document.getElementById("root");
if (!root) throw new Error("Missing app root element.");

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
