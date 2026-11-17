using PaymentService.Domain.Entities;

namespace PaymentService.Domain.Repositories;

public interface IPaymentRepository
{
    Task<Payment?> GetByOrderIdAsync(Guid orderId, CancellationToken cancellationToken = default);
    Task<Payment?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task AddAsync(Payment payment, CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
