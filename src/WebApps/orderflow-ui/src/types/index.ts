export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Customer' | 'Admin';
}

export interface Product {
  id: string;
  sku: string;
  productName: string;
  category?: string;
  description?: string;
  imageUrl?: string;
  unitPrice: number;
  totalQuantity: number;
  availableQuantity: number;
  reservedQuantity: number;
  redisStock: number;
  isActive?: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
}

export type OrderStatus = 'Pending' | 'StockReserved' | 'Paid' | 'Cancelled' | 'Completed';

export interface Order {
  id: string;
  orderCode: string;
  customerId: string;
  customerName?: string;
  shippingAddress?: string;
  totalAmount: number;
  status: OrderStatus;
  paymentMethod: string;
  failureReason?: string;
  idempotencyKey?: string;
  createdAtUtc: string;
  items: OrderItem[];
  sagaStep?: number; // 1: OrderCreated, 2: StockReserved, 3: PaymentProcessed, 4: Fulfilled/Compensated
}

export interface CreateOrderRequest {
  customerId: string;
  customerName?: string;
  shippingAddress?: string;
  paymentMethod: string;
  items: {
    productId: string;
    productName: string;
    unitPrice: number;
    quantity: number;
  }[];
}

export interface PaymentTransaction {
  id: string;
  orderId: string;
  orderCode: string;
  amount: number;
  paymentMethod: string;
  status: 'Success' | 'Failed' | 'Pending';
  failureReason?: string;
  transactionTimeUtc: string;
  idempotencyKey?: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  movementType: 'RESTOCK' | 'HOLD' | 'RELEASE' | 'DEDUCT';
  quantityChange: number;
  balanceAfter: number;
  referenceOrderId?: string;
  reason: string;
  timestampUtc: string;
}

export interface QueueMetric {
  queueName: string;
  messagesReady: number;
  messagesUnacknowledged: number;
  consumerCount: number;
  rateIn: number;
  rateOut: number;
  status: 'Healthy' | 'Warning' | 'HighLatency';
}

export interface DlqMessage {
  id: string;
  originalQueue: string;
  correlationId: string;
  messageType: string;
  payload: string;
  exceptionType: string;
  errorMessage: string;
  stackTrace: string;
  retryCount: number;
  failedAtUtc: string;
}
