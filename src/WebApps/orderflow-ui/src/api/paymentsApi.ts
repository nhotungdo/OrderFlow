import { apiClient } from './client';
import type { PaymentTransaction } from '../types';

export const paymentsApi = {
  simulatePayment: async (data: {
    orderId: string;
    amount: number;
    paymentMethod: string;
    forceFailure?: boolean;
    failureReason?: string;
  }) => {
    const res = await apiClient.post('/api/payments/simulate', data);
    return res.data;
  },

  getPaymentByOrderId: async (orderId: string): Promise<PaymentTransaction | null> => {
    try {
      const res = await apiClient.get(`/api/payments/${orderId}`);
      return res.data;
    } catch {
      return null;
    }
  },

  getTransactions: async (): Promise<PaymentTransaction[]> => {
    try {
      const res = await apiClient.get<PaymentTransaction[]>('/api/payments/transactions');
      return res.data;
    } catch {
      // Mock ledger data for admin overview
      return [
        {
          id: 'TXN-9812-OK',
          orderId: 'ORD-9812',
          orderCode: 'ORD-9812',
          amount: 1199,
          paymentMethod: 'VISA-4242',
          status: 'Success',
          transactionTimeUtc: new Date(Date.now() - 600000).toISOString(),
          idempotencyKey: 'idemp-txn-9812',
        },
        {
          id: 'TXN-9811-FAIL',
          orderId: 'ORD-9811',
          orderCode: 'ORD-9811',
          amount: 3499,
          paymentMethod: 'FAIL_CARD',
          status: 'Failed',
          failureReason: 'Insufficient funds on credit card',
          transactionTimeUtc: new Date(Date.now() - 1500000).toISOString(),
          idempotencyKey: 'idemp-txn-9811',
        },
      ];
    }
  },
};
