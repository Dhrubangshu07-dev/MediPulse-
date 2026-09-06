import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    // Proxy API calls to the Express backend during development
    // This avoids CORS issues and the hardcoded http://localhost:5000 URLs
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
  build: {
    // Split vendor chunks for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          // Group heavy animation libs together so they are cached separately
          "vendor-motion":   ["framer-motion"],
          "vendor-react":    ["react", "react-dom", "react-router-dom"],
          "vendor-supabase": ["@supabase/supabase-js"],
          "vendor-tilt":     ["react-parallax-tilt"],
        },
      },
    },
    // Raise the inline asset limit slightly (default 4kB)
    assetsInlineLimit: 8192,
    // Enable minification of CSS
    cssMinify: true,
    // Generate source maps only in dev
    sourcemap: false,
    // Target modern browsers for smaller output
    target: "es2020",
  },
  // Optimize deps pre-bundling for faster cold-starts
  optimizeDeps: {
    include: ["framer-motion", "react-parallax-tilt", "lucide-react"],
  },
});
