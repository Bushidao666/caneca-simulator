import { ensureMugsTable, query } from "../../../src/lib/db";

export const config = {
  api: { bodyParser: { sizeLimit: "50mb" } }
};

export default async function handler(req, res) {
  const { id } = req.query;
  try {
    await ensureMugsTable();
  } catch (e) {
    return res.status(500).json({ error: "DB init failed" });
  }

  if (req.method === "PUT") {
    try {
      const { name, color, texture } = req.body || {};
      console.log("Updating mug:", { id, name, color, textureLength: texture?.length });
      
      const { rows } = await query(
        `update mugs set
           name = coalesce($1, name),
           color = coalesce($2, color),
           texture = $3,
           updated_at = now()
         where id = $4 returning *`,
        [name ?? null, color ?? null, texture ?? null, id]
      );
      return rows[0] ? res.status(200).json(rows[0]) : res.status(404).json({ error: "Not found" });
    } catch (error) {
      console.error("Error updating mug:", error);
      return res.status(500).json({ error: "Database error", details: error.message });
    }
  }

  if (req.method === "DELETE") {
    const result = await query("delete from mugs where id = $1", [id]);
    return res.status(204).end();
  }

  if (req.method === "GET") {
    const { rows } = await query("select * from mugs where id = $1", [id]);
    return rows[0] ? res.status(200).json(rows[0]) : res.status(404).json({ error: "Not found" });
  }

  return res.status(405).json({ error: "Method not allowed" });
}


