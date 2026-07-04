import type { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { randomInt } from 'crypto';
import { enqueue } from 'express-file-cluster/tasks';
import { requireServiceOrUser } from '../../middlewares/serviceAuth.js';
import { FavouriteAccount } from '../../model/FavouriteAccount.js';
import { Transaction } from '../../model/Transaction.js';
import { User } from '../../model/User.js';
import { redis } from '../../lib/redis.js';

const LOG_TAG = '[transfer/initiate]';
const OTP_TTL_SECONDS = 5 * 60;
const isProd = process.env.NODE_ENV === 'production';

export const middlewares = [requireServiceOrUser('user')];
export const POST = async (req: Request, res: Response) => {
  const { clientId, amount, accountNumber } = req.body;
  console.log(LOG_TAG, 'request received', { clientId, amount, accountNumber });

  if (!clientId || !amount || !accountNumber) {
    console.log(LOG_TAG, 'rejected: missing required field(s)', { clientId, amount, accountNumber });
    return res.status(400).json({ error: 'clientId, amount and accountNumber are required' });
  }

  const authUser = (req as any).user;
  if (authUser.id !== clientId) {
    console.log(LOG_TAG, 'rejected: clientId mismatch', { authUserId: authUser.id, clientId });
    return res.status(403).json({ error: 'Forbidden: clientId does not match authenticated user.' });
  }

  const user = await User.findById(clientId);
  if (!user) {
    console.log(LOG_TAG, 'rejected: user not found', { clientId });
    return res.status(401).json({ error: 'User not found' });
  }

  let favourite;
  try {
    favourite = await FavouriteAccount.findOne({ userId: clientId, accountNumber });
    console.log(LOG_TAG, favourite ? 'favourite match found' : 'no favourite match', { clientId, accountNumber, nickname: favourite?.nickname });
  } catch (err) {
    console.error(LOG_TAG, 'favourite lookup failed', { clientId, accountNumber }, err);
    favourite = null;
  }

  const transaction = await Transaction.create({
    clientId,
    amount,
    toAccount: accountNumber,
    nickname: favourite?.nickname,
    status: 'pending',
  });
  console.log(LOG_TAG, 'transaction stored', { transactionId: transaction.id, clientId, amount, toAccount: accountNumber });

  const otp = randomInt(100000, 1000000).toString();
  const otpHash = await bcrypt.hash(otp, 10);
  const otpKey = `otp:txn:${transaction.id}`;
  await redis.set(otpKey, otpHash, 'EX', OTP_TTL_SECONDS);
  console.log(LOG_TAG, 'otp generated and stored, referencing transaction', { transactionId: transaction.id, otpKey, otp: isProd ? '[redacted]' : otp, ttlSeconds: OTP_TTL_SECONDS });

  try {
    await enqueue('SendEmail', {
      to: user.email,
      subject: 'Your GIBL Transfer Verification Code',
      body: `<p>Your one-time password to confirm transfer <strong>${transaction.id}</strong> is <strong>${otp}</strong>. It expires in 5 minutes. Do not share this code with anyone.</p>`,
    });
    console.log(LOG_TAG, 'otp email task enqueued', { transactionId: transaction.id, to: user.email });
  } catch (err) {
    console.error(LOG_TAG, 'failed to enqueue otp email task', { transactionId: transaction.id, to: user.email }, err);
    throw err;
  }

  return res.json({
    message: 'Transfer initiated. OTP sent to registered email.',
    transactionId: transaction.id,
    toAccount: accountNumber,
    nickname: favourite?.nickname,
  });
};


import type { RouteMeta } from 'express-file-cluster';
export const meta: RouteMeta = {
  POST: {
    description: 'Initiates a fund transfer to a destination accountNumber and stores it as a pending Transaction record. If that accountNumber matches one of the authenticated user\'s saved favourite accounts, its nickname is included in the response; otherwise the transfer proceeds as a plain account-number transfer. An OTP referencing the created transactionId is emailed to the user and must be confirmed via /transfer/confirm.',
    request: { body: { clientId: '', amount: 0, accountNumber: '' } },
    response: { status: 200, body: { message: '', transactionId: '', toAccount: '', nickname: '' } }
  }
};
