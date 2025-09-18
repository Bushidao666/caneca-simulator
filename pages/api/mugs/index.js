import db, { ensureMugsTable, query } from "../../../src/lib/db";

export default async function handler(req, res) {
  try {
    await ensureMugsTable();
  } catch (e) {
    return res.status(500).json({ error: "DB init failed" });
  }

  if (req.method === "GET") {
    const { rows } = await query("select * from mugs order by id asc");
    return res.status(200).json(rows);
  }

  if (req.method === "POST") {
    const { name, color = "#ffffff", texture = null } = req.body || {};
    if (!name) return res.status(400).json({ error: "name is required" });
    const { rows } = await query(
      "insert into mugs (name, color, texture) values ($1, $2, $3) returning *",
      [name, color, texture]
    );
    return res.status(201).json(rows[0]);
  }

  return res.status(405).json({ error: "Method not allowed" });
}

export const config = {
  api: { bodyParser: { sizeLimit: "50mb" } }
};


