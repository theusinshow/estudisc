import { describe, expect, it } from "vitest";

import { getCanonicalRedirectUrl } from "@/lib/canonical-host";

const APP = "https://www.estudisc.com.br";
const at = (host: string, path = "/aprender?x=1", forwarded?: string) =>
  getCanonicalRedirectUrl(new Headers({ host, ...(forwarded ? { "x-forwarded-host": forwarded } : {}) }), new URL(`http://localhost:8080${path}`), APP);

describe("getCanonicalRedirectUrl", () => {
  it("redirects alias hosts to APP_URL keeping path and query", () => {
    expect(at("estudisc.com.br")?.href).toBe("https://www.estudisc.com.br/aprender?x=1");
    expect(at("localhost:8080", "/conheca", "app-production-57fba.up.railway.app")?.href).toBe("https://www.estudisc.com.br/conheca");
  });

  it("leaves the canonical, health check and local hosts alone", () => {
    expect(at("www.estudisc.com.br")).toBeNull();
    expect(at("localhost:8080", "/", "WWW.estudisc.com.br")).toBeNull();
    expect(at("healthcheck.railway.app", "/conheca")).toBeNull();
    expect(at("localhost:8080")).toBeNull();
  });

  it("does nothing without a usable or with a local APP_URL", () => {
    const headers = new Headers({ host: "estudisc.com.br" });
    const url = new URL("http://x/");
    expect(getCanonicalRedirectUrl(headers, url, undefined)).toBeNull();
    expect(getCanonicalRedirectUrl(headers, url, "not a url")).toBeNull();
    expect(getCanonicalRedirectUrl(headers, url, "http://localhost:3210")).toBeNull();
  });
});
