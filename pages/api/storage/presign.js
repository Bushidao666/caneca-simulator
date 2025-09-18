import { getMinio, getMinioPublic, getBucket, ensureBucket, getPublicBaseUrl } from "../../../src/lib/storage";

export default async function handler(req, res) {
  const minio = getMinio() || getMinioPublic();
  if (!minio) return res.status(200).json({ enabled: false });
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { filename, contentType } = req.body || {};
  if (!filename || !contentType) return res.status(400).json({ error: "filename and contentType are required" });

  await ensureBucket();
  const bucket = getBucket();
  const objectName = `${Date.now()}_${filename.replace(/[^a-zA-Z0-9_.-]/g, "_")}`;
  try {
    console.log("[PRESIGN] bucket=", bucket, "object=", objectName, "contentType=", contentType);
    const policy = await minio.presignedPutObject(bucket, objectName, 60 * 5);
    const publicBase = getPublicBaseUrl();
    const publicUrl = publicBase ? `${publicBase}/${bucket}/${objectName}` : `/${bucket}/${objectName}`;
    console.log("[PRESIGN] url=", policy.substring(0,80)+"...", "publicUrl=", publicUrl);
    return res.status(200).json({ enabled: true, url: policy, publicUrl });
  } catch (e) {
    console.error("[PRESIGN] error:", e);
    return res.status(500).json({ enabled: false, error: "presign failed", details: e?.message });
  }
}

export const config = { api: { bodyParser: { sizeLimit: "5mb" } } };


