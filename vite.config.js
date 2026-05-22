import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: false,
    // Serve index.html for all routes so refresh works in dev
    historyApiFallback: true,
  },
});
