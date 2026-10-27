import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// The page (this repository) and the API (the AreconPy repository, `areconpy-web`) run separately.
// (ARECON_API, default http://127.0.0.1:8000). A hosted build calls VITE_API_URL instead (empty: same address).
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  const proxy = { "/api": env.ARECON_API || "http://127.0.0.1:8000" };
  return {
    plugins: [react()],
    server: { port: 5173, proxy },
    preview: { port: 4173, proxy },
  };
});
