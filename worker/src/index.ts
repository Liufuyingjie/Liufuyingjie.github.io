interface Env {
  SITE_ORIGIN: string;
  WORKER_PUBLIC_ORIGIN: string;
  ALLOWED_ORIGINS: string;
  GITHUB_REPO_OWNER: string;
  GITHUB_REPO_NAME: string;
  ALLOWED_GITHUB_USERNAME: string;
  GITHUB_APP_ID: string;
  GITHUB_APP_CLIENT_ID: string;
  GITHUB_APP_CLIENT_SECRET: string;
  GITHUB_PRIVATE_KEY: string;
  SESSION_SECRET: string;
}

type PaperInput = {
  title: string;
  subtitle: string;
  journal: string;
  year: string;
  authors: string;
  affiliation: string;
  code: string;
  task: string;
  model: string;
  problem: string;
  solution: string;
  pipeline: string;
  innovations: string;
  experiments: string;
  extensions: string;
};

type SessionPayload = {
  login: string;
  exp: number;
};

const GH_API = "https://api.github.com";
const GH_API_VERSION = "2026-03-10";
const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;

function corsHeaders(request: Request, env: Env) {
  const origin = request.headers.get("Origin") || "";
  const allowed = env.ALLOWED_ORIGINS.split(",").map((item) => item.trim()).filter(Boolean);
  const headers = new Headers({
    "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type, X-Research-Notes-Request",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  });
  if (allowed.includes(origin)) headers.set("Access-Control-Allow-Origin", origin);
  return headers;
}

function json(request: Request, env: Env, body: unknown, status = 200) {
  const headers = corsHeaders(request, env);
  headers.set("Content-Type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(body), { status, headers });
}

function redirect(location: string, status = 302) {
  return new Response(null, { status, headers: { Location: location, "Cache-Control": "no-store" } });
}

function unauthorized(request: Request, env: Env, message = "未登录或登录已过期。") {
  return json(request, env, { error: message }, 401);
}

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, Math.min(i + chunk, bytes.length)));
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function stringToBase64Url(value: string) {
  return bytesToBase64Url(new TextEncoder().encode(value));
}

