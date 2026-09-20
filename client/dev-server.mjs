import * as esbuild from "./node_modules/esbuild/lib/main.js";
import http from "node:http";
import https from "node:https";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 5173;
const API_TARGET = "http://localhost:5000";

const mime = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".jsx": "application/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".json": "application/json",
  ".map": "application/json",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

// Start esbuild serve (serves bundled JS/CSS)
const ctx = await esbuild.context({
  entryPoints: ["src/main.jsx"],
  bundle: true,
  format: "esm",
  splitting: false,
  sourcemap: true,
  target: ["chrome90", "firefox90", "safari14"],
  outdir: ".esbuild-out",
  publicPath: "/",
  jsx: "automatic",
  loader: {
    ".js": "jsx",
    ".jsx": "jsx",
    ".css": "css",
    ".svg": "text",
    ".png": "dataurl",
    ".woff": "file",
    ".woff2": "file",
  },
  define: {
    "process.env.NODE_ENV": '"development"',
    global: "globalThis",
  },
  plugins: [],
});

const { host: ebHost, port: ebPort } = await ctx.serve({
  servedir: ".esbuild-out",
  host: "127.0.0.1",
});

console.log(`\n  esbuild bundler listening at http://${ebHost}:${ebPort}`);

// Read the HTML template once
function getIndexHtml() {
  let html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
  // Replace the module script with the esbuild bundle
  html = html.replace(
    '<script type="module" src="/src/main.jsx"></script>',
    '<link rel="stylesheet" href="/main.css" />\n    <script type="module" src="/main.js"></script>',
  );
  return html;
}

// Helper: proxy a request to the esbuild dev server
function proxyToEsbuild(req, res) {
  const options = {
    hostname: ebHost,
    port: ebPort,
    path: req.url,
    method: req.method,
    headers: req.headers,
  };
  const proxy = http.request(options, (ebRes) => {
    res.writeHead(ebRes.statusCode, ebRes.headers);
    ebRes.pipe(res, { end: true });
  });
  proxy.on("error", () => {
    res.writeHead(502);
    res.end("esbuild proxy error");
  });
  req.pipe(proxy, { end: true });
}

// Helper: proxy a request to the backend API
function proxyToApi(req, res) {
  const url = new URL(API_TARGET + req.url);
  const options = {
    hostname: url.hostname,
    port: url.port || 5000,
    path: url.pathname + url.search,
    method: req.method,
    headers: { ...req.headers, host: url.host },
  };
  const proxy = http.request(options, (apiRes) => {
    res.writeHead(apiRes.statusCode, apiRes.headers);
    apiRes.pipe(res, { end: true });
  });
  proxy.on("error", () => {
    res.writeHead(502);
    res.end("API proxy error");
  });
  req.pipe(proxy, { end: true });
}

// Main dev server
const server = http.createServer((req, res) => {
  const url = req.url.split("?")[0];

  // Proxy /api/* and /socket.io/* to backend
  if (url.startsWith("/api/") || url.startsWith("/socket.io/")) {
    return proxyToApi(req, res);
  }

  // Serve static files from /public if they exist
  const publicPath = path.join(__dirname, "public", url);
  if (fs.existsSync(publicPath) && fs.statSync(publicPath).isFile()) {
    const ext = path.extname(publicPath);
    res.writeHead(200, {
      "Content-Type": mime[ext] || "application/octet-stream",
    });
    fs.createReadStream(publicPath).pipe(res);
    return;
  }

  // Serve index.html for SPA routes (non-file requests)
  const ext = path.extname(url);
  if (!ext || ext === ".html") {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(getIndexHtml());
    return;
  }

  // Everything else (JS bundles, CSS) → proxy to esbuild
  proxyToEsbuild(req, res);
});

server.listen(PORT, () => {
  console.log(`\n  Dev Server ready!\n`);
  console.log(`  ➜  Local:   http://localhost:${PORT}/`);
  console.log(`  ➜  API:     proxied to ${API_TARGET}`);
  console.log(`\n  Press Ctrl+C to stop.\n`);
});

process.on("SIGINT", () => {
  ctx.dispose();
  server.close();
  process.exit(0);
});
