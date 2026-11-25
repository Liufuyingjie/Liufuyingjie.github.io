import test from "node:test";
import assert from "node:assert/strict";
import { createHmac, generateKeyPairSync } from "node:crypto";
import worker from "../worker/src/index";
const env = {
  SITE_ORIGIN: "https://site.example", WORKER_PUBLIC_ORIGIN: "https://api.example",
  ALLOWED_ORIGINS: "https://site.example,http://localhost:3000", GITHUB_REPO_OWNER: "test-owner",
  GITHUB_REPO_NAME: "test-repo", ALLOWED_GITHUB_USERNAME: "test-owner",
  GITHUB_APP_ID: "test", GITHUB_APP_CLIENT_ID: "test-client", GITHUB_APP_CLIENT_SECRET: "",
  GITHUB_PRIVATE_KEY: "", SESSION_SECRET: "unit-test-only-never-a-production-secret",
};
test("Worker exposes Markdown and deletion capabilities, and CORS only allows configured origins", async () => {
  const health = await worker.fetch(new Request("https://api.example/health", { headers: { Origin: "https://site.example" } }), env);
  assert.equal(health.status, 200); assert.equal(health.headers.get("Access-Control-Allow-Origin"), "https://site.example");
  const data = await health.json() as { schemaVersion: number; capabilities: string[] };
  assert.equal(data.schemaVersion, 7);
  assert.ok(data.capabilities.includes("markdown-body"));
  assert.ok(data.capabilities.includes("delete-paper"));
  assert.ok(data.capabilities.includes("paper-publication-fields"));
  const preflight = await worker.fetch(new Request("https://api.example/api/papers/eet", { method: "OPTIONS", headers: { Origin: "https://site.example", "Access-Control-Request-Method": "DELETE" } }), env);
  assert.equal(preflight.status, 204);
  assert.match(preflight.headers.get("Access-Control-Allow-Methods") ?? "", /\bDELETE\b/);
  const denied = await worker.fetch(new Request("https://api.example/api/papers", { method: "OPTIONS", headers: { Origin: "https://not-allowed.example" } }), env);
  assert.equal(denied.status, 403);
});
test("no anonymous or malformed session can read identity or mutate records", async () => {
  for (const [url, method] of [["/api/me", "GET"], ["/api/papers", "POST"], ["/api/papers/eet", "PUT"], ["/api/papers/eet", "DELETE"]]) {
    const response = await worker.fetch(new Request("https://api.example" + url, { method }), env);
    assert.equal(response.status, 401);
    const malformed = await worker.fetch(new Request("https://api.example" + url, { method, headers: { Authorization: "Bearer invalid.!not-base64" } }), env);
    assert.equal(malformed.status, 401);
  }
});

const noteSha = "a".repeat(40);

function sessionFor(login: string, expiresIn = 60) {
  const exp = Math.floor(Date.now() / 1000) + expiresIn;
  const body = Buffer.from(JSON.stringify({ login, exp })).toString("base64url");
  const signature = createHmac("sha256", env.SESSION_SECRET).update(body).digest("base64url");
  return `${body}.${signature}`;
}

test("paper create and edit reject invalid publication fields before contacting GitHub", async (t) => {
  const github = t.mock.method(globalThis, "fetch", async () => new Response(null, { status: 500 }));
  const token = sessionFor(env.ALLOWED_GITHUB_USERNAME);
  const routes = [
    ["POST", "/api/papers", "save-paper"],
    ["PUT", "/api/papers/eet", "edit-paper"],
  ];
  for (const [method, path, requestType] of routes) {
    for (const fields of [{ venueType: "CVPR" }, { publicationDate: "2026-02-29" }]) {
      const response = await worker.fetch(new Request(`https://api.example${path}`, {
        method,
        headers: { Authorization: `Bearer ${token}`, "X-Research-Notes-Request": requestType },
        body: JSON.stringify({ title: "Paper", ...fields }),
      }), env);
      assert.equal(response.status, 400);
    }
  }
  assert.equal(github.mock.callCount(), 0);
});

function deleteRequest(token: string, expectedSha = noteSha, requestType = "delete-paper") {
  return new Request("https://api.example/api/papers/eet", {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-Research-Notes-Request": requestType,
      Origin: "https://site.example",
    },
    body: JSON.stringify({ expectedSha }),
  });
}

