import { Client } from "minio";

export function getMinio() {
  // Suporte a variáveis padrão do projeto e às do Railway (MINIO_PRIVATE_*)
  const endPoint = process.env.MINIO_ENDPOINT || process.env.MINIO_PRIVATE_HOST;
  const port = process.env.MINIO_PORT
    ? Number(process.env.MINIO_PORT)
    : (process.env.MINIO_PRIVATE_PORT ? Number(process.env.MINIO_PRIVATE_PORT) : 9000);
  const useSSL = process.env.MINIO_USE_SSL
    ? process.env.MINIO_USE_SSL === "true"
    : false; // endpoint privado costuma ser HTTP interno
  const accessKey = process.env.MINIO_ACCESS_KEY || process.env.MINIO_ROOT_USER;
  const secretKey = process.env.MINIO_SECRET_KEY || process.env.MINIO_ROOT_PASSWORD;
  if (!endPoint || !accessKey || !secretKey) return null;
  return new Client({ endPoint, port, useSSL, accessKey, secretKey });
}

export function getBucket() {
  return process.env.MINIO_BUCKET || "canecas";
}

export function getPublicBaseUrl() {
  // Preferir MINIO_PUBLIC_URL explícito
  if (process.env.MINIO_PUBLIC_URL) return process.env.MINIO_PUBLIC_URL.replace(/\/$/, "");
  // Compatibilidade com Railway
  if (process.env.MINIO_PUBLIC_ENDPOINT) return process.env.MINIO_PUBLIC_ENDPOINT.replace(/\/$/, "");
  const publicHost = process.env.MINIO_PUBLIC_HOST || process.env.MINIO_ENDPOINT;
  const publicPort = process.env.MINIO_PUBLIC_PORT || process.env.MINIO_PORT;
  const useSSL = process.env.MINIO_USE_SSL === "true" || String(publicPort) === "443";
  if (!publicHost) return "";
  const proto = useSSL ? "https" : "http";
  const portPart = publicPort && !["80","443",80,443].includes(publicPort) ? `:${publicPort}` : "";
  return `${proto}://${publicHost}${portPart}`;
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


