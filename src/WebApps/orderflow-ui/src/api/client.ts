import axios from 'axios';

export const apiClient = axios.create({
  baseURL: '',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const inventoryApi = {
  getProducts: async () => {
    const res = await apiClient.get('/api/inventory/products');
    return res.data;
  },
  seedProducts: async () => {
    const res = await apiClient.post('/api/inventory/seed');
    return res.data;
  },
};

export const ordersApi = {
  getOrders: async () => {
    const res = await apiClient.get('/api/orders');
    return res.data;
  },
  getOrderById: async (id: string) => {
    const res = await apiClient.get(`/api/orders/${id}`);
    return res.data;
  },
  createOrder: async (data: any, idempotencyKey?: string) => {
    const headers: Record<string, string> = {};
    if (idempotencyKey) {
      headers['X-Idempotency-Key'] = idempotencyKey;
    }
    const res = await apiClient.post('/api/orders', data, { headers });
    return res.data;
  },
};

export const paymentApi = {
  simulatePayment: async (data: any) => {
    const res = await apiClient.post('/api/payments/simulate', data);
    return res.data;
  },
  getPaymentByOrderId: async (orderId: string) => {
    const res = await apiClient.get(`/api/payments/${orderId}`);
    return res.data;
  },
};
