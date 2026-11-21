using BuildingBlocks.Common.Results;
using BuildingBlocks.Messaging.Contracts;
using MassTransit;
using Microsoft.Extensions.Logging.Abstractions;
using OrderService.Application.Commands.CancelOrder;
using OrderService.Application.Commands.PayOrder;
using OrderService.Domain.Entities;
using OrderService.Domain.Enums;
using OrderService.Domain.Repositories;
using PaymentService.Application.Commands.ProcessPayment;
using PaymentService.Domain.Entities;
using PaymentService.Domain.Repositories;
using Xunit;

namespace OrderFlow.UnitTests;

public class EndToEndSagaFlowTests
{
    [Fact]
    public async Task Saga_WhenPaymentFails_ShouldTriggerCompensationAndCancelOrder()
    {
        // 1. Arrange: Order is Pending
        var orderId = Guid.NewGuid();
        var customerId = Guid.NewGuid();
        var order = Order.Create(
            orderId,
            "ORD-SAGA-FAIL-01",
            customerId,
            "FAIL_CARD",
            "idemp-saga-01",
            [(Guid.NewGuid(), "iPhone 16 Pro Max", 32990000m, 1)]
        );

        var orderRepo = new MockOrderRepository(order);
        var paymentRepo = new MockPaymentRepository();
        var mockBus = new MockBus();

        // 2. Setup Payment Handler with mock bus
        var processPaymentHandler = new ProcessPaymentCommandHandler(
            paymentRepo,
            mockBus,
            NullLogger<ProcessPaymentCommandHandler>.Instance);

        // 3. Act: Payment fails due to FAIL_CARD
        var paymentCmd = new ProcessPaymentCommand(orderId, order.TotalAmount, "FAIL_CARD");
        var paymentResult = await processPaymentHandler.Handle(paymentCmd, CancellationToken.None);

        Assert.True(paymentResult.IsFailure);
        Assert.Single(mockBus.PublishedMessages);
        var failedEvent = Assert.IsAssignableFrom<IPaymentFailedEvent>(mockBus.PublishedMessages[0]);
        Assert.Equal(orderId, failedEvent.OrderId);

        // 4. Act: OrderService consumes IPaymentFailedEvent
        var cancelOrderHandler = new CancelOrderCommandHandler(orderRepo, NullLogger<CancelOrderCommandHandler>.Instance);
        var cancelResult = await cancelOrderHandler.Handle(new CancelOrderCommand(orderId, failedEvent.Reason), CancellationToken.None);

        // 5. Assert: Order is successfully cancelled via Saga compensation
        Assert.True(cancelResult.IsSuccess);
        Assert.Equal(OrderStatus.Cancelled, order.Status);
        Assert.Contains("Card declined", order.FailureReason);
    }

    [Fact]
    public async Task Saga_WhenPaymentSucceeds_ShouldSettleOrderToPaid()
    {
        // 1. Arrange: Order is Pending
        var orderId = Guid.NewGuid();
        var customerId = Guid.NewGuid();
        var order = Order.Create(
            orderId,
            "ORD-SAGA-SUCCESS-01",
            customerId,
            "VIETQR",
            "idemp-saga-02",
            [(Guid.NewGuid(), "MacBook Pro M3", 49990000m, 1)]
        );

        var orderRepo = new MockOrderRepository(order);
        var paymentRepo = new MockPaymentRepository();
        var mockBus = new MockBus();

        var processPaymentHandler = new ProcessPaymentCommandHandler(
            paymentRepo,
            mockBus,
            NullLogger<ProcessPaymentCommandHandler>.Instance);

        // 2. Act: Payment succeeds
        var paymentCmd = new ProcessPaymentCommand(orderId, order.TotalAmount, "VIETQR");
        var paymentResult = await processPaymentHandler.Handle(paymentCmd, CancellationToken.None);

        Assert.True(paymentResult.IsSuccess);
        Assert.Single(mockBus.PublishedMessages);
        var completedEvent = Assert.IsAssignableFrom<IPaymentCompletedEvent>(mockBus.PublishedMessages[0]);
        Assert.Equal(orderId, completedEvent.OrderId);

        // 3. Act: OrderService consumes IPaymentCompletedEvent
        var payOrderHandler = new PayOrderCommandHandler(orderRepo, NullLogger<PayOrderCommandHandler>.Instance);
        var payResult = await payOrderHandler.Handle(new PayOrderCommand(orderId), CancellationToken.None);

        // 4. Assert: Order is successfully settled to Paid
        Assert.True(payResult.IsSuccess);
        Assert.Equal(OrderStatus.Paid, order.Status);
    }

    private class MockOrderRepository : IOrderRepository
    {
        private readonly Order _order;

        public MockOrderRepository(Order order)
        {
            _order = order;
        }

        public Task<Order?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
            Task.FromResult<Order?>(_order.Id == id ? _order : null);

        public Task<Order?> GetByCodeAsync(string orderCode, CancellationToken cancellationToken = default) =>
            Task.FromResult<Order?>(_order.OrderCode == orderCode ? _order : null);

        public Task<List<Order>> GetAllAsync(CancellationToken cancellationToken = default) =>
            Task.FromResult(new List<Order> { _order });

        public Task AddAsync(Order order, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task SaveChangesAsync(CancellationToken cancellationToken = default) => Task.CompletedTask;
    }

    private class MockPaymentRepository : IPaymentRepository
    {
        public Payment? StoredPayment { get; private set; }

        public Task<Payment?> GetByOrderIdAsync(Guid orderId, CancellationToken cancellationToken = default) =>
            Task.FromResult(StoredPayment?.OrderId == orderId ? StoredPayment : null);

        public Task<Payment?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
            Task.FromResult(StoredPayment?.Id == id ? StoredPayment : null);

        public Task AddAsync(Payment payment, CancellationToken cancellationToken = default)
        {
            StoredPayment = payment;
            return Task.CompletedTask;
        }

        public Task SaveChangesAsync(CancellationToken cancellationToken = default) => Task.CompletedTask;
    }

    private class MockBus : IPublishEndpoint
    {
        public List<object> PublishedMessages { get; } = [];

        public Task Publish<T>(T message, CancellationToken cancellationToken = default) where T : class
        {
            PublishedMessages.Add(message);
            return Task.CompletedTask;
        }

        public Task Publish<T>(T message, IPipe<PublishContext<T>> pipe, CancellationToken cancellationToken = default) where T : class => Task.CompletedTask;
        public Task Publish<T>(T message, IPipe<PublishContext> pipe, CancellationToken cancellationToken = default) where T : class => Task.CompletedTask;
        public Task Publish(object message, CancellationToken cancellationToken = default)
        {
            PublishedMessages.Add(message);
            return Task.CompletedTask;
        }
        public Task Publish(object message, IPipe<PublishContext> pipe, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task Publish(object message, Type messageType, CancellationToken cancellationToken = default)
        {
            PublishedMessages.Add(message);
            return Task.CompletedTask;
        }
        public Task Publish(object message, Type messageType, IPipe<PublishContext> pipe, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task Publish<T>(object values, CancellationToken cancellationToken = default) where T : class => Task.CompletedTask;
        public Task Publish<T>(object values, IPipe<PublishContext<T>> pipe, CancellationToken cancellationToken = default) where T : class => Task.CompletedTask;
        public Task Publish<T>(object values, IPipe<PublishContext> pipe, CancellationToken cancellationToken = default) where T : class => Task.CompletedTask;
        public ConnectHandle ConnectPublishObserver(IPublishObserver observer) => throw new NotImplementedException();
    }
}
