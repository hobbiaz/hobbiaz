/** Browser-side helper for our JSON API. Throws ApiError with the server's Azerbaijani message. */
export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
  /** 503 / network failure: the database (or the whole backend) is not reachable. */
  get offline() { return this.status === 503 || this.status === 0; }
}

export async function api<T = unknown>(path: string, init?: Omit<RequestInit, "body"> & { body?: unknown }): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      ...init,
      headers: init?.body !== undefined && !(init.body instanceof FormData) ? { "Content-Type": "application/json", ...init?.headers } : init?.headers,
      body: init?.body === undefined ? undefined : init.body instanceof FormData ? init.body : JSON.stringify(init.body),
      credentials: "same-origin",
    });
  } catch {
    throw new ApiError(0, "Serverə qoşulmaq alınmadı. İnterneti yoxlayın");
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, (data as { error?: string } | null)?.error ?? "Xəta baş verdi");
  return data as T;
}

/** Uploads one image file and returns its storage key. */
export async function uploadImage(file: File): Promise<{ key: string; url: string }> {
  const form = new FormData();
  form.append("file", file);
  return api("/api/upload", { method: "POST", body: form });
}

/** "2 saat əvvəl" style relative time. */
export function timeAgo(iso?: string): string {
  if (!iso) return "";
  const s = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return "indicə";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} dəqiqə əvvəl`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} saat əvvəl`;
  const d = Math.round(h / 24);
  if (d < 30) return `${d} gün əvvəl`;
  const mo = Math.round(d / 30);
  if (mo < 12) return `${mo} ay əvvəl`;
  return `${Math.round(mo / 12)} il əvvəl`;
}
