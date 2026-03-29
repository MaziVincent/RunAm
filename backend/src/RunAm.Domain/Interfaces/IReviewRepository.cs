using RunAm.Domain.Entities;

namespace RunAm.Domain.Interfaces;

public interface IReviewRepository
{
    Task<Review?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<IReadOnlyList<Review>> GetByRevieweeIdAsync(Guid revieweeId, int page, int pageSize, CancellationToken ct = default);
    Task<int> GetCountByRevieweeIdAsync(Guid revieweeId, CancellationToken ct = default);
    Task<IReadOnlyList<Review>> GetByErrandIdAsync(Guid errandId, CancellationToken ct = default);
    Task<IReadOnlyList<Review>> GetFlaggedReviewsAsync(int page, int pageSize, CancellationToken ct = default);
    Task<(double AverageRating, int TotalReviews)> GetRatingSummaryAsync(Guid revieweeId, CancellationToken ct = default);
    Task<bool> HasReviewedAsync(Guid errandId, Guid reviewerId, CancellationToken ct = default);
    Task AddAsync(Review review, CancellationToken ct = default);
    Task UpdateAsync(Review review, CancellationToken ct = default);
}

public interface INotificationPreferenceRepository
{
    Task<NotificationPreference?> GetByUserIdAsync(Guid userId, CancellationToken ct = default);
    Task<NotificationPreference> GetOrCreateAsync(Guid userId, CancellationToken ct = default);
    Task UpdateAsync(NotificationPreference preference, CancellationToken ct = default);
}

public interface INotificationTemplateRepository
{
    Task<NotificationTemplate?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<IReadOnlyList<NotificationTemplate>> GetAllAsync(int page, int pageSize, CancellationToken ct = default);
    Task AddAsync(NotificationTemplate template, CancellationToken ct = default);
    Task UpdateAsync(NotificationTemplate template, CancellationToken ct = default);
    Task DeleteAsync(Guid id, CancellationToken ct = default);
}
