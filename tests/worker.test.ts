import test from "node:test";
import assert from "node:assert/strict";
import worker from "../worker/src/index";
const env = {
  SITE_ORIGIN: "https://site.example", WORKER_PUBLIC_ORIGIN: "https://api.example",
  ALLOWED_ORIGINS: "https://site.example,http://localhost:3000", GITHUB_REPO_OWNER: "test-owner",
  GITHUB_REPO_NAME: "test-repo", ALLOWED_GITHUB_USERNAME: "test-owner",
  GITHUB_APP_ID: "test", GITHUB_APP_CLIENT_ID: "test-client", GITHUB_APP_CLIENT_SECRET: "",
  GITHUB_PRIVATE_KEY: "", SESSION_SECRET: "unit-test-only-never-a-production-secret",
};
test("Worker exposes Markdown capability, and CORS only allows configured origins", async () => {
  const health = await worker.fetch(new Request("https://api.example/health", { headers: { Origin: "https://site.example" } }), env);
  assert.equal(health.status, 200); assert.equal(health.headers.get("Access-Control-Allow-Origin"), "https://site.example");
  const data = await health.json() as { schemaVersion: number; capabilities: string[] }; assert.equal(data.schemaVersion, 5); assert.ok(data.capabilities.includes("markdown-body"));
  const denied = await worker.fetch(new Request("https://api.example/api/papers", { method: "OPTIONS", headers: { Origin: "https://not-allowed.example" } }), env);
  assert.equal(denied.status, 403);
});
test("no anonymous or malformed session can read identity, add or edit records", async () => {
  for (const [url, method] of [["/api/me", "GET"], ["/api/papers", "POST"], ["/api/papers/eet", "PUT"]]) {
    const response = await worker.fetch(new Request("https://api.example" + url, { method }), env);
    assert.equal(response.status, 401);
    const malformed = await worker.fetch(new Request("https://api.example" + url, { method, headers: { Authorization: "Bearer invalid.!not-base64" } }), env);
    assert.equal(malformed.status, 401);
  }
});
test("working OAuth paths remain supported without open redirects", async () => {
  const login = await worker.fetch(new Request("https://api.example/auth/login?return_to=" + encodeURIComponent("https://site.example/papers/eet/edit/")), env);
  assert.equal(login.status, 302);
  assert.equal(new URL(login.headers.get("Location")!).hostname, "github.com");
  const cookie = login.headers.get("Set-Cookie")!; assert.ok(cookie.includes("HttpOnly")); assert.ok(cookie.includes("SameSite=Lax"));
  const encoded = decodeURIComponent(cookie.split(";")[0].split("=")[1]).split(".")[2];
  assert.equal(Buffer.from(encoded, "base64url").toString(), "https://site.example/papers/eet/edit/");
  const wrong = await worker.fetch(new Request("https://api.example/auth/login?return_to=" + encodeURIComponent("https://not-allowed.example/new/")), env);
  const fallback = decodeURIComponent(wrong.headers.get("Set-Cookie")!.split(";")[0].split("=")[1]).split(".")[2];
  assert.equal(Buffer.from(fallback, "base64url").toString(), "https://site.example/new/");
});
