import db, { ensureMugsTable, query } from "../../../src/lib/db";

export default async function handler(req, res) {
  console.log("[MUGS_INDEX] method=", req.method, "query=", req.query);
  try {
    await ensureMugsTable();
  } catch (e) {
    console.error("[MUGS_INDEX] ensureMugsTable failed:", e?.message);
    return res.status(500).json({ error: "DB init failed" });
  }

  if (req.method === "GET") {
    const { rows } = await query("select * from mugs order by id asc");
    console.log("[MUGS_INDEX][GET] rows=", rows?.length);
    return res.status(200).json(rows);
  }

  if (req.method === "POST") {
    const { name, color = "#ffffff", texture = null, settings = {} } = req.body || {};
    console.log("[MUGS_INDEX][POST] body=", { name, color, hasTexture: !!texture, settings });
    if (!name) return res.status(400).json({ error: "name is required" });
    const { rows } = await query(
      "insert into mugs (name, color, texture, settings) values ($1, $2, $3, $4::jsonb) returning *",
      [name, color, texture, JSON.stringify(settings || {})]
    );
    console.log("[MUGS_INDEX][POST] created id=", rows?.[0]?.id);
    return res.status(201).json(rows[0]);
  }

  return res.status(405).json({ error: "Method not allowed" });
}

export const config = {
  api: { bodyParser: { sizeLimit: "50mb" } }
};


