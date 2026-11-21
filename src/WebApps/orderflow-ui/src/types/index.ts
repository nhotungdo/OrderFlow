export interface Product {
  id: string;
  sku: string;
  productName: string;
  unitPrice: number;
  totalQuantity: number;
  availableQuantity: number;
  reservedQuantity: number;
  redisStock: number;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
}

export interface Order {
  id: string;
  orderCode: string;
  customerId: string;
  totalAmount: number;
  status: 'Pending' | 'Paid' | 'Cancelled' | 'Completed';
  paymentMethod: string;
  failureReason?: string;
  idempotencyKey?: string;
  createdAtUtc: string;
  items: OrderItem[];
}

export interface CreateOrderRequest {
  customerId: string;
  paymentMethod: string;
  items: {
    productId: string;
    productName: string;
    unitPrice: number;
    quantity: number;
  }[];
}

export interface PaymentSimulationRequest {
  orderId: string;
  amount: number;
  paymentMethod: string;
  forceFailure?: boolean;
  failureReason?: string;
}
