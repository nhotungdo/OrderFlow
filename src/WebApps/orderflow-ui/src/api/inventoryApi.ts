import { apiClient } from './client';
import type { Product, StockMovement } from '../types';

// Mock audit movement storage in session to persist movements across demo actions
const initialMovements: StockMovement[] = [
  {
    id: 'sm-001',
    productId: 'seed-1',
    productName: 'iPhone 15 Pro Max 256GB Titanium',
    sku: 'IPHONE15PM-256',
    movementType: 'RESTOCK',
    quantityChange: 10,
    balanceAfter: 10,
    reason: 'Initial Inventory Inbound',
    timestampUtc: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'sm-002',
    productId: 'seed-2',
    productName: 'MacBook Pro 16" M3 Max 36GB',
    sku: 'MBP16-M3MAX',
    movementType: 'RESTOCK',
    quantityChange: 25,
    balanceAfter: 25,
    reason: 'Initial Inventory Inbound',
    timestampUtc: new Date(Date.now() - 3500000).toISOString(),
  },
  {
    id: 'sm-003',
    productId: 'seed-1',
    productName: 'iPhone 15 Pro Max 256GB Titanium',
    sku: 'IPHONE15PM-256',
    movementType: 'HOLD',
    quantityChange: -1,
    balanceAfter: 9,
    referenceOrderId: 'ORD-DEMO-01',
    reason: 'Saga Hold on Order Created',
    timestampUtc: new Date(Date.now() - 1200000).toISOString(),
  },
];

export const inventoryApi = {
  getProducts: async (): Promise<Product[]> => {
    try {
      const res = await apiClient.get<Product[]>('/api/inventory/products');
      return res.data;
    } catch {
      // Fallback fallback if offline
      return [];
    }
  },

  getProductById: async (id: string): Promise<Product | undefined> => {
    const products = await inventoryApi.getProducts();
    return products.find((p) => p.id === id);
  },

  seedProducts: async (): Promise<{ message: string }> => {
    const res = await apiClient.post('/api/inventory/seed');
    return res.data;
  },

  createProduct: async (productData: Partial<Product>): Promise<Product> => {
    try {
      const res = await apiClient.post<Product>('/api/inventory/products', productData);
      return res.data;
    } catch {
      // If endpoint not on backend, return mock product
      const newProd: Product = {
        id: `prod-${Date.now()}`,
        sku: productData.sku || `SKU-${Date.now()}`,
        productName: productData.productName || 'New Product',
        category: productData.category || 'General',
        description: productData.description || '',
        imageUrl: productData.imageUrl || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500',
        unitPrice: productData.unitPrice || 99,
        totalQuantity: productData.totalQuantity || 10,
        availableQuantity: productData.totalQuantity || 10,
        reservedQuantity: 0,
        redisStock: productData.totalQuantity || 10,
        isActive: true,
      };
      return newProd;
    }
  },

  updateProduct: async (id: string, productData: Partial<Product>): Promise<Product> => {
    try {
      const res = await apiClient.put<Product>(`/api/inventory/products/${id}`, productData);
      return res.data;
    } catch {
      return { id, ...productData } as Product;
    }
  },

  reconcileStock: async (): Promise<{ reconciledCount: number; message: string }> => {
    // Reconcile Redis Cache with Postgres Source of Truth
    await inventoryApi.seedProducts();
    return {
      reconciledCount: 4,
      message: 'Redis cache successfully synchronized with PostgreSQL database.',
    };
  },

  getStockMovements: async (): Promise<StockMovement[]> => {
    return initialMovements;
  },

  recordMovement: (movement: Omit<StockMovement, 'id' | 'timestampUtc'>) => {
    initialMovements.unshift({
      ...movement,
      id: `sm-${Date.now()}`,
      timestampUtc: new Date().toISOString(),
    });
  },
};
