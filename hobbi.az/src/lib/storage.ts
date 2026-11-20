import { promises as fs } from "node:fs";
import path from "node:path";

/** Storage abstraction. Implement S3Storage (same interface) for production. */
export interface StorageProvider {
  put(key: string, data: Buffer): Promise<void>;
  get(key: string): Promise<Buffer | null>;
  remove(key: string): Promise<void>;
}

const KEY_RE = /^[a-f0-9]{32}\.(jpg|png|webp)$/;

export class LocalStorage implements StorageProvider {
  private dir = path.resolve(process.env.UPLOAD_DIR ?? "./uploads");
  private file(key: string) {
    if (!KEY_RE.test(key)) throw new Error("invalid key");
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
export const storage: StorageProvider = new LocalStorage();
