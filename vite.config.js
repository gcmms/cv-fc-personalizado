import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
  server: {
    // Middleware para desenvolvimento: proxy local para evitar CORS enquanto roda `npm run dev`
    middlewareMode: false,
    fs: { strict: true },
    configureServer(server) {
      server.middlewares.use("/api/fetch", async (req, res, next) => {
        try {
          const target = new URL(req.url, "http://localhost").searchParams.get("url");
          if (!target || !/^https?:\/\//i.test(target)) {
            res.statusCode = 400;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "Parâmetro url inválido" }));
            return;
          }
          const headers = {};
          const tokenHeader = req.headers["x-linkding-token"] || req.headers["authorization"];
          if (tokenHeader) {
            headers.Authorization = tokenHeader.startsWith("Token ") ? tokenHeader : `Token ${tokenHeader}`;
          }
          const upstream = await fetch(target, { headers });
          const contentType = upstream.headers.get("content-type") || "";
          const body = contentType.includes("application/json") ? JSON.stringify(await upstream.json()) : await upstream.text();

          res.setHeader("Access-Control-Allow-Origin", "*");
          res.setHeader("Content-Type", "application/json");
          res.statusCode = upstream.status;
          res.end(JSON.stringify({ contentType, body }));
        } catch (err) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: err.message || "Erro ao buscar recurso" }));
        }
      });
    }
  }
});
