import { Resolver } from "node:dns/promises";
import { domainToASCII } from "node:url";

const mailDns = new Resolver({ timeout: 1500, tries: 2 });
const absentRecord = new Set(["ENODATA", "ENOTFOUND"]);
const validLabel = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

function domainFromEmail(email) {
  const raw = email.slice(email.lastIndexOf("@") + 1);
  // Do not let URL parsing discard delimiters or decode an escaped hostname.
  if (/[\\/:?#%@\[\]\p{White_Space}\p{Cc}]/u.test(raw)) return null;
  const domain = domainToASCII(raw);
  const labels = domain.split(".");
  if (
    domain.length > 253 ||
    labels.length < 2 ||
    /^\d+$/.test(labels.at(-1)) ||
    labels.some((label) => !validLabel.test(label))
  )
    return null;
  return domain;
}

export async function checkSignupEmailDomain(email, resolver = mailDns) {
  const domain = domainFromEmail(email);
  if (!domain) return false;

  let mailServers;
  try {
    mailServers = await resolver.resolveMx(domain);
  } catch (error) {
    if (error.code === "ENOTFOUND") return false;
    if (error.code !== "ENODATA") throw error;
    mailServers = [];
  }

  // A null MX explicitly disclaims email. Node may represent its exchange as
  // an empty string or a dot. Do not try address records in this case.
  if (mailServers.length)
    return mailServers.some(({ exchange }) => exchange && exchange !== ".");

  // SMTP allows an implicit MX pointing at the domain's address when there
  // are no MX records. One working family is enough.
  const addresses = await Promise.allSettled([
    resolver.resolve4(domain),
    resolver.resolve6(domain),
  ]);
  if (addresses.some((result) => result.status === "fulfilled" && result.value.length > 0))
    return true;
  const failed = addresses.find(
    (result) => result.status === "rejected" && !absentRecord.has(result.reason?.code),
  );
  if (failed) throw failed.reason;
  return false;
}
