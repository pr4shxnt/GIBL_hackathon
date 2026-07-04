import type { Request, Response } from 'express';
import { requireServiceOrUser } from '../../middlewares/serviceAuth.js';
import { Transaction } from '../../model/Transaction.js';

const STATEMENT_LIMIT = 5;

export const middlewares = [requireServiceOrUser('user')];
export const GET = async (req: Request, res: Response) => {
  const clientId = req.query.clientId as string;
  if (!clientId) return res.status(400).json({ error: 'clientId is required' });

  const authUser = (req as any).user;
  if (authUser.id !== clientId) {
    return res.status(403).json({ error: 'Forbidden: clientId does not match authenticated user.' });
  }

  const transactions = await Transaction.find({ clientId });
  const statements = (transactions as any[])
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, STATEMENT_LIMIT)
    .map((t) => ({
      id: t.id,
      date: t.createdAt,
      amount: -t.amount,
      description: `Transfer to ${t.nickname ?? t.toAccount} (${t.status})`,
    }));

  return res.json({ statements });
};


import type { RouteMeta } from 'express-file-cluster';
export const meta: RouteMeta = {
  GET: {
    description: 'Retrieves the authenticated user\'s 5 most recent fund transfers as account statement entries, newest first. Each entry\'s amount is shown as a negative (debit) figure and its description names the recipient (favourite nickname if known, else the raw destination) plus the transaction status (pending, confirmed, or failed).',
    request: { query: { clientId: '' } },
    response: { status: 200, body: { statements: [{ id: '1', date: '2026-01-01T00:00:00.000Z', amount: 0, description: '' }] } }
  }
};