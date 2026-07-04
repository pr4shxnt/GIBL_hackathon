import type { Request, Response } from "express";
import bcrypt from "bcrypt";
import { redis } from "../../lib/redis.js";
import { requireServiceOrUser } from "../../middlewares/serviceAuth.js";

const LOG_TAG = "[otp/verify]";
const isProd = process.env.NODE_ENV === "production";
const OTP_VERIFIED_TTL_SECONDS = 5 * 60;

export const middlewares = [requireServiceOrUser("user")];
export const POST = async (req: Request, res: Response) => {
  const { clientId, otp } = req.body;
  console.log(LOG_TAG, "request received", { clientId, otp: isProd ? "[redacted]" : otp });

  if (!clientId || !otp) {
    console.log(LOG_TAG, "rejected: missing clientId or otp");
    return res.status(400).json({ error: "clientId and otp are required" });
  }

  const authUser = (req as any).user;
  if (authUser.id !== clientId) {
    console.log(LOG_TAG, "rejected: clientId mismatch", { authUserId: authUser.id, clientId });
    return res.status(403).json({ error: "Forbidden: clientId does not match authenticated user." });
  }

  const key = `otp:${clientId}`;
  const otpHash = await redis.get(key);
  if (!otpHash) {
    console.log(LOG_TAG, "rejected: no otp hash found in redis (expired or never requested)", { key });
    return res
      .status(400)
      .json({ error: "OTP expired or not requested.", verified: false });
  }

  const match = await bcrypt.compare(otp, otpHash);
  console.log(LOG_TAG, "otp comparison result", { clientId, match });
  if (!match) {
    return res.status(400).json({ error: "Invalid OTP.", verified: false });
  }

  await redis.del(key);

  const verifiedKey = `otp-verified:${clientId}`;
  await redis.set(verifiedKey, "1", "EX", OTP_VERIFIED_TTL_SECONDS);
  console.log(LOG_TAG, "otp verified, key deleted from redis, verified flag set", { key, verifiedKey, ttlSeconds: OTP_VERIFIED_TTL_SECONDS });

  return res.json({ message: "OTP verified successfully.", verified: true });
};

import type { RouteMeta } from "express-file-cluster";
export const meta: RouteMeta = {
  POST: {
    description:
      "Validates a previously dispatched One-Time Password (OTP). Used as a standalone verification step or in conjunction with multi-factor authentication flows.",
    request: { body: { clientId: "", otp: "" } },
    response: { status: 200, body: { message: "", verified: true } },
  },
};
