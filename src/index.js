const express = require("express");
const os = require("os");
const fs = require("fs");
const path = require("path");

const app = express();

let requestCount = 0;

const PORT = process.env.PORT || 3000;
const BUILD_NUMBER = process.env.BUILD_NUMBER || "dev";
const BUILD_DATE = process.env.BUILD_DATE || "local build";
const GIT_SHA = process.env.GIT_SHA || "unknown";
const CLOUDSMITH_WORKSPACE =
  process.env.CLOUDSMITH_WORKSPACE || "dmk-software-solutions";
const CLOUDSMITH_REPOSITORY =
  process.env.CLOUDSMITH_REPOSITORY || "npm-docker-demo";

function getSystemInfo() {
  return {
    hostname: os.hostname(),
    platform: os.platform(),
    platform_version: os.release(),
    node_version: process.version,
    architecture: os.arch(),
  };
}

function getInstalledPackages() {
  try {
    const lockfilePath = path.join(__dirname, "..", "package-lock.json");
    const lockfile = JSON.parse(fs.readFileSync(lockfilePath, "utf8"));
    const packages = [];

    const deps = lockfile.packages || {};
    for (const [pkgPath, pkgInfo] of Object.entries(deps)) {
      if (pkgPath === "") continue;
      const name = pkgPath.replace("node_modules/", "");
      if (name.includes("node_modules/")) continue;
      packages.push({ name, version: pkgInfo.version || "unknown" });
    }

    packages.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
    return packages;
  } catch {
    return [{ name: "Unable to read packages", version: "N/A" }];
  }
}

