const json = (value, status = 200, headers = {}) => new Response(JSON.stringify(value), {
  status,
  headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...headers },
});

function cors(request, env) {
  const origin = request.headers.get("Origin");
  if (!origin || origin !== env.PUBLISH_ORIGIN) return {};
  return {
    "access-control-allow-origin": origin,
    "access-control-allow-methods": "POST, OPTIONS",
    "access-control-allow-headers": "Authorization, Content-Type",
    "access-control-max-age": "600",
    "vary": "Origin",
  };
}

function safePath(path) {
  if (typeof path !== "string" || path.length > 240 || path.startsWith("/") || path.includes("..") || path.includes("\\")) return false;
  return ["index.html", "styles.css", "app.js", "README.md", ".nojekyll", "site-data.json"].includes(path)
    || /^(images|fonts)\/[a-zA-Z0-9._+-]+$/.test(path);
}

function equalSecret(a, b) {
  if (!a || !b || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function github(env, path, options = {}) {
  const response = await fetch(`https://api.github.com${path}`, {
    ...options,
    headers: {
      "authorization": `Bearer ${env.GITHUB_TOKEN}`,
      "accept": "application/vnd.github+json",
      "content-type": "application/json",
      "x-github-api-version": "2022-11-28",
      "user-agent": "Vy-Portfolio-Publisher",
      ...options.headers,
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(body.message || `GitHub returned ${response.status}`);
    error.status = response.status;
    throw error;
  }
  return body;
}

export default {
  async fetch(request, env) {
    const headers = cors(request, env);
    const url = new URL(request.url);
    if (url.pathname !== "/publish") return json({ error: "Not found" }, 404, headers);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
    if (request.method !== "POST") return json({ error: "Method not allowed" }, 405, { ...headers, allow: "POST, OPTIONS" });
    if (!headers["access-control-allow-origin"]) return json({ error: "Origin not allowed" }, 403);
    if (!env.PUBLISH_PASSWORD || env.PUBLISH_PASSWORD.length < 32 || !env.GITHUB_TOKEN || !env.GITHUB_OWNER || !env.GITHUB_REPO || !env.PUBLISH_ORIGIN) {
      return json({ error: "Publisher is not configured" }, 503, headers);
    }
    const limited = await env.PUBLISH_RATE_LIMITER.limit({ key: "vy-portfolio-publisher" });
    if (!limited.success) return json({ error: "Too many publish attempts; wait one minute and try again." }, 429, headers);
    const auth = request.headers.get("Authorization") || "";
    if (!equalSecret(auth.startsWith("Bearer ") ? auth.slice(7) : "", env.PUBLISH_PASSWORD)) {
      return json({ error: "Incorrect publisher password" }, 401, headers);
    }
    const length = Number(request.headers.get("Content-Length") || 0);
    if (length > 50 * 1024 * 1024) return json({ error: "Upload is larger than 50 MB." }, 413, headers);

    try {
      const payload = await request.json();
      const entries = Object.entries(payload.files || {});
      if (!entries.length || entries.length > 60) return json({ error: "Invalid site file list." }, 400, headers);
      let total = 0;
      const files = entries.map(([path, content]) => {
        if (!safePath(path) || typeof content !== "string" || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(content)) {
          throw new Error("The upload contains an unsupported file.");
        }
        const bytes = Math.floor(content.length * 3 / 4);
        if (bytes > 9 * 1024 * 1024) throw new Error(`${path} is larger than 9 MB.`);
        total += bytes;
        return { path, content };
      });
      if (total > 36 * 1024 * 1024) return json({ error: "Total site media is larger than 36 MB." }, 413, headers);

      const base = `/repos/${encodeURIComponent(env.GITHUB_OWNER)}/${encodeURIComponent(env.GITHUB_REPO)}`;
      const branch = env.GITHUB_BRANCH || "main";
      const ref = await github(env, `${base}/git/ref/heads/${encodeURIComponent(branch)}`);
      const parent = await github(env, `${base}/git/commits/${ref.object.sha}`);
      const blobs = await Promise.all(files.map(async file => {
        const blob = await github(env, `${base}/git/blobs`, {
          method: "POST",
          body: JSON.stringify({ content: file.content, encoding: "base64" }),
        });
        return { path: file.path, mode: "100644", type: "blob", sha: blob.sha };
      }));
      const tree = await github(env, `${base}/git/trees`, {
        method: "POST",
        body: JSON.stringify({ base_tree: parent.tree.sha, tree: blobs }),
      });
      const commit = await github(env, `${base}/git/commits`, {
        method: "POST",
        body: JSON.stringify({ message: "Publish portfolio from Vy_ editor", tree: tree.sha, parents: [parent.sha] }),
      });
      await github(env, `${base}/git/refs/heads/${encodeURIComponent(branch)}`, {
        method: "PATCH",
        body: JSON.stringify({ sha: commit.sha, force: false }),
      });
      return json({ ok: true, commit: commit.sha }, 200, headers);
    } catch (error) {
      const status = error.status === 401 || error.status === 403 ? 502 : 400;
      return json({ error: error.message || "Publishing failed." }, status, headers);
    }
  },
};
