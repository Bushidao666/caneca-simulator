const KEY = "configured_mugs_v1";

// Fallback localStorage (somente dev/sem DB)
function getLocal() {
  try { const raw = window.localStorage.getItem(KEY); return raw ? JSON.parse(raw) : []; } catch { return []; }
}
function setLocal(data) {
  try { window.localStorage.setItem(KEY, JSON.stringify(data || [])); } catch {}
}

export async function apiListMugs() {
  try {
    const res = await fetch("/api/mugs");
    if (!res.ok) throw new Error("api");
    const data = await res.json();
    setLocal(data);
    return data;
  } catch {
    return typeof window !== "undefined" ? getLocal() : [];
  }
}

export async function apiCreateMug(mug) {
  const res = await fetch("/api/mugs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(mug) });
  if (!res.ok) throw new Error("create failed");
  const created = await res.json();
  const list = await apiListMugs();
  return { created, list };
}

export async function apiUpdateMug(id, patch) {
  // Se incluir arquivo DataURL, opcionalmente subimos para MinIO
  if (patch?.texture && patch.texture.startsWith("data:")) {
    try {
      const pres = await fetch("/api/storage/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: `mug_${id}.png`, contentType: "image/png" })
      });
      const presData = await pres.json();
      if (presData.enabled && presData.url) {
        // converter dataURL em Blob
        const blob = await (await fetch(patch.texture)).blob();
        await fetch(presData.url, { method: "PUT", headers: { "Content-Type": blob.type }, body: blob });
        patch.texture = presData.publicUrl;
      }
    } catch {}
  }
  // Upload opcional do ambiente (HDR/Imagem) se vier como Data URL
  if (patch?.settings?.envUrl && String(patch.settings.envUrl).startsWith("data:")) {
    try {
      const contentType = patch.settings.envUrl.slice(5, patch.settings.envUrl.indexOf(";"));
      const ext = contentType.includes("hdr") ? "hdr" : (contentType.includes("png") ? "png" : "jpg");
      const pres = await fetch("/api/storage/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: `env_${id}.${ext}`, contentType })
      });
      const presData = await pres.json();
      if (presData.enabled && presData.url) {
        const blob = await (await fetch(patch.settings.envUrl)).blob();
        await fetch(presData.url, { method: "PUT", headers: { "Content-Type": blob.type }, body: blob });
        patch.settings = { ...(patch.settings || {}), envUrl: presData.publicUrl };
      }
    } catch {}
  }
  const res = await fetch(`/api/mugs/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) });
  if (!res.ok) throw new Error("update failed");
  const updated = await res.json();
  const list = await apiListMugs();
  return { updated, list };
}

export async function apiDeleteMug(id) {
  const res = await fetch(`/api/mugs/${id}`, { method: "DELETE" });
  if (!res.ok && res.status !== 204) throw new Error("delete failed");
  const list = await apiListMugs();
  return { list };
}

// compat export
export function getConfiguredMugs() { return typeof window !== "undefined" ? getLocal() : []; }
export function saveConfiguredMugs(mugs) { if (typeof window !== "undefined") setLocal(mugs); }

