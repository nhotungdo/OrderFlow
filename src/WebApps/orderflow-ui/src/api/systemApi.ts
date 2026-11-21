import type { QueueMetric, DlqMessage } from '../types';

let mockDlqMessages: DlqMessage[] = [
  {
    id: 'dlq-msg-8819',
    originalQueue: 'payment-service-process-queue',
    correlationId: 'corr-e3a1-4091-bb92',
    messageType: 'OrderFlow.BuildingBlocks.Messaging.Contracts.IStockReservedEvent',
    payload: JSON.stringify({
      orderId: 'f928a1c0-1284-4820-b302',
      orderCode: 'ORD-DLQ-DEMO',
      totalAmount: 2499.0,
      paymentMethod: 'TIMEOUT',
      itemsCount: 1,
    }, null, 2),
    exceptionType: 'System.TimeoutException: Gateway unreachable at payment-gateway.internal:443 after 3 retries.',
    errorMessage: 'Payment Gateway Connection Timed Out (MaxRetriesExceeded)',
    stackTrace: `   at PaymentService.Application.Consumers.StockReservedPaymentConsumer.Consume(ConsumeContext\`1 context) in F:\\OJT-Review\\OrderFlow\\src\\Services\\PaymentService\\PaymentService.Application\\Consumers\\StockReservedPaymentConsumer.cs:line 48
   at MassTransit.Internals.Extensions.TaskExtensions.OrCanceled(Task task, CancellationToken cancellationToken)
   at MassTransit.Middleware.RetryFilter\`2.Process(TContext context, IFilter\`1 next)`,
    retryCount: 3,
    failedAtUtc: new Date(Date.now() - 420000).toISOString(),
  },
  {
    id: 'dlq-msg-8820',
    originalQueue: 'inventory-service-reserve-queue',
    correlationId: 'corr-91ca-7128-cc12',
    messageType: 'OrderFlow.BuildingBlocks.Messaging.Contracts.IOrderCreatedEvent',
    payload: JSON.stringify({
      orderId: 'a12b-3c4d-5e6f-7a8b',
      orderCode: 'ORD-POISON-SKU',
      items: [{ productId: 'invalid-nonexistent-id', quantity: 999 }],
    }, null, 2),
    exceptionType: 'OrderFlow.BuildingBlocks.Common.Exceptions.DomainException: Product id invalid-nonexistent-id not found in catalog.',
    errorMessage: 'ProductNotFoundException in InventoryConsumer',
    stackTrace: `   at InventoryService.Application.Consumers.OrderCreatedInventoryConsumer.Consume(ConsumeContext\`1 context) in F:\\OJT-Review\\OrderFlow\\src\\Services\\InventoryService\\InventoryService.Application\\Consumers\\OrderCreatedInventoryConsumer.cs:line 62`,
    retryCount: 3,
    failedAtUtc: new Date(Date.now() - 1800000).toISOString(),
  },
];

export const systemApi = {
  getQueueMetrics: async (): Promise<QueueMetric[]> => {
    return [
      {
        queueName: 'order-service-events',
        messagesReady: 0,
        messagesUnacknowledged: 0,
        consumerCount: 2,
        rateIn: 14.2,
        rateOut: 14.2,
        status: 'Healthy',
      },
      {
        queueName: 'inventory-service-reserve-queue',
        messagesReady: 1,
        messagesUnacknowledged: 0,
        consumerCount: 4,
        rateIn: 28.5,
        rateOut: 28.0,
        status: 'Healthy',
      },
      {
        queueName: 'payment-service-process-queue',
        messagesReady: 0,
        messagesUnacknowledged: 1,
        consumerCount: 3,
        rateIn: 12.0,
        rateOut: 11.8,
        status: 'Healthy',
      },
      {
        queueName: 'notification-service-email-queue',
        messagesReady: 0,
        messagesUnacknowledged: 0,
        consumerCount: 1,
        rateIn: 8.5,
        rateOut: 8.5,
        status: 'Healthy',
      },
      {
        queueName: 'orderflow-dead-letter-exchange.dlq',
        messagesReady: mockDlqMessages.length,
        messagesUnacknowledged: 0,
        consumerCount: 0,
        rateIn: 0.1,
        rateOut: 0.0,
        status: mockDlqMessages.length > 0 ? 'Warning' : 'Healthy',
      },
    ];
  },

  getDlqMessages: async (): Promise<DlqMessage[]> => {
    return [...mockDlqMessages];
  },

  retryDlqMessage: async (id: string): Promise<{ success: boolean; message: string }> => {
    const idx = mockDlqMessages.findIndex((m) => m.id === id);
    if (idx !== -1) {
      const msg = mockDlqMessages[idx];
      mockDlqMessages.splice(idx, 1);
      return {
        success: true,
        message: `Message [${msg.id}] re-published to exchange '${msg.originalQueue}' with Idempotent Guarantee.`,
      };
    }
    return { success: false, message: 'Message not found in DLQ.' };
  },

  purgeDlq: async (): Promise<{ success: boolean; purgedCount: number }> => {
    const count = mockDlqMessages.length;
    mockDlqMessages = [];
    return { success: true, purgedCount: count };
  },
};
