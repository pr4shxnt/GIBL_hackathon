import type { Request, Response } from "express";
import bcrypt from "bcrypt";
import { randomInt } from "crypto";
import { enqueue } from "express-file-cluster/tasks";
import { User } from "../../model/User.js";
import { redis } from "../../lib/redis.js";
import { requireServiceOrUser } from "../../middlewares/serviceAuth.js";

const OTP_TTL_SECONDS = 5 * 60;
const LOG_TAG = "[otp/send]";
const isProd = process.env.NODE_ENV === "production";

export const middlewares = [requireServiceOrUser("user")];
export const POST = async (req: Request, res: Response) => {
  const { clientId } = req.body;
  console.log(LOG_TAG, "request received", { clientId });

  if (!clientId) {
    console.log(LOG_TAG, "rejected: missing clientId");
    return res.status(401).json({ error: "clientId is required" });
  }

  const authUser = (req as any).user;
  if (authUser.id !== clientId) {
    console.log(LOG_TAG, "rejected: clientId mismatch", { authUserId: authUser.id, clientId });
    return res.status(403).json({ error: "Forbidden: clientId does not match authenticated user." });
  }

  const user = await User.findById(clientId);
  if (!user) {
    console.log(LOG_TAG, "rejected: user not found", { clientId });
    return res.status(401).json({ error: "User not found" });
  }

  const otp = randomInt(100000, 1000000).toString();
  console.log(LOG_TAG, "otp generated", { clientId, otp: isProd ? "[redacted]" : otp, ttlSeconds: OTP_TTL_SECONDS });

  const otpHash = await bcrypt.hash(otp, 10);
  await redis.set(`otp:${clientId}`, otpHash, "EX", OTP_TTL_SECONDS);
  console.log(LOG_TAG, "otp hash stored in redis", { key: `otp:${clientId}` });

  try {
    await enqueue("SendEmail", {
      to: user.email,
      subject: "Your GIBL Verification Code",
      body: `<p>Your one-time password is <strong>${otp}</strong>. It expires in 5 minutes. Do not share this code with anyone.</p>`,
    });
    console.log(LOG_TAG, "email task enqueued", { clientId, to: user.email });
  } catch (err) {
    console.error(LOG_TAG, "failed to enqueue email task", { clientId, to: user.email }, err);
    throw err;
  }

  return res.json({ message: "OTP sent to registered mobile/email." });
};

import type { RouteMeta } from "express-file-cluster";
export const meta: RouteMeta = {
  POST: {
    description:
      "Triggers the dispatch of a One-Time Password (OTP) to the user's registered email for identity verification during sensitive operations.",
    request: { body: { clientId: "587" } },
    response: { status: 200, body: { message: "Enqueued." } },
  },
};
