import assert from "node:assert/strict";
import test from "node:test";
import request from "supertest";

type TransportMode = "cookie" | "bearer";

const baseEnv = {
  NODE_ENV: "test",
  PORT: "5001",
  MONGO_URI: "mongodb://localhost:27017/test-db",
  JWT_ACCESS_SECRET: "test-access-secret-12345",
  JWT_REFRESH_SECRET: "test-refresh-secret-12345",
  ACCESS_TOKEN_TTL: "15m",
  REFRESH_TOKEN_TTL: "7d",
  AUTH_COOKIE_SAME_SITE: "lax",
  AUTH_RATE_LIMIT_POINTS: "1000",
  AUTH_RATE_LIMIT_DURATION: "60",
  AUTH_LOGIN_LIMIT_POINTS: "1000",
  AUTH_LOGIN_LIMIT_DURATION: "60",
  AUTH_LOGIN_LIMIT_BLOCK_DURATION: "60",
};

const clearModule = (path: string): void => {
  try {
    delete require.cache[require.resolve(path)];
  } catch {
    // Module may not be loaded yet for this test phase.
  }
};

const resetAppImports = (): void => {
  clearModule("../../app");
  clearModule("../../loaders");
  clearModule("../../loaders/index");
  clearModule("../../loaders/config.loader");
  clearModule("../../loaders/middleware.loader");
  clearModule("../../loaders/route.loader");
  clearModule("../../routes");
  clearModule("../../routes/index");
  clearModule("../../config/env");
  clearModule("../../config/constants");
  clearModule("../../middlewares/csrf.middleware");
  clearModule("./auth.routes");
  clearModule("./auth.controller");
  clearModule("./auth.transport");
};

const loadApp = async (mode: TransportMode) => {
  Object.assign(process.env, baseEnv, { AUTH_TRANSPORT_MODE: mode });
  resetAppImports();
  const appModule = await import("../../app");
  return appModule.default;
};

const extractCookieToken = (
  setCookie: string | string[] | undefined,
  cookieName: string
): string | null => {
  if (!setCookie) {
    return null;
  }

  const cookies = Array.isArray(setCookie) ? setCookie : [setCookie];
  const target = cookies.find((cookie) => cookie.startsWith(`${cookieName}=`));
  if (!target) {
    return null;
  }

  const valuePart = target.split(";")[0];
  return valuePart.substring(cookieName.length + 1);
};

test("cookie mode issues csrf token and enforces csrf validation", async () => {
  const app = await loadApp("cookie");
  const agent = request.agent(app);

  const csrfResponse = await agent.get("/api/v1/auth/csrf-token");
  assert.equal(csrfResponse.status, 200);
  assert.equal(typeof csrfResponse.body?.data?.csrfToken, "string");
  assert.ok(csrfResponse.body?.data?.csrfToken.length > 0);

  const issuedCsrfToken = extractCookieToken(csrfResponse.headers["set-cookie"], "csrf_token");
  assert.ok(issuedCsrfToken);

  const blockedLogoutResponse = await agent.post("/api/v1/auth/logout").send({});
  assert.equal(blockedLogoutResponse.status, 403);

  const allowedLogoutResponse = await agent
    .post("/api/v1/auth/logout")
    .set("x-csrf-token", issuedCsrfToken as string)
    .send({});
  assert.equal(allowedLogoutResponse.status, 200);
});

test("bearer mode does not require csrf and requires refresh token for refresh endpoint", async () => {
  const app = await loadApp("bearer");

  const csrfResponse = await request(app).get("/api/v1/auth/csrf-token");
  assert.equal(csrfResponse.status, 200);
  assert.equal(csrfResponse.body?.data?.csrfToken, null);
  assert.equal(csrfResponse.headers["set-cookie"], undefined);

  const refreshResponse = await request(app).post("/api/v1/auth/refresh").send({});
  assert.equal(refreshResponse.status, 400);
  assert.match(refreshResponse.body?.message, /Refresh token is required/i);
});
