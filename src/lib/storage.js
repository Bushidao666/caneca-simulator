import { Client } from "minio";

export function getMinio() {
  const endPoint = process.env.MINIO_ENDPOINT;
  const port = process.env.MINIO_PORT ? Number(process.env.MINIO_PORT) : 9000;
  const useSSL = process.env.MINIO_USE_SSL === "true";
  const accessKey = process.env.MINIO_ACCESS_KEY;
  const secretKey = process.env.MINIO_SECRET_KEY;
  if (!endPoint || !accessKey || !secretKey) return null;
  return new Client({ endPoint, port, useSSL, accessKey, secretKey });
}

export function getBucket() {
  return process.env.MINIO_BUCKET || "canecas";
}

export function getPublicBaseUrl() {
  if (process.env.MINIO_PUBLIC_URL) return process.env.MINIO_PUBLIC_URL.replace(/\/$/, "");
  const endPoint = process.env.MINIO_ENDPOINT;
  const port = process.env.MINIO_PORT ? Number(process.env.MINIO_PORT) : 9000;
  const useSSL = process.env.MINIO_USE_SSL === "true";
  if (!endPoint) return "";
  const proto = useSSL ? "https" : "http";
  const portPart = port ? `:${port}` : "";
  return `${proto}://${endPoint}${portPart}`;
}

export async function ensureBucket() {
  const minio = getMinio();
  if (!minio) return false;
  const bucket = getBucket();
  const exists = await minio.bucketExists(bucket).catch(() => false);
  if (!exists) await minio.makeBucket(bucket).catch(() => {});
  return true;
}

export async function putObject(key, buffer, meta) {
  const minio = getMinio();
  if (!minio) throw new Error("minio not configured");
  const bucket = getBucket();
  await ensureBucket();
  await minio.putObject(bucket, key, buffer, meta);
  return `/${bucket}/${key}`;
}


