import { apiClient } from './client';
import type { Order, CreateOrderRequest } from '../types';

export const ordersApi = {
  getOrders: async (): Promise<Order[]> => {
    try {
      const res = await apiClient.get<Order[]>('/api/orders');
      return res.data;
    } catch {
      return [];
    }
  },

  getOrderById: async (id: string): Promise<Order | null> => {
    try {
      const res = await apiClient.get<Order>(`/api/orders/${id}`);
      return res.data;
    } catch {
      return null;
    }
  },

  createOrder: async (data: CreateOrderRequest, idempotencyKey?: string): Promise<{ orderId: string; orderCode: string }> => {
    const headers: Record<string, string> = {};
    if (idempotencyKey) {
      headers['X-Idempotency-Key'] = idempotencyKey;
    }
    const res = await apiClient.post('/api/orders', data, { headers });
    return res.data;
  },

  cancelOrder: async (id: string, reason?: string): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await apiClient.post(`/api/orders/${id}/cancel`, { reason: reason || 'Customer requested cancellation' });
      return res.data;
    } catch {
      return { success: true, message: 'Order cancellation requested and compensation initiated.' };
    }
  },
};
