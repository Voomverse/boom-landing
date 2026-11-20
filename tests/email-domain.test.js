import assert from "node:assert/strict";
import test from "node:test";
import { checkSignupEmailDomain } from "../server/email-domain.js";

const dnsError = (code) => Object.assign(new Error(code), { code });
const absent = async () => { throw dnsError("ENODATA"); };
const unexpected = async () => assert.fail("Unexpected DNS lookup");

test("mail domains use their MX records and support internationalized names", async () => {
  assert.equal(await checkSignupEmailDomain("person@mañana.com", {
    resolveMx: async (domain) => {
      assert.equal(domain, "xn--maana-pta.com");
      return [{ exchange: "mail.example.test", priority: 10 }];
    },
    resolve4: unexpected,
    resolve6: unexpected,
  }), true);
});

test("nonexistent domains and null MX do not use address fallback", async () => {
  for (const resolveMx of [
    async () => { throw dnsError("ENOTFOUND"); },
    async () => [{ exchange: ".", priority: 0 }],
    async () => [{ exchange: "", priority: 0 }],
  ]) {
    assert.equal(await checkSignupEmailDomain("person@example.test", {
      resolveMx, resolve4: unexpected, resolve6: unexpected,
    }), false);
  }
});

test("when there is no MX, A or AAAA mail fallback remains valid", async () => {
  for (const addresses of [
    { resolve4: async () => ["192.0.2.10"], resolve6: absent },
    { resolve4: absent, resolve6: async () => ["2001:db8::10"] },
  ]) {
    assert.equal(await checkSignupEmailDomain("person@example.test", {
      resolveMx: absent, ...addresses,
    }), true);
  }
  assert.equal(await checkSignupEmailDomain("person@example.test", {
    resolveMx: absent, resolve4: absent, resolve6: absent,
  }), false);
});

test("malformed domains do not trigger DNS lookups", async () => {
  for (const domain of ["example.test/path", "-example.test", "bad_label.test", "127.0.0.1"]) {
    assert.equal(await checkSignupEmailDomain(`person@${domain}`, {
      resolveMx: unexpected, resolve4: unexpected, resolve6: unexpected,
    }), false);
  }
});

test("DNS failures are retryable unless a valid address is already known", async () => {
  const timeout = async () => { throw dnsError("ETIMEOUT"); };
  await assert.rejects(checkSignupEmailDomain("person@example.test", {
    resolveMx: timeout, resolve4: unexpected, resolve6: unexpected,
  }), { code: "ETIMEOUT" });
  await assert.rejects(checkSignupEmailDomain("person@example.test", {
    resolveMx: absent, resolve4: timeout, resolve6: absent,
  }), { code: "ETIMEOUT" });
  assert.equal(await checkSignupEmailDomain("person@example.test", {
    resolveMx: absent, resolve4: timeout, resolve6: async () => ["2001:db8::10"],
  }), true);
});