app.get("/", (_req, res) => {
  requestCount++;

  const info = getSystemInfo();
  const currentTime = new Date().toISOString().replace("T", " ").split(".")[0];
  const packages = getInstalledPackages();
  const gitShaShort = GIT_SHA.length > 7 ? GIT_SHA.slice(0, 7) : GIT_SHA;
  const imageTag = `npm-demo:${BUILD_NUMBER}`;
  const cloudsmithPackageUrl = `https://app.cloudsmith.com/${CLOUDSMITH_WORKSPACE}/r/${CLOUDSMITH_REPOSITORY}/`;

  const depRows = packages
    .map(
      (pkg) => `
                    <tr>
                        <td>${pkg.name}</td>
                        <td><span class="version-badge">${pkg.version}</span></td>
                    </tr>`
    )
    .join("");

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Cloudsmith Node.js Demo</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
                min-height: 100vh;
                color: #fff;
                padding: 2rem;
            }
            .container {
                max-width: 960px;
                margin: 0 auto;
            }
            header {
                text-align: center;
                margin-bottom: 2rem;
            }
            .logo {
                font-size: 3rem;
                font-weight: 700;
                background: linear-gradient(90deg, #00d4ff, #7b2cbf);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
                margin-bottom: 0.25rem;
            }
            .subtitle {
                color: #a0a0a0;
                font-size: 1.1rem;
            }
            .version-banner {
                display: inline-flex;
                align-items: center;
                gap: 0.75rem;
                background: rgba(0, 212, 255, 0.15);
                border: 1px solid rgba(0, 212, 255, 0.3);
                border-radius: 20px;
                padding: 0.4rem 1rem;
                margin-top: 0.75rem;
                font-size: 0.9rem;
            }
            .version-banner a {
                color: #00d4ff;
                text-decoration: none;
                font-weight: 500;
            }
            .version-banner a:hover {
                text-decoration: underline;
            }
            .card {
                background: rgba(255, 255, 255, 0.05);
                border-radius: 16px;
                padding: 1.5rem;
                margin-bottom: 1.5rem;
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.1);
            }
            .card h2 {
                color: #00d4ff;
                margin-bottom: 1rem;
                font-size: 1.3rem;
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }
            .info-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 1rem;
            }
            .info-item {
                background: rgba(0, 212, 255, 0.1);
                padding: 1rem;
                border-radius: 8px;
            }
            .info-label {
                color: #888;
                font-size: 0.85rem;
                text-transform: uppercase;
                letter-spacing: 0.05em;
            }
            .info-value {
                color: #fff;
                font-size: 1.1rem;
                font-weight: 500;
                margin-top: 0.25rem;
                word-break: break-all;
            }

            /* Pipeline */
            .pipeline {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 0;
                padding: 1rem 0;
            }
            .pipeline-step {
                background: rgba(0, 212, 255, 0.1);
                border: 1px solid rgba(0, 212, 255, 0.25);
                border-radius: 10px;
                padding: 0.6rem 0.75rem;
                text-align: center;
                flex: 1 1 0;
                min-width: 0;
            }
            .pipeline-step .step-label {
                font-size: 0.7rem;
                color: #888;
                text-transform: uppercase;
                letter-spacing: 0.05em;
            }
            .pipeline-step .step-value {
                font-weight: 600;
                margin-top: 0.2rem;
                font-size: 0.85rem;
            }
            .pipeline-arrow {
                color: #00d4ff;
                font-size: 1.2rem;
                padding: 0 0.15rem;
                flex-shrink: 0;
            }

            /* Dependencies table */
            .dep-table {
                width: 100%;
                border-collapse: collapse;
                max-height: 260px;
                display: block;
                overflow-y: auto;
            }
            .dep-table thead {
                position: sticky;
                top: 0;
                background: #16213e;
            }
            .dep-table th {
                text-align: left;
                padding: 0.5rem 0.75rem;
                color: #888;
                font-size: 0.85rem;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                border-bottom: 1px solid rgba(255,255,255,0.1);
            }
            .dep-table td {
                padding: 0.4rem 0.75rem;
                border-bottom: 1px solid rgba(255,255,255,0.05);
                font-size: 0.9rem;
            }
            .dep-source {
                color: #00d4ff;
                font-size: 0.8rem;
                margin-top: 0.75rem;
            }
            .dep-source a {
                color: #00d4ff;
            }
            .version-badge {
                background: rgba(123, 44, 191, 0.3);
                padding: 0.15rem 0.5rem;
                border-radius: 10px;
                font-size: 0.85rem;
                font-family: monospace;
            }

            .endpoints {
                display: flex;
                flex-wrap: wrap;
                gap: 0.75rem;
            }
            .endpoint {
                background: linear-gradient(135deg, #7b2cbf, #00d4ff);
                padding: 0.5rem 1rem;
                border-radius: 20px;
                text-decoration: none;
                color: #fff;
                font-weight: 500;
                transition: transform 0.2s, box-shadow 0.2s;
            }
            .endpoint:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 15px rgba(0, 212, 255, 0.3);
            }
            .status {
                display: inline-flex;
                align-items: center;
                gap: 0.5rem;
            }
            .status-dot {
                width: 10px;
                height: 10px;
                background: #00ff88;
                border-radius: 50%;
                animation: pulse 2s infinite;
            }
            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
            }
            .counter {
                font-size: 2.5rem;
                font-weight: 700;
                color: #00d4ff;
            }
            footer {
                text-align: center;
                margin-top: 3rem;
                color: #666;
            }
            footer a {
                color: #00d4ff;
                text-decoration: none;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <header>
                <div class="logo">Cloudsmith</div>
                <p class="subtitle">Node.js Demo Application</p>
                <div class="version-banner">
                    <span>${imageTag}</span>
                    <span style="color:#555;">|</span>
                    <span>sha: <code>${gitShaShort}</code></span>
                    <span style="color:#555;">|</span>
                    <a href="${cloudsmithPackageUrl}" target="_blank">View in Cloudsmith</a>
                </div>
            </header>

            <div class="card">
                <h2><span class="status"><span class="status-dot"></span></span> Application Status</h2>
                <div class="info-grid">
                    <div class="info-item">
                        <div class="info-label">Status</div>
                        <div class="info-value">Running</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Server Time</div>
                        <div class="info-value">${currentTime}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Page Views</div>
                        <div class="info-value counter">${requestCount}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Build Date</div>
                        <div class="info-value">${BUILD_DATE}</div>
                    </div>
                </div>
            </div>

            <div class="card">
                <h2>Supply Chain Pipeline</h2>
                <div class="pipeline">
                    <div class="pipeline-step">
                        <div class="step-label">Source</div>
                        <div class="step-value">GitHub</div>
                    </div>
                    <div class="pipeline-arrow">&rarr;</div>
                    <div class="pipeline-step">
                        <div class="step-label">Test</div>
                        <div class="step-value">npm test</div>
                    </div>
                    <div class="pipeline-arrow">&rarr;</div>
                    <div class="pipeline-step">
                        <div class="step-label">Dependencies</div>
                        <div class="step-value">Cloudsmith NPM</div>
                    </div>
                    <div class="pipeline-arrow">&rarr;</div>
                    <div class="pipeline-step">
                        <div class="step-label">Base Image</div>
                        <div class="step-value">Chainguard</div>
                    </div>
                    <div class="pipeline-arrow">&rarr;</div>
                    <div class="pipeline-step">
                        <div class="step-label">Registry</div>
                        <div class="step-value">Cloudsmith Docker</div>
                    </div>
                    <div class="pipeline-arrow">&rarr;</div>
                    <div class="pipeline-step" style="border-color: #00ff88;">
                        <div class="step-label">Running</div>
                        <div class="step-value" style="color: #00ff88;">This App</div>
                    </div>
                </div>
            </div>

            <div class="card">
                <h2>Container Information</h2>
                <div class="info-grid">
                    <div class="info-item">
                        <div class="info-label">Hostname</div>
                        <div class="info-value">${info.hostname}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Platform</div>
                        <div class="info-value">${info.platform}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Architecture</div>
                        <div class="info-value">${info.architecture}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Node.js Version</div>
                        <div class="info-value">${info.node_version}</div>
                    </div>
                </div>
            </div>

            <div class="card">
                <h2>NPM Dependencies</h2>
                <table class="dep-table">
                    <thead>
                        <tr>
                            <th>Package</th>
                            <th>Version</th>
                        </tr>
                    </thead>
                    <tbody>${depRows}
                    </tbody>
                </table>
                <p class="dep-source">
                    Installed from
                    <a href="https://app.cloudsmith.com/${CLOUDSMITH_WORKSPACE}/r/${CLOUDSMITH_REPOSITORY}/"
                       target="_blank">
                        cloudsmith.io/${CLOUDSMITH_WORKSPACE}/${CLOUDSMITH_REPOSITORY}
                    </a>
                </p>
            </div>

            <div class="card">
                <h2>API Endpoints</h2>
                <div class="endpoints">
                    <a href="/health" class="endpoint">GET /health</a>
                    <a href="/api/info" class="endpoint">GET /api/info</a>
                    <a href="/api/stats" class="endpoint">GET /api/stats</a>
                    <a href="/api/deps" class="endpoint">GET /api/deps</a>
                </div>
            </div>

            <footer>
                <p>Built with Express &bull; Deployed via <a href="https://cloudsmith.com">Cloudsmith</a></p>
            </footer>
        </div>
    </body>
    </html>
    `;

  res.send(html);
});

app.get("/health", (_req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

app.get("/api/info", (_req, res) => {
  const info = getSystemInfo();
  res.json({
    ...info,
    timestamp: new Date().toISOString(),
    build_number: BUILD_NUMBER,
    build_date: BUILD_DATE,
    git_sha: GIT_SHA,
  });
});

app.get("/api/stats", (_req, res) => {
  res.json({
    request_count: requestCount,
    version: "1.0.0",
    build_number: BUILD_NUMBER,
  });
});

app.get("/api/deps", (_req, res) => {
  const packages = getInstalledPackages();
  res.json({
    format: "cloudsmith-sbom-lite",
    generated_at: new Date().toISOString(),
    build_number: BUILD_NUMBER,
    git_sha: GIT_SHA,
    source_repo: `${CLOUDSMITH_WORKSPACE}/${CLOUDSMITH_REPOSITORY}`,
    node_version: process.version,
    architecture: os.arch(),
    packages,
  });
});

const server = app.listen(PORT, () => {
  console.log(`Cloudsmith demo app listening on port ${PORT}`);
});

module.exports = { app, server };
