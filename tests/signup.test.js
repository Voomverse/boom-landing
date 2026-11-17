import test from "node:test";
import assert from "node:assert/strict";
import { Readable } from "node:stream";
import { handleSignup } from "../server/signup.js";

const env = {
  BLOB_READ_WRITE_TOKEN: "test-only-secret",
  VITE_PRIVACY_POLICY_URL: "https://example.com/privacy",
};
const signup = {
  action: "signup",
  celebrity: "Rosalía",
  email: "FAN@example.com",
  variant: "ven",
  adult: true,
  consent: true,
};
const headers = {
  "content-type": "application/json",
  origin: "https://voomverse.com",
  host: "voomverse.com",
};
const request = (body) => ({ method: "POST", headers, body });
const writes = [];
const deps = {
  env,
  put: async (...args) => writes.push(args),
  uuid: () => "11111111-1111-4111-8111-111111111111",
  now: () => 1800000000000,
};

test("signup is saved privately with consent before a receipt is returned", async () => {
  writes.length = 0;
  const result = await handleSignup(request(signup), deps);
  assert.equal(result.status, 201);
  assert.ok(result.body.receipt);
  assert.equal(writes.length, 1);
  const [path, raw, options] = writes[0];
  assert.match(path, /^signups\/.*\.json$/);
  const data = JSON.parse(raw);
  assert.equal(data.email, "fan@example.com");
  assert.equal(data.celebrity, "Rosalía");
  assert.equal(data.consent, true);
  assert.equal(data.privacyPolicyUrl, env.VITE_PRIVACY_POLICY_URL);
  assert.equal(options.access, "private");
  assert.ok(!JSON.stringify(result.body).includes(signup.email));
});
test("signed receipt links plan selection to the saved signup", async () => {
  const { body } = await handleSignup(request(signup), deps);
  const result = await handleSignup(
    request({ action: "preference", receipt: body.receipt, plan: "ven" }),
    deps,
  );
  assert.equal(result.status, 201);
  assert.equal(
    JSON.parse(writes.at(-1)[1]).signupId,
    "11111111-1111-4111-8111-111111111111",
  );
  assert.equal(JSON.parse(writes.at(-1)[1]).plan, "ven");
});
test("every supplied campaign and plan value is accepted", async () => {
  for (const variant of ["ven", "secreto", "antes-de-morir", "quanta"]) {
    const { body, status } = await handleSignup(
      request({ ...signup, variant }),
      deps,
    );
    assert.equal(status, 201);
    for (const plan of ["monthly", "annual", "ven", "none"])
      assert.equal(
        (
          await handleSignup(
            request({ action: "preference", receipt: body.receipt, plan }),
            deps,
          )
        ).status,
        201,
      );
  }
});
test("invalid input never reaches storage", async () => {
  let count = 0;
  const local = { ...deps, put: async () => count++ };
  for (const patch of [
    { celebrity: "" },
    { celebrity: "x".repeat(121) },
    { celebrity: "bad\nname" },
    { email: "bad" },
    { adult: false },
    { adult: "true" },
    { consent: false },
    { variant: "invalid" },
    { website: "spam" },
  ])
    assert.equal(
      (await handleSignup(request({ ...signup, ...patch }), local)).status,
      400,
    );
  assert.equal(count, 0);
});
test("private storage failure cannot return a success receipt", async () => {
  const result = await handleSignup(request(signup), {
    ...deps,
    put: async () => {
      throw Error("unavailable");
    },
  });
  assert.equal(result.status, 503);
  assert.equal(result.body.receipt, undefined);
});
test("missing token or invalid policy override blocks enrollment", async () => {
  for (const config of [
    {},
    {
      BLOB_READ_WRITE_TOKEN: "test-only-token",
      VITE_PRIVACY_POLICY_URL: "http://insecure.example/privacy",
    },
    { VITE_PRIVACY_POLICY_URL: env.VITE_PRIVACY_POLICY_URL },
  ])
    assert.equal(
      (await handleSignup(request(signup), { ...deps, env: config })).status,
      503,
    );
});
test("expired, malformed, and tampered receipts cannot write preferences", async () => {
  const { body } = await handleSignup(request(signup), deps);
  for (const receipt of [
    "invalid",
    body.receipt + "x",
    body.receipt + ".extra",
  ])
    assert.equal(
      (
        await handleSignup(
          request({ action: "preference", plan: "ven", receipt }),
          deps,
        )
      ).status,
      401,
    );
  assert.equal(
    (
      await handleSignup(
        request({ action: "preference", plan: "ven", receipt: body.receipt }),
        { ...deps, now: () => body.expiresAt + 1 },
      )
    ).status,
    401,
  );
});
test("campaign deadline enforced at server", async () => {
  assert.equal(
    (
      await handleSignup(request(signup), {
        ...deps,
        env: { ...env, VITE_CAMPAIGN_END: "2020-01-01T00:00:00Z" },
      })
    ).status,
    410,
  );
});
test("invalid deadline fails closed", async () => {
  assert.equal(
    (
      await handleSignup(request(signup), {
        ...deps,
        env: { ...env, VITE_CAMPAIGN_END: "invalid" },
      })
    ).status,
    503,
  );
});
test("method, media type, origin, malformed JSON and body limits enforced", async () => {
  assert.equal(
    (await handleSignup({ ...request(signup), method: "GET" }, deps)).status,
    405,
  );
  assert.equal(
    (
      await handleSignup(
        {
          ...request(signup),
          headers: { ...headers, "content-type": "text/plain" },
        },
        deps,
      )
    ).status,
    415,
  );
  assert.equal(
    (
      await handleSignup(
        {
          ...request(signup),
          headers: { ...headers, origin: "https://evil.example" },
        },
        deps,
      )
    ).status,
    403,
  );
  assert.equal((await handleSignup(request("{bad"), deps)).status, 400);
  assert.equal(
    (await handleSignup(request("x".repeat(4097)), deps)).status,
    413,
  );
  const stream = Readable.from([JSON.stringify(signup)]);
  stream.headers = headers;
  stream.method = "POST";
  assert.equal((await handleSignup(stream, deps)).status, 201);
  const oversized = Readable.from(["x".repeat(4097)]);
  oversized.headers = headers;
  oversized.method = "POST";
  assert.equal((await handleSignup(oversized, deps)).status, 413);
});

test("bundled VEN policy is the default when only private storage is configured", async () => {
  const saved = [];
  const result = await handleSignup(request(signup), {
    ...deps,
    env: { BLOB_READ_WRITE_TOKEN: "test-only-secret" },
    put: async (...args) => saved.push(args),
  });
  assert.equal(result.status, 201);
  const record = JSON.parse(saved[0][1]);
  assert.equal(record.privacyPolicyUrl, "/privacidad/");
  assert.equal(record.privacyPolicyVersion, "ven-2026-11-17");
});