function base64UrlToBytes(value: string) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((value.length + 3) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function base64UrlToString(value: string) {
  return new TextDecoder().decode(base64UrlToBytes(value));
}

async function hmacSign(value: string, secret: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return bytesToBase64Url(new Uint8Array(signature));
}

async function hmacVerify(value: string, signature: string, secret: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
  return crypto.subtle.verify("HMAC", key, base64UrlToBytes(signature), new TextEncoder().encode(value));
}

async function createSession(login: string, secret: string) {
  const payload: SessionPayload = { login, exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS };
  const body = stringToBase64Url(JSON.stringify(payload));
  const signature = await hmacSign(body, secret);
  return `${body}.${signature}`;
}

async function verifySession(request: Request, env: Env) {
  const auth = request.headers.get("Authorization") || "";
  if (!auth.startsWith("Bearer ")) return null;

  const token = auth.slice("Bearer ".length).trim();
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;
  if (!(await hmacVerify(body, signature, env.SESSION_SECRET))) return null;

  try {
    const payload = JSON.parse(base64UrlToString(body)) as SessionPayload;
    if (payload.login !== env.ALLOWED_GITHUB_USERNAME) return null;
    if (!Number.isFinite(payload.exp) || payload.exp <= Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

function base64ToUint8Array(value: string) {
  const binary = atob(value.replace(/\s/g, ""));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function derLength(length: number) {
  if (length < 0x80) return new Uint8Array([length]);
  const bytes: number[] = [];
  let value = length;
  while (value > 0) {
    bytes.unshift(value & 0xff);
    value >>>= 8;
  }
  return new Uint8Array([0x80 | bytes.length, ...bytes]);
}

function derSequence(...parts: Uint8Array[]) {
  const totalLength = parts.reduce((sum, part) => sum + part.length, 0);
  const length = derLength(totalLength);
  const output = new Uint8Array(1 + length.length + totalLength);
  output[0] = 0x30;
  output.set(length, 1);
  let offset = 1 + length.length;
  for (const part of parts) {
    output.set(part, offset);
    offset += part.length;
  }
  return output;
}

function derIntegerZero() {
  return new Uint8Array([0x02, 0x01, 0x00]);
}

function derAlgorithmIdentifierRsaEncryption() {
  return new Uint8Array([
    0x30, 0x0d,
    0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x01,
    0x05, 0x00,
  ]);
}

function derOctetString(value: Uint8Array) {
  const length = derLength(value.length);
  const output = new Uint8Array(1 + length.length + value.length);
  output[0] = 0x04;
  output.set(length, 1);
  output.set(value, 1 + length.length);
  return output;
}

function pemToArrayBuffer(pem: string) {
  const normalized = pem.replace(/\\n/g, "\n").replace(/\r/g, "").trim();
  if (normalized.includes("-----BEGIN PRIVATE KEY-----")) {
    const base64 = normalized
      .replace("-----BEGIN PRIVATE KEY-----", "")
      .replace("-----END PRIVATE KEY-----", "");
    return base64ToUint8Array(base64).buffer;
  }

  if (normalized.includes("-----BEGIN RSA PRIVATE KEY-----")) {
    // GitHub downloads GitHub App private keys as PKCS#1 RSA keys.
    // Web Crypto imports PKCS#8, so wrap the PKCS#1 DER bytes in a PKCS#8 container.
    const base64 = normalized
      .replace("-----BEGIN RSA PRIVATE KEY-----", "")
      .replace("-----END RSA PRIVATE KEY-----", "");
    const pkcs1 = base64ToUint8Array(base64);
    const pkcs8 = derSequence(
      derIntegerZero(),
      derAlgorithmIdentifierRsaEncryption(),
      derOctetString(pkcs1),
    );
    return pkcs8.buffer;
  }

  throw new Error("无法识别 GitHub App 私钥格式。");
}

async function createAppJwt(env: Env) {
  const header = stringToBase64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const now = Math.floor(Date.now() / 1000);
  const payload = stringToBase64Url(JSON.stringify({
    iat: now - 60,
    exp: now + 9 * 60,
    iss: Number(env.GITHUB_APP_ID),
  }));
  const data = `${header}.${payload}`;
  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToArrayBuffer(env.GITHUB_PRIVATE_KEY),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(data));
  return `${data}.${bytesToBase64Url(new Uint8Array(signature))}`;
}

async function githubRequest(path: string, init: RequestInit = {}, token?: string) {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/vnd.github+json");
  headers.set("X-GitHub-Api-Version", GH_API_VERSION);
  headers.set("User-Agent", "YingJie-Research-Notes");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return fetch(`${GH_API}${path}`, { ...init, headers });
}

function validReturnTo(value: string | null, env: Env) {
  const fallback = `${env.SITE_ORIGIN.replace(/\/$/, "")}/new/`;
  if (!value) return fallback;
  try {
    const url = new URL(value);
    const allowed = env.ALLOWED_ORIGINS.split(",").map((item) => item.trim()).filter(Boolean);
    if (!allowed.includes(url.origin)) return fallback;
    const allowedPath = url.pathname === "/new/" || url.pathname === "/new" || /^\/papers\/[a-z0-9-]+\/edit\/?$/.test(url.pathname);
    if (!allowedPath) return fallback;
    return url.toString();
  } catch {
    return fallback;
  }
}

function makeSlug(title: string) {
  const normalized = title.toLowerCase()
    .replace(/https?:\/\/\S+/g, "")
    .replace(/[^a-z0-9\s-]/g, " ")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 72);
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${normalized || "paper"}-${Date.now()}-${suffix}`;
}

function yaml(value: string) {
  return JSON.stringify(value ?? "");
}

function buildMarkdown(input: PaperInput, slug: string) {
  const now = new Date();
  const date = (input.year.trim() || String(now.getFullYear())).split(" · ")[0];
  const sections: Array<[string, string, string]> = [
    ["02", "论文要解决的核心问题", input.problem],
    ["03", "核心解决方案", input.solution],
    ["04", "训练 / 推理完整流程", input.pipeline],
    ["05", "核心创新点", input.innovations],
    ["06", "实验效果", input.experiments],
    ["07", "适用场景与扩展", input.extensions],
  ];

  const basics = [
    ["论文标题", input.title],
    ["中文标题", input.subtitle],
    ["发表期刊", input.journal],
    ["发表年份 / 卷期", input.year],
    ["作者", input.authors],
    ["单位", input.affiliation],
    ["开源代码", input.code],
    ["核心任务", input.task],
    ["模型名称", input.model],
  ].filter(([, value]) => value.trim());

  return `---\nslug: ${yaml(slug)}\ntitle: ${yaml(input.title.trim())}\nsubtitle: ${yaml(input.subtitle.trim())}\neyebrow: ${yaml(`Paper Note · ${date}`)}\ndate: ${yaml(date)}\nyear: ${yaml(input.year.trim())}\njournal: ${yaml(input.journal.trim())}\nauthors: ${yaml(input.authors.trim())}\naffiliation: ${yaml(input.affiliation.trim())}\ncode: ${yaml(input.code.trim())}\ntask: ${yaml(input.task.trim())}\nmodel: ${yaml(input.model.trim())}\nreadingStatus: ${yaml("阅读笔记")}\n---\n\n## 01 论文基础信息\n\n${basics.map(([label, value]) => `- **${label}：** ${value}`).join("\n")}\n\n${sections.map(([number, title, value]) => `## ${number} ${title}\n\n${value.trim()}`).join("\n\n")}\n`;
}

function encodeRepoContent(content: string) {
  const bytes = new TextEncoder().encode(content);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, Math.min(i + chunk, bytes.length)));
  }
  return btoa(binary);
}

