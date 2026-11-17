import { put, get, list } from "@vercel/blob";
import { handleSignup } from "../server/signup.js";

export default async function handler(req, res) {
  const result = await handleSignup(req, { env: process.env, put, get, list });
  res.setHeader("Cache-Control", "no-store");
  if (result.headers)
    for (const [key, value] of Object.entries(result.headers))
      res.setHeader(key, value);
  return res.status(result.status).json(result.body);
}
