const { describe, it, after } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");

const { app, server } = require("../src/index.js");

function request(path) {
  return new Promise((resolve, reject) => {
    const addr = server.address();
    const url = `http://127.0.0.1:${addr.port}${path}`;
    http
      .get(url, (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => resolve({ status: res.statusCode, body }));
      })
      .on("error", reject);
  });
}

async function requestJson(path) {
  const res = await request(path);
  return { status: res.status, data: JSON.parse(res.body) };
}

after(() => server.close());

describe("index page", () => {
  it("returns 200 and contains Cloudsmith", async () => {
    const res = await request("/");
    assert.equal(res.status, 200);
    assert.ok(res.body.includes("Cloudsmith"));
  });

  it("contains the supply chain pipeline", async () => {
    const res = await request("/");
    assert.ok(res.body.includes("Supply Chain Pipeline"));
    assert.ok(res.body.includes("Chainguard"));
    assert.ok(res.body.includes("Cloudsmith Docker"));
  });

  it("shows NPM dependencies", async () => {
    const res = await request("/");
    assert.ok(res.body.includes("NPM Dependencies"));
    assert.ok(res.body.toLowerCase().includes("express"));
  });
});

describe("GET /health", () => {
  it("returns healthy status", async () => {
    const { status, data } = await requestJson("/health");
    assert.equal(status, 200);
    assert.equal(data.status, "healthy");
    assert.ok(data.timestamp);
  });
});

describe("GET /api/info", () => {
  it("returns system info with build metadata", async () => {
    const { status, data } = await requestJson("/api/info");
    assert.equal(status, 200);
    assert.ok(data.hostname);
    assert.ok(data.node_version);
    assert.ok(data.platform);
    assert.ok(data.build_number);
    assert.ok(data.build_date);
    assert.ok(data.git_sha);
  });
});

describe("GET /api/stats", () => {
  it("returns app statistics", async () => {
    const { status, data } = await requestJson("/api/stats");
    assert.equal(status, 200);
    assert.equal(typeof data.request_count, "number");
    assert.equal(data.version, "1.0.0");
    assert.ok(data.build_number);
  });
});

describe("GET /api/deps", () => {
  it("returns dependency list in sbom-lite format", async () => {
    const { status, data } = await requestJson("/api/deps");
    assert.equal(status, 200);
    assert.equal(data.format, "cloudsmith-sbom-lite");
    assert.ok(Array.isArray(data.packages));
    assert.ok(data.packages.length > 0);
    assert.ok(data.packages[0].name);
    assert.ok(data.packages[0].version);
    assert.ok(data.node_version);
    assert.ok(data.architecture);
  });
});
