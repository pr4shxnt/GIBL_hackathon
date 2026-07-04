import { defineModel } from 'express-file-cluster';

export interface TransactionDocument {
  clientId: string;
  amount: number;
  toAccount: string;
  nickname?: string;
  status: string;
}

export const Transaction = defineModel<TransactionDocument>('Transaction', {
  clientId:  { type: 'string', required: true },
  amount:    { type: 'number', required: true },
  toAccount: { type: 'string', required: true },
  nickname:  { type: 'string' },
  status:    { type: 'string', required: true, default: 'pending' },
});
