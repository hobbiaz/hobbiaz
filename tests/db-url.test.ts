import { describe, expect, it } from "vitest";
// @ts-expect-error — plain .mjs helper used by the backup scripts (no type declarations)
import { describeUrl, toLibpqUrl } from "../scripts/db-url.mjs";

describe("backup scripts: connection string", () => {
  it("drops Prisma-only parameters that pg_dump rejects, keeps sslmode", () => {
    const url = toLibpqUrl("postgresql://u:p@host:5432/hobbi_az?schema=public&sslmode=require&pgbouncer=true&connection_limit=5") as string;
    expect(url).toBe("postgresql://u:p@host:5432/hobbi_az?sslmode=require");
  });
  it("never prints the password", () => {
    expect(describeUrl("postgresql://hobbi:secret@db.example.com:5432/hobbi_az")).toBe("hobbi@db.example.com:5432/hobbi_az");
  });
});
