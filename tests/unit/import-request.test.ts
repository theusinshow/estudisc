import { describe, expect, it } from "vitest";

import { MAX_TRACK_PACK_BYTES, readJsonRequestWithLimit } from "@/features/import/application/import-request";

describe("readJsonRequestWithLimit", () => {
  it("rejects requests larger than the configured limit before parsing", async () => {
    const request = new Request("http://local.test/import", {
      method: "POST",
      headers: { "content-length": "12" },
      body: "{}"
    });

    await expect(readJsonRequestWithLimit(request, 4)).resolves.toMatchObject({
      ok: false,
      code: "payload_too_large",
      maxBytes: 4,
      byteLength: 12
    });
  });

  it("returns invalid_json for malformed payloads within the size limit", async () => {
    const request = new Request("http://local.test/import", {
      method: "POST",
      body: "{"
    });

    await expect(readJsonRequestWithLimit(request, 4)).resolves.toMatchObject({
      ok: false,
      code: "invalid_json"
    });
  });

  it("accepts exactly two MiB of UTF-8 JSON for Track Packs while keeping unrelated reads at one MiB", async () => {
    const body = JSON.stringify("á".repeat((MAX_TRACK_PACK_BYTES - 2) / 2));
    const read = await readJsonRequestWithLimit(new Request("http://local.test/import", { method: "POST", body }), MAX_TRACK_PACK_BYTES);
    expect(MAX_TRACK_PACK_BYTES).toBe(2 * 1024 * 1024);
    expect(read.ok).toBe(true);
    expect(read.byteLength).toBe(MAX_TRACK_PACK_BYTES);
    await expect(readJsonRequestWithLimit(new Request("http://local.test/other", { method: "POST", body }))).resolves.toMatchObject({ ok: false, code: "payload_too_large", maxBytes: 1024 * 1024 });
  });

  it("rejects one byte over two MiB even when Content-Length understates accented JSON", async () => {
    const body = JSON.stringify("á".repeat((MAX_TRACK_PACK_BYTES - 2) / 2) + "!");
    const result = await readJsonRequestWithLimit(new Request("http://local.test/import", { method: "POST", headers: { "content-length": "4" }, body }), MAX_TRACK_PACK_BYTES);
    expect(result).toMatchObject({ ok: false, code: "payload_too_large", maxBytes: MAX_TRACK_PACK_BYTES, byteLength: MAX_TRACK_PACK_BYTES + 1 });
  });
});
