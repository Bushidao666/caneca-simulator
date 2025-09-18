import { getPublicBaseUrl } from "../../../src/lib/storage";

export default async function handler(req, res) {
  const base = getPublicBaseUrl();
  const { url } = req.query;
  if (!base || !url) return res.status(400).end();
  try {
    const allowed = new URL(base);
    const target = new URL(url);
    if (allowed.host !== target.host || allowed.protocol !== target.protocol) return res.status(403).end();
    const resp = await fetch(target.toString());
    if (!resp.ok) return res.status(resp.status).end();
    const contentType = resp.headers.get("content-type") || "application/octet-stream";
    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    const arrayBuffer = await resp.arrayBuffer();
    res.status(200).send(Buffer.from(arrayBuffer));
  } catch (e) {
    res.status(500).end();
  }
}


