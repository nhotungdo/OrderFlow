using BuildingBlocks.Messaging.Contracts;
using MassTransit;
using Microsoft.Extensions.Logging.Abstractions;
using OrderService.Domain.Entities;
using OrderService.Domain.Enums;
using OrderService.Domain.Events;
using PaymentService.Application.Commands.ProcessPayment;
using PaymentService.Domain.Entities;
using PaymentService.Domain.Repositories;
using Xunit;

namespace OrderFlow.UnitTests;

public class OrderAndPaymentSagaTests
{
    [Fact]
    public void Order_Create_ShouldInitializeCorrectlyAndRaiseDomainEvent()
    {
        // Arrange
        var orderId = Guid.NewGuid();
        var customerId = Guid.NewGuid();
        var prod1Id = Guid.NewGuid();

        // Act
        var order = Order.Create(
            orderId,
            "ORD-20261117-001",
            customerId,
            "CREDIT_CARD",
            "idemp-key-123",
            new List<(Guid, string, decimal, int)>
            {
                (prod1Id, "iPhone 16 Pro Max", 32990000m, 2)
            }
        );

        // Assert
        Assert.Equal(orderId, order.Id);
        Assert.Equal(OrderStatus.Pending, order.Status);
        Assert.Equal(65980000m, order.TotalAmount);
        Assert.Single(order.Items);

        // Domain event check (Outbox will pick this up)
        var domainEvents = order.DomainEvents.ToList();
        Assert.Single(domainEvents);
        var createdEvent = Assert.IsType<OrderCreatedDomainEvent>(domainEvents[0]);
        Assert.Equal(order.Id, createdEvent.OrderId);
        Assert.Equal("CREDIT_CARD", createdEvent.PaymentMethod);
        Assert.Equal(order.TotalAmount, createdEvent.TotalAmount);
    }

    [Fact]
    public void Order_MarkAsCancelled_ShouldTransitionStateAndSetReason()
    {
        // Arrange
        var order = Order.Create(
            Guid.NewGuid(),
            "ORD-20261117-002",
            Guid.NewGuid(),
            "FAIL_CARD",
            null,
            [(Guid.NewGuid(), "Sample", 1000m, 1)]
        );

        // Act - Simulating Saga compensation
        var result = order.MarkAsCancelled("Payment Declined by Bank");

        // Assert
        Assert.True(result.IsSuccess);
        Assert.Equal(OrderStatus.Cancelled, order.Status);
        Assert.Equal("Payment Declined by Bank", order.FailureReason);
    }

    [Fact]
    public async Task Payment_ProcessPayment_WhenFailCard_ShouldFailAndPublishPaymentFailedEvent()
    {
        // Arrange
        var orderId = Guid.NewGuid();
        var mockRepo = new InMemoryPaymentRepository();
        var mockPublish = new MockPublishEndpoint();
        var handler = new ProcessPaymentCommandHandler(mockRepo, mockPublish, NullLogger<ProcessPaymentCommandHandler>.Instance);

        var command = new ProcessPaymentCommand(
            OrderId: orderId,
            Amount: 50000000m,
            PaymentMethod: "FAIL_CARD");

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.IsFailure);
        Assert.Equal(PaymentStatus.Failed, mockRepo.StoredPayment?.Status);
        Assert.Single(mockPublish.PublishedMessages);
        var failedEvent = Assert.IsAssignableFrom<IPaymentFailedEvent>(mockPublish.PublishedMessages[0]);
        Assert.Equal(orderId, failedEvent.OrderId);
    }

    [Fact]
    public async Task Payment_ProcessPayment_WhenValid_ShouldSucceedAndPublishPaymentCompletedEvent()
    {
        // Arrange
        var orderId = Guid.NewGuid();
        var mockRepo = new InMemoryPaymentRepository();
        var mockPublish = new MockPublishEndpoint();
        var handler = new ProcessPaymentCommandHandler(mockRepo, mockPublish, NullLogger<ProcessPaymentCommandHandler>.Instance);

        var command = new ProcessPaymentCommand(
            OrderId: orderId,
            Amount: 32990000m,
            PaymentMethod: "VIETQR");

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.IsSuccess);
        Assert.Equal(PaymentStatus.Completed, mockRepo.StoredPayment?.Status);
        Assert.NotNull(mockRepo.StoredPayment?.TransactionId);
        Assert.Single(mockPublish.PublishedMessages);
        var completedEvent = Assert.IsAssignableFrom<IPaymentCompletedEvent>(mockPublish.PublishedMessages[0]);
        Assert.Equal(orderId, completedEvent.OrderId);
        Assert.Equal(32990000m, completedEvent.Amount);
    }

    private class InMemoryPaymentRepository : IPaymentRepository
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

    private class MockPublishEndpoint : IPublishEndpoint
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
