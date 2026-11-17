import { resolve } from "node:path";
import { defineConfig, loadEnv } from "vite";
import { put, get, list } from "@vercel/blob";
import { handleSignup } from "./server/signup.js";

export default defineConfig(({ mode }) => {
  const env = { ...loadEnv(mode, process.cwd(), ""), ...process.env };
  return {
    build: {
      rollupOptions: {
        input: {
          main: resolve(import.meta.dirname, "index.html"),
          privacy: resolve(import.meta.dirname, "privacidad/index.html"),
        },
      },
    },
    server: { host: "0.0.0.0", allowedHosts: ["terminal.local"] },
    plugins: [
      {
        name: "local-signup-api",
        configureServer(server) {
          server.middlewares.use("/api/signup", async (req, res) => {
            const result = await handleSignup(req, { env, put, get, list });
            res.writeHead(result.status, {
              "Content-Type": "application/json",
              "Cache-Control": "no-store",
              ...result.headers,
            });
            res.end(JSON.stringify(result.body));
          });
        },
      },
    ],
  };
});
