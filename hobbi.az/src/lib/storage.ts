import { promises as fs } from "node:fs";
import path from "node:path";
import { AwsClient } from "aws4fetch";
import { r2Configured } from "./env";

/** Where uploaded files live: local disk in development, Cloudflare R2 in production. */
export interface StorageProvider {
  put(key: string, data: Buffer, contentType: string): Promise<void>;
  get(key: string): Promise<Buffer | null>;
  remove(key: string): Promise<void>;
}

export const KEY_RE = /^[a-f0-9]{32}\.(jpg|png|webp)$/;
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
    this.base = `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${env.R2_BUCKET}`;
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
}

let instance: StorageProvider | undefined;
/** R2 when its env vars are set, otherwise the local `uploads/` folder. */
export function getStorage(): StorageProvider {
  return (instance ??= r2Configured() ? new R2Storage() : new LocalStorage());
}
