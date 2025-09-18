import { ensureMugsTable, query } from "../../../src/lib/db";

export const config = {
  api: { bodyParser: { sizeLimit: "50mb" } }
};

export default async function handler(req, res) {
  const { id } = req.query;
  console.log("[MUGS_ID] method=", req.method, "id=", id);
  try {
    await ensureMugsTable();
  } catch (e) {
    console.error("[MUGS_ID] ensureMugsTable failed:", e?.message);
    return res.status(500).json({ error: "DB init failed" });
  }

  if (req.method === "PUT") {
    try {
      const { name, color, texture, settings } = req.body || {};
      console.log("[MUGS_ID][PUT] body=", { id, name, color, textureLength: texture?.length, settings });
      
      const { rows } = await query(
        `update mugs set
           name = coalesce($1, name),
           color = coalesce($2, color),
           texture = $3,
           settings = coalesce($4::jsonb, settings),
           updated_at = now()
         where id = $5 returning *`,
        [name ?? null, color ?? null, texture ?? null, settings ? JSON.stringify(settings) : null, id]
      );
      console.log("[MUGS_ID][PUT] updated=", rows?.[0]);
      return rows[0] ? res.status(200).json(rows[0]) : res.status(404).json({ error: "Not found" });
    } catch (error) {
      console.error("[MUGS_ID][PUT] error:", error);
      return res.status(500).json({ error: "Database error", details: error.message });
    }
  }

  if (req.method === "DELETE") {
    const result = await query("delete from mugs where id = $1", [id]);
    return res.status(204).end();
  }

  if (req.method === "GET") {
    const { rows } = await query("select * from mugs where id = $1", [id]);
    console.log("[MUGS_ID][GET] rows=", rows?.length);
    return rows[0] ? res.status(200).json(rows[0]) : res.status(404).json({ error: "Not found" });
  }

  return res.status(405).json({ error: "Method not allowed" });
}


