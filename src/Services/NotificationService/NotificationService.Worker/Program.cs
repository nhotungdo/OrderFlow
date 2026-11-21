using BuildingBlocks.Messaging;
using NotificationService.Worker.Consumers;
using NotificationService.Worker.Services;

var builder = Host.CreateApplicationBuilder(args);

// Register Email Service
builder.Services.AddSingleton<IEmailService, SmtpEmailService>();

// Register MassTransit RabbitMQ
builder.Services.AddMessagingInfrastructure(builder.Configuration, busConfig =>
{
    busConfig.AddConsumer<NotificationPaymentCompletedConsumer>();
    busConfig.AddConsumer<NotificationPaymentFailedConsumer>();
});

var host = builder.Build();
host.Run();
