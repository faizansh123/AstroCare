import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

// Serves POST /api/explain during `npm run dev` with the same code Vercel runs (server/explain.ts).
// The key is read from .env on the server side only. Nothing is prefixed VITE_, so it never reaches the bundle (NFR-09).
function devExplainApi(env: Record<string, string>): Plugin {
  return {
    name: "astrocare-dev-explain-api",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use("/api/explain", async (req, res) => {
        const send = (code: number, body: unknown) => {
          res.statusCode = code;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(body));
        };
        if (req.method !== "POST") return send(405, { ai: null, reason: "Method not allowed" });
        let raw = "";
        for await (const chunk of req) raw += chunk;
        let body: unknown;
        try { body = JSON.parse(raw); } catch { return send(400, { ai: null, reason: "Invalid JSON" }); }
        const { explain } = await server.ssrLoadModule("/server/explain.ts");
        const out = await explain(body, { apiKey: env.GEMINI_API_KEY, model: env.GEMINI_MODEL, ip: req.socket.remoteAddress });
        send(out.httpStatus, out.body);
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "GEMINI_"); // server-only vars; not exposed to client code
  return { plugins: [react(), devExplainApi(env)] };
});
