import { createReadStream, createWriteStream, promises as fs } from "node:fs";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import path from "node:path";
import { AwsClient } from "aws4fetch";
import { r2Configured } from "./env";

/** Where uploaded files live: local disk in development, Cloudflare R2 in production. */
export interface StorageProvider {
  put(key: string, data: Buffer, contentType: string): Promise<void>;
  get(key: string): Promise<Buffer | null>;
  remove(key: string): Promise<void>;
  /** Size in bytes, or null when the object does not exist. */
  size(key: string): Promise<number | null>;
  /** The first `bytes` bytes (for sniffing the file type of large uploads). */
  head(key: string, bytes: number): Promise<Buffer | null>;
}

/** Images and videos: 32 hex chars + extension. */
export const KEY_RE = /^[a-f0-9]{32}\.(jpg|png|webp|mp4|webm|mov)$/;
export const VIDEO_KEY_RE = /^[a-f0-9]{32}\.(mp4|webm|mov)$/;
function assertKey(key: string) {
  if (!KEY_RE.test(key)) throw new Error("invalid key");
}

export class LocalStorage implements StorageProvider {
  private dir = path.resolve(process.env.UPLOAD_DIR ?? "./uploads");
  private file(key: string) {
    assertKey(key);
    return path.join(this.dir, key);
  }
  async put(key: string, data: Buffer) {
    await fs.mkdir(this.dir, { recursive: true });
    await fs.writeFile(this.file(key), data);
  }
  async get(key: string) {
    try { return await fs.readFile(this.file(key)); } catch { return null; }
  }
  async remove(key: string) {
    await fs.rm(this.file(key), { force: true });
  }
  async size(key: string) {
    try { return (await fs.stat(this.file(key))).size; } catch { return null; }
  }
  async head(key: string, bytes: number) {
    try {
      const fh = await fs.open(this.file(key), "r");
      try {
        const buf = Buffer.alloc(bytes);
        const { bytesRead } = await fh.read(buf, 0, bytes, 0);
        return buf.subarray(0, bytesRead);
      } finally { await fh.close(); }
    } catch { return null; }
  }
  /** Streams a request body to disk, failing (and deleting the file) past `maxBytes`. */
  async putStream(key: string, body: ReadableStream<Uint8Array>, maxBytes: number) {
    await fs.mkdir(this.dir, { recursive: true });
    const file = this.file(key);
    let total = 0;
    const counter = async function* (src: AsyncIterable<Uint8Array>) {
      for await (const chunk of src) {
        total += chunk.length;
        if (total > maxBytes) throw new Error("too large");
        yield chunk;
      }
    };
    try {
      await pipeline(Readable.fromWeb(body as import("node:stream/web").ReadableStream<Uint8Array>), counter, createWriteStream(file));
    } catch (e) {
      await fs.rm(file, { force: true });
      throw e;
    }
    return total;
  }
  /** A byte range of a file as a web stream (video playback / seeking). */
  stream(key: string, start: number, end: number): ReadableStream<Uint8Array> {
    return Readable.toWeb(createReadStream(this.file(key), { start, end })) as ReadableStream<Uint8Array>;
  }
}

/**
 * S3 endpoint of the bucket's account:
 * - R2_ENDPOINT: any S3-compatible endpoint, used as given (e.g. another provider after a move);
 * - R2_JURISDICTION: "eu" / "fedramp" for R2 buckets created with a jurisdiction
 *   (their API lives at <account>.<jurisdiction>.r2.cloudflarestorage.com);
 * - otherwise the default https://<account>.r2.cloudflarestorage.com.
 */
export function r2Endpoint(env: NodeJS.ProcessEnv = process.env): string {
  const custom = env.R2_ENDPOINT?.trim();
  if (custom) return custom.replace(/\/+$/, "");
  const jurisdiction = env.R2_JURISDICTION?.trim().toLowerCase();
  if (jurisdiction && !/^[a-z]+$/.test(jurisdiction)) throw new Error("R2_JURISDICTION yalnız hərflərdən ibarət olmalıdır (məs. eu)");
  return `https://${env.R2_ACCOUNT_ID}.${jurisdiction ? `${jurisdiction}.` : ""}r2.cloudflarestorage.com`;
}

/** Cloudflare R2 through its S3-compatible API (signed with aws4fetch, no AWS SDK). */
export class R2Storage implements StorageProvider {
  private client: AwsClient;
  private base: string;
  constructor(env = process.env) {
    this.client = new AwsClient({
      accessKeyId: env.R2_ACCESS_KEY_ID!,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY!,
      service: "s3",
      region: "auto",
    });
    this.base = `${r2Endpoint(env)}/${env.R2_BUCKET}`;
  }
  private url(key: string) {
    assertKey(key);
    return `${this.base}/${key}`;
  }
  async put(key: string, data: Buffer, contentType: string) {
    const res = await this.client.fetch(this.url(key), {
      method: "PUT",
      body: new Uint8Array(data),
      headers: { "Content-Type": contentType },
    });
    if (!res.ok) throw new Error(`R2 put failed: ${res.status} ${await res.text()}`);
  }
  async get(key: string) {
    const res = await this.client.fetch(this.url(key));
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`R2 get failed: ${res.status}`);
    return Buffer.from(await res.arrayBuffer());
  }
  async remove(key: string) {
    const res = await this.client.fetch(this.url(key), { method: "DELETE" });
    if (!res.ok && res.status !== 404) throw new Error(`R2 delete failed: ${res.status}`);
  }
  async size(key: string) {
    const res = await this.client.fetch(this.url(key), { method: "HEAD" });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`R2 head failed: ${res.status}`);
    return Number(res.headers.get("content-length") ?? 0);
  }
  async head(key: string, bytes: number) {
    const res = await this.client.fetch(this.url(key), { headers: { Range: `bytes=0-${bytes - 1}` } });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`R2 range get failed: ${res.status}`);
    return Buffer.from(await res.arrayBuffer());
  }
  /**
   * A pre-signed URL so the browser talks to R2 directly (videos are too big to pass through
   * a Vercel function). PUT needs a CORS rule on the bucket — see DEPLOY.md.
   */
  async presign(key: string, method: "PUT" | "GET", expiresSec: number, contentType?: string) {
    const url = new URL(this.url(key));
    url.searchParams.set("X-Amz-Expires", String(expiresSec));
    const signed = await this.client.sign(url.toString(), {
      method,
      headers: contentType ? { "Content-Type": contentType } : undefined,
      aws: { signQuery: true },
    });
    return signed.url;
  }
}

let instance: StorageProvider | undefined;
/** R2 when its env vars are set, otherwise the local `uploads/` folder. */
export function getStorage(): StorageProvider {
  return (instance ??= r2Configured() ? new R2Storage() : new LocalStorage());
}
