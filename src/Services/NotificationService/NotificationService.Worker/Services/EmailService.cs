using System.Net.Mail;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace NotificationService.Worker.Services;

public interface IEmailService
{
    Task SendEmailAsync(string to, string subject, string body, CancellationToken cancellationToken = default);
}

public class SmtpEmailService : IEmailService
{
    private readonly ILogger<SmtpEmailService> _logger;
    private readonly string _smtpHost;
    private readonly int _smtpPort;

    public SmtpEmailService(IConfiguration configuration, ILogger<SmtpEmailService> logger)
    {
        _logger = logger;
        _smtpHost = configuration["Smtp:Host"] ?? "localhost";
        _smtpPort = int.TryParse(configuration["Smtp:Port"], out var p) ? p : 1025; // Default Mailpit SMTP port
    }

    public async Task SendEmailAsync(string to, string subject, string body, CancellationToken cancellationToken = default)
    {
        try
        {
            using var client = new SmtpClient(_smtpHost, _smtpPort);
            using var message = new MailMessage("no-reply@orderflow.local", to, subject, body)
            {
                IsBodyHtml = true
            };

            await client.SendMailAsync(message, cancellationToken);
            _logger.LogInformation("Email sent successfully to {To} with Subject: {Subject}", to, subject);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to send email to {To}. Make sure Mailpit is running on {Host}:{Port}", to, _smtpHost, _smtpPort);
        }
    }
}
