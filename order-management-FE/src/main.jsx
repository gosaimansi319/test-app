// import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { Toaster } from "react-hot-toast";
import store from "./store/store.js";
import { Provider } from "react-redux";
import { ThemeProvider } from "@material-tailwind/react";

createRoot(document.getElementById("root")).render(
  // <StrictMode>
    <Provider store={store}>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </Provider>
  // </StrictMode>
);
