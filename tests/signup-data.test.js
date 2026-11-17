import test from "node:test";
import assert from "node:assert/strict";
import { handleSignup } from "../server/signup.js";
import { approximateLocation, signupPath } from "../server/signup-data.js";
import { memoryBlob } from "./helpers/memory-blob.js";

const env = { BLOB_READ_WRITE_TOKEN: "test-only-secret" };
const input = {
  action: "signup",
  email: "fan@example.com",
  celebrity: "Rosalía",
  adult: true,
  consent: true,
  variant: "ven",
};
const request = (body = input, headers = {}) => ({
  method: "POST",
  headers: { "content-type": "application/json", ...headers },
  body,
});

test("repeat emails across case, whitespace and campaigns cannot overwrite signup or issue a receipt", async () => {
  const store = memoryBlob();
  const deps = { env, ...store };
  assert.equal((await handleSignup(request(), deps)).status, 201);
  const original = [...store.records.values()][0];
  for (const variant of ["ven", "secreto", "antes-de-morir", "quanta"]) {
    const result = await handleSignup(
      request({ ...input, email: " FAN@EXAMPLE.COM ", variant }),
      deps,
    );
    assert.equal(result.status, 409);
    assert.equal(result.body.receipt, undefined);
  }
  assert.equal(store.writes.length, 1);
  assert.equal([...store.records.values()][0], original);
  assert.equal(store.writes[0][2].allowOverwrite, false);
  assert.ok(!store.writes[0][0].includes(input.email));
});
test("simultaneous submissions keep exactly one signup", async () => {
  const store = memoryBlob();
  const outcomes = await Promise.all(
    Array.from({ length: 5 }, () => handleSignup(request(), { env, ...store })),
  );
  assert.equal(outcomes.filter((r) => r.status === 201).length, 1);
  assert.equal(outcomes.filter((r) => r.status === 409).length, 4);
  assert.equal(store.records.size, 1);
  assert.equal(store.writes.length, 1);
});
test("existing dated signup folders are checked with pagination without deleting data", async () => {
  const original = {
    "signups/2026-11-15/older.json": {
      id: "older",
      email: "other@example.com",
    },
    "signups/2026-11-16/a.json": { id: "one", email: "one@example.com" },
    "signups/2026-11-16/z.json": { id: "existing", email: "FAN@example.com" },
    [signupPath("new-format@example.com")]: { email: "new-format@example.com" },
  };
  const store = memoryBlob(original, 1);
  const result = await handleSignup(request(), { env, ...store });
  assert.equal(result.status, 409);
  assert.equal(store.writes.length, 0);
  assert.equal(store.records.size, 4);
});
test("a different email can register alongside existing records", async () => {
  const store = memoryBlob({
    "signups/2026-11-15/a.json": { id: "old", email: "old@example.com" },
  });
  assert.equal((await handleSignup(request(), { env, ...store })).status, 201);
  assert.equal(store.records.size, 2);
});
test("duplicate-read outages fail without writing; expired deadlines still reject first", async () => {
  let writes = 0;
  const deps = {
    env,
    get: async () => {
      throw new Error("Storage unavailable");
    },
    list: async () => ({}),
    put: async () => writes++,
  };
  assert.equal((await handleSignup(request(), deps)).status, 503);
  assert.equal(writes, 0);
  assert.equal(
    (
      await handleSignup(request(), {
        ...deps,
        env: { ...env, VITE_CAMPAIGN_END: "2020-01-01T00:00:00Z" },
      })
    ).status,
    410,
  );
});
test("legacy reads must succeed before accepting a new email", async () => {
  const store = memoryBlob({
    "signups/2026-11-15/a.json": { email: "old@example.com" },
  });
  const result = await handleSignup(request(), {
    env,
    ...store,
    get: async (path) => {
      if (path.startsWith("signups/by-email/")) return null;
      throw new Error("unavailable");
    },
  });
  assert.equal(result.status, 503);
  assert.equal(store.writes.length, 0);
});
test("Vercel country, region and encoded city are saved privately with the signup", async () => {
  const store = memoryBlob();
  const result = await handleSignup(
    request(input, {
      "x-vercel-ip-country": "ES",
      "x-vercel-ip-country-region": "PV",
      "x-vercel-ip-city": "San%20Sebasti%C3%A1n",
      "x-forwarded-for": "192.0.2.1",
      "x-vercel-ip-latitude": "43.3",
    }),
    { ...store, env: { ...env, VERCEL: "1" } },
  );
  assert.equal(result.status, 201);
  const record = JSON.parse(store.writes[0][1]);
  assert.deepEqual(record.location, {
    country: "ES",
    region: "PV",
    city: "San Sebastián",
    source: "vercel-ip",
    accuracy: "approximate",
  });
  assert.ok(!JSON.stringify(record).includes("192.0.2.1"));
  assert.ok(!Object.hasOwn(record.location, "latitude"));
  assert.equal(store.writes[0][2].access, "private");
});
test("missing location is allowed and arbitrary client location is ignored", async () => {
  const store = memoryBlob();
  const result = await handleSignup(
    request(
      { ...input, location: { city: "Fake" } },
      { "x-vercel-ip-city": "Fake" },
    ),
    { env, ...store },
  );
  assert.equal(result.status, 201);
  assert.equal(JSON.parse(store.writes[0][1]).location, null);
  assert.equal(approximateLocation({}, { VERCEL: "1" }), null);
});
test("malformed and oversized geo headers are discarded", () => {
  const location = approximateLocation(
    {
      "x-vercel-ip-country": "INVALID",
      "x-vercel-ip-country-region": "x".repeat(600),
      "x-vercel-ip-city": "%bad%",
    },
    { VERCEL: "1" },
  );
  assert.equal(location, null);
});
