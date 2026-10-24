"use client";

/**
 * Shim gateway sandbox-preview: saat halaman dibuka lewat
 * `?XTransformPort=3010` (mis. preview edisi shared hosting PHP),
 * setiap panggilan API ikut membawa query itu agar gateway meneruskan
 * request ke port yang benar. Di produksi/Node dev string ini kosong —
 * 100% no-op, tidak mengubah perilaku apa pun.
 */
const PORT_SUFFIX = (() => {
  if (typeof window === "undefined") return "";
  const m = window.location.search.match(/[?&]XTransformPort=(\d+)/);
  return m ? `XTransformPort=${m[1]}` : "";
})();

export function withPort(url: string): string {
  if (!PORT_SUFFIX) return url;
  return url + (url.includes("?") ? "&" : "?") + PORT_SUFFIX;
}

export async function apiGet<T>(url: string): Promise<T> {
  const res = await fetch(withPort(url), { cache: "no-store" });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { error?: string }).error || "Gagal memuat data.");
  }
  return res.json() as Promise<T>;
}

export async function apiSend<T>(url: string, method: "POST" | "PUT" | "PATCH" | "DELETE", body?: unknown): Promise<T> {
  const res = await fetch(withPort(url), {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || "Terjadi kesalahan.");
  }
  return data as T;
}

export function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export function formatDateTime(iso: string) {
  try {
    return new Date(iso).toLocaleString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function timeAgo(iso: string | null | undefined) {
  if (!iso) return "belum pernah";
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const s = Math.max(1, Math.floor(diff / 1000));
    if (s < 60) return `${s} detik lalu`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m} menit lalu`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} jam lalu`;
    const d = Math.floor(h / 24);
    return `${d} hari lalu`;
  } catch {
    return iso;
  }
}

export function maskKey(key: string) {
  if (!key) return "—";
  if (key.length <= 12) return key.slice(0, 4) + "•".repeat(8);
  return `${key.slice(0, 10)}${"•".repeat(14)}${key.slice(-4)}`;
}
