using Microsoft.EntityFrameworkCore;
using RunAm.Domain.Entities;
using RunAm.Domain.Interfaces;

namespace RunAm.Infrastructure.Persistence.Repositories;

public class ReviewRepository : IReviewRepository
{
    private readonly AppDbContext _db;

    public ReviewRepository(AppDbContext db) => _db = db;

    public async Task<Review?> GetByIdAsync(Guid id, CancellationToken ct = default) =>
        await _db.Reviews
            .Include(r => r.Reviewer)
            .Include(r => r.Reviewee)
            .FirstOrDefaultAsync(r => r.Id == id, ct);

    public async Task<IReadOnlyList<Review>> GetByRevieweeIdAsync(Guid revieweeId, int page, int pageSize, CancellationToken ct = default) =>
        await _db.Reviews
            .Include(r => r.Reviewer)
            .Include(r => r.Reviewee)
            .Where(r => r.RevieweeId == revieweeId && r.IsApproved)
            .OrderByDescending(r => r.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

    public async Task<IReadOnlyList<Review>> GetByErrandIdAsync(Guid errandId, CancellationToken ct = default) =>
        await _db.Reviews
            .Include(r => r.Reviewer)
            .Include(r => r.Reviewee)
            .Where(r => r.ErrandId == errandId)
            .ToListAsync(ct);

    public async Task<IReadOnlyList<Review>> GetFlaggedReviewsAsync(int page, int pageSize, CancellationToken ct = default) =>
        await _db.Reviews
            .Include(r => r.Reviewer)
            .Include(r => r.Reviewee)
            .Where(r => r.IsFlagged)
            .OrderByDescending(r => r.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

    public async Task<(double AverageRating, int TotalReviews)> GetRatingSummaryAsync(Guid revieweeId, CancellationToken ct = default)
    {
        var reviews = await _db.Reviews
            .Where(r => r.RevieweeId == revieweeId && r.IsApproved)
            .ToListAsync(ct);

        if (reviews.Count == 0) return (0, 0);

        return (reviews.Average(r => r.Rating), reviews.Count);
    }

    public async Task<bool> HasReviewedAsync(Guid errandId, Guid reviewerId, CancellationToken ct = default) =>
        await _db.Reviews.AnyAsync(r => r.ErrandId == errandId && r.ReviewerId == reviewerId, ct);

    public async Task AddAsync(Review review, CancellationToken ct = default) =>
        await _db.Reviews.AddAsync(review, ct);

    public Task UpdateAsync(Review review, CancellationToken ct = default)
    {
        _db.Reviews.Update(review);
        return Task.CompletedTask;
    }
}

public class NotificationPreferenceRepository : INotificationPreferenceRepository
{
    private readonly AppDbContext _db;

    public NotificationPreferenceRepository(AppDbContext db) => _db = db;

    public async Task<NotificationPreference?> GetByUserIdAsync(Guid userId, CancellationToken ct = default) =>
        await _db.NotificationPreferences.FirstOrDefaultAsync(p => p.UserId == userId, ct);

    public async Task<NotificationPreference> GetOrCreateAsync(Guid userId, CancellationToken ct = default)
    {
        var existing = await GetByUserIdAsync(userId, ct);
        if (existing != null) return existing;

        var pref = new NotificationPreference { UserId = userId };
        await _db.NotificationPreferences.AddAsync(pref, ct);
        await _db.SaveChangesAsync(ct);
        return pref;
    }

    public Task UpdateAsync(NotificationPreference preference, CancellationToken ct = default)
    {
        _db.NotificationPreferences.Update(preference);
        return Task.CompletedTask;
    }
}

public class NotificationTemplateRepository : INotificationTemplateRepository
{
    private readonly AppDbContext _db;

    public NotificationTemplateRepository(AppDbContext db) => _db = db;

    public async Task<NotificationTemplate?> GetByIdAsync(Guid id, CancellationToken ct = default) =>
        await _db.NotificationTemplates.FirstOrDefaultAsync(t => t.Id == id, ct);

    public async Task<IReadOnlyList<NotificationTemplate>> GetAllAsync(int page, int pageSize, CancellationToken ct = default) =>
        await _db.NotificationTemplates
            .OrderByDescending(t => t.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

    public async Task AddAsync(NotificationTemplate template, CancellationToken ct = default) =>
        await _db.NotificationTemplates.AddAsync(template, ct);

    public Task UpdateAsync(NotificationTemplate template, CancellationToken ct = default)
    {
        _db.NotificationTemplates.Update(template);
        return Task.CompletedTask;
    }

    public async Task DeleteAsync(Guid id, CancellationToken ct = default)
    {
        var template = await GetByIdAsync(id, ct);
        if (template != null) _db.NotificationTemplates.Remove(template);
    }
}
