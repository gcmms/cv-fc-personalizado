export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-linkding-token");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    return res.status(200).end();
  }

  const target = new URL(req.url, "http://localhost").searchParams.get("url");
  if (!target || !/^https?:\/\//i.test(target)) {
    return res.status(400).json({ error: "Parâmetro url inválido" });
  }

  try {
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
    return res.status(upstream.status).json({ contentType, body });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Erro ao buscar recurso" });
  }
}
