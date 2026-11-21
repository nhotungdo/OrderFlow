using BuildingBlocks.Messaging.Contracts;
using MassTransit;
using Microsoft.Extensions.Logging;
using NotificationService.Worker.Services;

namespace NotificationService.Worker.Consumers;

public class NotificationPaymentCompletedConsumer : IConsumer<IPaymentCompletedEvent>
{
    private readonly IEmailService _emailService;
    private readonly ILogger<NotificationPaymentCompletedConsumer> _logger;

    public NotificationPaymentCompletedConsumer(IEmailService emailService, ILogger<NotificationPaymentCompletedConsumer> logger)
    {
        _emailService = emailService;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<IPaymentCompletedEvent> context)
    {
        var msg = context.Message;
        _logger.LogInformation("NotificationService: Order {OrderId} PAID successfully! Amount: {Amount}. Sending email notification...",
            msg.OrderId, msg.Amount);

        var subject = $"[OrderFlow] Đơn hàng #{msg.OrderId.ToString()[..8].ToUpper()} đã thanh toán thành công!";
        var body = $@"
            <h2>Cảm ơn bạn đã đặt hàng tại OrderFlow!</h2>
            <p>Mã đơn hàng: <strong>{msg.OrderId}</strong></p>
            <p>Mã giao dịch: <strong>{msg.TransactionId}</strong></p>
            <p>Số tiền đã thanh toán: <strong>{msg.Amount:N0} VNĐ</strong></p>
            <p>Đơn hàng của bạn đang được đóng gói và chuẩn bị giao.</p>";

        await _emailService.SendEmailAsync("customer@example.com", subject, body, context.CancellationToken);
    }
}

public class NotificationPaymentFailedConsumer : IConsumer<IPaymentFailedEvent>
{
    private readonly IEmailService _emailService;
    private readonly ILogger<NotificationPaymentFailedConsumer> _logger;

    public NotificationPaymentFailedConsumer(IEmailService emailService, ILogger<NotificationPaymentFailedConsumer> logger)
    {
        _emailService = emailService;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<IPaymentFailedEvent> context)
    {
        var msg = context.Message;
        _logger.LogWarning("NotificationService: Order {OrderId} PAYMENT FAILED! Reason: {Reason}. Sending alert email...",
            msg.OrderId, msg.Reason);

        var subject = $"[OrderFlow] Thanh toán thất bại cho đơn hàng #{msg.OrderId.ToString()[..8].ToUpper()}";
        var body = $@"
            <h2>Rất tiếc, thanh toán của bạn không thành công!</h2>
            <p>Mã đơn hàng: <strong>{msg.OrderId}</strong></p>
            <p>Lý do: <span style='color:red;'>{msg.Reason}</span></p>
            <p>Sản phẩm đã được hoàn lại kho. Bạn có thể thử lại với phương thức thanh toán khác.</p>";

        await _emailService.SendEmailAsync("customer@example.com", subject, body, context.CancellationToken);
    }
}