async function getInstallationToken(env: Env) {
  const appJwt = await createAppJwt(env);
  const installationResponse = await githubRequest(
    `/repos/${encodeURIComponent(env.GITHUB_REPO_OWNER)}/${encodeURIComponent(env.GITHUB_REPO_NAME)}/installation`,
    {},
    appJwt,
  );
  if (!installationResponse.ok) throw new Error(`GitHub 安装信息获取失败：${installationResponse.status}`);
  const installation = (await installationResponse.json()) as { id: number };

  const tokenResponse = await githubRequest(
    `/app/installations/${installation.id}/access_tokens`,
    {
      method: "POST",
      body: JSON.stringify({
        repositories: [env.GITHUB_REPO_NAME],
        permissions: { contents: "write" },
      }),
    },
    appJwt,
  );
  if (!tokenResponse.ok) throw new Error(`GitHub 安装令牌获取失败：${tokenResponse.status}`);
  const token = (await tokenResponse.json()) as { token: string };
  return token.token;
}

async function exchangeCodeForUser(code: string, env: Env) {
  const response = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: env.GITHUB_APP_CLIENT_ID,
      client_secret: env.GITHUB_APP_CLIENT_SECRET,
      code,
    }),
  });
  if (!response.ok) throw new Error("GitHub 登录授权交换失败。");
  const tokenData = (await response.json()) as { access_token?: string; error?: string };
  if (!tokenData.access_token) throw new Error(tokenData.error || "未获取到 GitHub 登录令牌。");

  const userResponse = await githubRequest("/user", {}, tokenData.access_token);
  if (!userResponse.ok) throw new Error("无法读取 GitHub 用户身份。");
  return (await userResponse.json()) as { login: string; name?: string | null };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const method = request.method.toUpperCase();

    if (method === "OPTIONS") {
      const headers = corsHeaders(request, env);
      if (!headers.get("Access-Control-Allow-Origin")) return new Response(null, { status: 403, headers });
      return new Response(null, { status: 204, headers });
    }

    if (url.pathname === "/health" && method === "GET") {
      return json(request, env, { ok: true, service: "yingjie-research-notes-api" });
    }

    if (url.pathname === "/auth/login" && method === "GET") {
      const stateBytes = crypto.getRandomValues(new Uint8Array(24));
      const state = bytesToBase64Url(stateBytes);
      const returnTo = validReturnTo(url.searchParams.get("return_to"), env);
      const cookieValue = `${state}.${stringToBase64Url(returnTo)}`;
      const location = new URL("https://github.com/login/oauth/authorize");
      location.searchParams.set("client_id", env.GITHUB_APP_CLIENT_ID);
      location.searchParams.set("redirect_uri", `${env.WORKER_PUBLIC_ORIGIN.replace(/\/$/, "")}/auth/callback`);
      location.searchParams.set("state", state);
      location.searchParams.set("allow_signup", "false");
      const headers = new Headers({ Location: location.toString(), "Cache-Control": "no-store" });
      headers.set("Set-Cookie", `rn_oauth_state=${encodeURIComponent(cookieValue)}; Path=/; Max-Age=600; HttpOnly; Secure; SameSite=Lax`);
      return new Response(null, { status: 302, headers });
    }

    if (url.pathname === "/auth/callback" && method === "GET") {
      const cookie = request.headers.get("Cookie") || "";
      const stateCookie = cookie.split(";").map((part) => part.trim()).find((part) => part.startsWith("rn_oauth_state="));
      const stateValue = stateCookie ? decodeURIComponent(stateCookie.slice("rn_oauth_state=".length)) : "";
      const [expectedState, encodedReturnTo] = stateValue.split(".");
      const givenState = url.searchParams.get("state") || "";
      const code = url.searchParams.get("code") || "";
      const returnTo = encodedReturnTo ? validReturnTo(base64UrlToString(encodedReturnTo), env) : `${env.SITE_ORIGIN.replace(/\/$/, "")}/new/`;

      if (!expectedState || !givenState || expectedState !== givenState || !code) {
        return redirect(`${returnTo}#auth_error=invalid_state`);
      }

      try {
        const user = await exchangeCodeForUser(code, env);
        if (user.login !== env.ALLOWED_GITHUB_USERNAME) {
          return redirect(`${returnTo}#auth_error=not_allowed`);
        }
        const session = await createSession(user.login, env.SESSION_SECRET);
        const response = redirect(`${returnTo}#auth=${encodeURIComponent(session)}`);
        response.headers.append("Set-Cookie", "rn_oauth_state=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax");
        return response;
      } catch {
        return redirect(`${returnTo}#auth_error=github_error`);
      }
    }

    if (url.pathname === "/api/me" && method === "GET") {
      const session = await verifySession(request, env);
      if (!session) return unauthorized(request, env);
      return json(request, env, { login: session.login, expiresAt: session.exp * 1000 });
    }

    if (url.pathname === "/api/papers" && method === "POST") {
      const session = await verifySession(request, env);
      if (!session) return unauthorized(request, env);

      if (request.headers.get("X-Research-Notes-Request") !== "save-paper") {
        return json(request, env, { error: "缺少请求校验头。" }, 403);
      }

      let input: PaperInput;
      try {
        input = await request.json() as PaperInput;
      } catch {
        return json(request, env, { error: "提交的数据不是有效 JSON。" }, 400);
      }

      if (!input || typeof input.title !== "string" || !input.title.trim()) {
        return json(request, env, { error: "论文标题不能为空。" }, 400);
      }

      const normalized: PaperInput = {
        title: String(input.title || "").trim(),
        subtitle: String(input.subtitle || "").trim(),
        journal: String(input.journal || "").trim(),
        year: String(input.year || "").trim(),
        authors: String(input.authors || "").trim(),
        affiliation: String(input.affiliation || "").trim(),
        code: String(input.code || "").trim(),
        task: String(input.task || "").trim(),
        model: String(input.model || "").trim(),
        problem: String(input.problem || "").trim(),
        solution: String(input.solution || "").trim(),
        pipeline: String(input.pipeline || "").trim(),
        innovations: String(input.innovations || "").trim(),
        experiments: String(input.experiments || "").trim(),
        extensions: String(input.extensions || "").trim(),
      };

      if (normalized.title.length > 300) return json(request, env, { error: "论文标题过长。" }, 400);
      const slug = makeSlug(normalized.title);
      const path = `content/papers/${slug}.md`;
      const content = buildMarkdown(normalized, slug);

      try {
        const token = await getInstallationToken(env);
        const response = await githubRequest(
          `/repos/${encodeURIComponent(env.GITHUB_REPO_OWNER)}/${encodeURIComponent(env.GITHUB_REPO_NAME)}/contents/${path.split("/").map(encodeURIComponent).join("/")}`,
          {
            method: "PUT",
            body: JSON.stringify({
              message: `Add paper note: ${normalized.title}`,
              content: encodeRepoContent(content),
              branch: "main",
            }),
          },
          token,
        );

        const result = await response.json().catch(() => ({})) as { content?: { path?: string }; commit?: { html_url?: string } };
        if (!response.ok) {
          return json(request, env, { error: `写入 GitHub 失败（${response.status}）。` }, 502);
        }

        return json(request, env, {
          ok: true,
          slug,
          path: result.content?.path || path,
          commitUrl: result.commit?.html_url,
        }, 201);
      } catch (error) {
        return json(request, env, { error: error instanceof Error ? error.message : "保存论文时发生未知错误。" }, 502);
      }
    }

    if (url.pathname.startsWith("/api/papers/") && method === "PUT") {
      const session = await verifySession(request, env);
      if (!session) return unauthorized(request, env);

      if (request.headers.get("X-Research-Notes-Request") !== "edit-paper") {
        return json(request, env, { error: "缺少请求校验头。" }, 403);
      }

      const slug = decodeURIComponent(url.pathname.slice("/api/papers/".length)).trim();
      if (!/^[a-z0-9-]{1,140}$/.test(slug)) {
        return json(request, env, { error: "论文标识无效。" }, 400);
      }

      let input: PaperInput;
      try {
        input = await request.json() as PaperInput;
      } catch {
        return json(request, env, { error: "提交的数据不是有效 JSON。" }, 400);
      }

      if (!input || typeof input.title !== "string" || !input.title.trim()) {
        return json(request, env, { error: "论文标题不能为空。" }, 400);
      }

      const normalized: PaperInput = {
        title: String(input.title || "").trim(),
        subtitle: String(input.subtitle || "").trim(),
        journal: String(input.journal || "").trim(),
        year: String(input.year || "").trim(),
        authors: String(input.authors || "").trim(),
        affiliation: String(input.affiliation || "").trim(),
        code: String(input.code || "").trim(),
        task: String(input.task || "").trim(),
        model: String(input.model || "").trim(),
        problem: String(input.problem || "").trim(),
        solution: String(input.solution || "").trim(),
        pipeline: String(input.pipeline || "").trim(),
        innovations: String(input.innovations || "").trim(),
        experiments: String(input.experiments || "").trim(),
        extensions: String(input.extensions || "").trim(),
      };

      if (normalized.title.length > 300) return json(request, env, { error: "论文标题过长。" }, 400);

      const path = `content/papers/${slug}.md`;
      const content = buildMarkdown(normalized, slug);

      try {
        const token = await getInstallationToken(env);
        const encodedPath = path.split("/").map(encodeURIComponent).join("/");
        const currentResponse = await githubRequest(
          `/repos/${encodeURIComponent(env.GITHUB_REPO_OWNER)}/${encodeURIComponent(env.GITHUB_REPO_NAME)}/contents/${encodedPath}?ref=main`,
          { method: "GET" },
          token,
        );

        if (currentResponse.status === 404) {
          return json(request, env, { error: "找不到这篇论文，可能已经被删除。" }, 404);
        }
        if (!currentResponse.ok) {
          return json(request, env, { error: `读取原论文失败（${currentResponse.status}）。` }, 502);
        }

        const currentFile = await currentResponse.json() as { sha?: string };
        if (!currentFile.sha) {
          return json(request, env, { error: "无法获取原论文的版本标识。" }, 502);
        }

        const response = await githubRequest(
          `/repos/${encodeURIComponent(env.GITHUB_REPO_OWNER)}/${encodeURIComponent(env.GITHUB_REPO_NAME)}/contents/${encodedPath}`,
          {
            method: "PUT",
            body: JSON.stringify({
              message: `Update paper note: ${normalized.title}`,
              content: encodeRepoContent(content),
              sha: currentFile.sha,
              branch: "main",
            }),
          },
          token,
        );

        const result = await response.json().catch(() => ({})) as { content?: { path?: string }; commit?: { html_url?: string } };
        if (!response.ok) {
          return json(request, env, { error: `更新 GitHub 论文失败（${response.status}）。` }, 502);
        }

        return json(request, env, {
          ok: true,
          slug,
          path: result.content?.path || path,
          commitUrl: result.commit?.html_url,
        });
      } catch (error) {
        return json(request, env, { error: error instanceof Error ? error.message : "更新论文时发生未知错误。" }, 502);
      }
    }

    return json(request, env, { error: "Not Found" }, 404);
  },
};