test("deletion requires the configured owner, an unexpired session, and a valid request", async (t) => {
  const github = t.mock.method(globalThis, "fetch", async () => new Response(null, { status: 500 }));
  const owner = sessionFor(env.ALLOWED_GITHUB_USERNAME);
  const expired = sessionFor(env.ALLOWED_GITHUB_USERNAME, -60);
  assert.equal((await worker.fetch(deleteRequest(sessionFor("another-account")), env)).status, 401);
  assert.equal((await worker.fetch(deleteRequest(expired), env)).status, 401);
  assert.equal((await worker.fetch(deleteRequest(owner, noteSha, "edit-paper"), env)).status, 403);
  assert.equal((await worker.fetch(deleteRequest(owner, "latest"), env)).status, 400);
  assert.equal(github.mock.callCount(), 0);
});

test("owner deletion checks the version, removes only the private note, and requests a rebuild", async (t) => {
  const { privateKey } = generateKeyPairSync("rsa", {
    modulusLength: 2048,
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
    publicKeyEncoding: { type: "spki", format: "pem" },
  });
  const deleteEnv = { ...env, GITHUB_APP_ID: "1", GITHUB_PRIVATE_KEY: privateKey };
  const owner = sessionFor(env.ALLOWED_GITHUB_USERNAME);
  const contentPath = "/repos/test-owner/test-repo/contents/content/papers/eet.md";
  const commitUrl = "https://github.com/test-owner/test-repo/commit/deleted";
  let currentSha: string | undefined;
  let deletionStatus = 409;
  let dispatchStatus = 204;
  const requests: string[] = [];
  t.mock.method(globalThis, "fetch", async (input: string, init?: RequestInit) => {
    const url = new URL(input);
    assert.equal(url.origin, "https://api.github.com");
    const method = init?.method ?? "GET";
    requests.push(`${method} ${url.pathname}`);
    const authorization = new Headers(init?.headers).get("Authorization");
    const fileToken = "Bearer mock-contents-token";
    switch (`${method} ${url.pathname}`) {
      case "GET /repos/test-owner/test-repo/installation":
        return Response.json({ id: 1 });
      case "GET /repos/test-owner/Liufuyingjie.github.io/installation":
        return Response.json({ id: 2 });
      case "POST /app/installations/1/access_tokens":
        assert.deepEqual(JSON.parse(String(init?.body)), { repositories: ["test-repo"], permissions: { contents: "write" } });
        return Response.json({ token: "mock-contents-token" });
      case "POST /app/installations/2/access_tokens":
        assert.deepEqual(JSON.parse(String(init?.body)), { repositories: ["Liufuyingjie.github.io"], permissions: { actions: "write" } });
        return Response.json({ token: "mock-actions-token" });
      case `GET ${contentPath}`:
        assert.equal(url.searchParams.get("ref"), "main");
        assert.equal(authorization, fileToken);
        return currentSha ? Response.json({ type: "file", sha: currentSha }) : new Response(null, { status: 404 });
      case `DELETE ${contentPath}`:
        assert.equal(authorization, fileToken);
        assert.deepEqual(JSON.parse(String(init?.body)), { message: "Delete note: eet", sha: noteSha, branch: "main" });
        return Response.json({ commit: { html_url: commitUrl } }, { status: deletionStatus });
      case "POST /repos/test-owner/Liufuyingjie.github.io/actions/workflows/deploy.yml/dispatches":
        assert.equal(authorization, "Bearer mock-actions-token");
        assert.deepEqual(JSON.parse(String(init?.body)), { ref: "main" });
        return new Response(null, { status: dispatchStatus });
      default:
        throw new Error(`Unexpected GitHub request: ${method} ${url.pathname}`);
    }
  });

  assert.equal((await worker.fetch(deleteRequest(owner), deleteEnv)).status, 404);
  currentSha = "b".repeat(40);
  assert.equal((await worker.fetch(deleteRequest(owner), deleteEnv)).status, 409);
  assert.ok(requests.every(r => !r.startsWith("DELETE ") && !r.endsWith("/dispatches")));

  currentSha = noteSha;
  assert.equal((await worker.fetch(deleteRequest(owner), deleteEnv)).status, 409);
  assert.ok(requests.includes(`DELETE ${contentPath}`));
  assert.ok(requests.every(r => !r.endsWith("/dispatches")));

  deletionStatus = 200;
  const result = await worker.fetch(deleteRequest(owner), deleteEnv);
  assert.equal(result.status, 200);
  assert.deepEqual(await result.json(), { ok: true, slug: "eet", commitUrl, siteRebuild: "triggered" });

  dispatchStatus = 503;
  const failedRebuild = await worker.fetch(deleteRequest(owner), deleteEnv);
  assert.equal(failedRebuild.status, 200);
  assert.deepEqual(await failedRebuild.json(), { ok: true, slug: "eet", commitUrl, siteRebuild: "failed: 触发站点重建失败：503" });
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
