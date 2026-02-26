using MediatR;
using RunAm.Domain.Entities;
using RunAm.Domain.Enums;
using RunAm.Domain.Interfaces;
using RunAm.Shared.DTOs.Reviews;

namespace RunAm.Application.Reviews.Commands;

// ── Create Review ──────────────────────────────

public record CreateReviewCommand(
    Guid ReviewerId,
    CreateReviewRequest Request
) : IRequest<ReviewDto>;

public class CreateReviewCommandHandler : IRequestHandler<CreateReviewCommand, ReviewDto>
{
    private readonly IReviewRepository _reviewRepo;
    private readonly IErrandRepository _errandRepo;
    private readonly IRiderRepository _riderRepo;
    private readonly INotificationDispatcher _notifDispatcher;
    private readonly IUnitOfWork _uow;

    public CreateReviewCommandHandler(
        IReviewRepository reviewRepo,
        IErrandRepository errandRepo,
        IRiderRepository riderRepo,
        INotificationDispatcher notifDispatcher,
        IUnitOfWork uow)
    {
        _reviewRepo = reviewRepo;
        _errandRepo = errandRepo;
        _riderRepo = riderRepo;
        _notifDispatcher = notifDispatcher;
        _uow = uow;
    }

    public async Task<ReviewDto> Handle(CreateReviewCommand command, CancellationToken ct)
    {
        var errand = await _errandRepo.GetByIdAsync(command.Request.ErrandId, ct)
            ?? throw new InvalidOperationException("Errand not found.");

        // Verify errand is delivered
        if (errand.Status != ErrandStatus.Delivered)
            throw new InvalidOperationException("Can only review delivered errands.");

        // Prevent duplicate review
        if (await _reviewRepo.HasReviewedAsync(command.Request.ErrandId, command.ReviewerId, ct))
            throw new InvalidOperationException("You have already reviewed this errand.");

        // Determine reviewee: customer reviews rider, rider reviews customer
        var revieweeId = command.ReviewerId == errand.CustomerId
            ? errand.RiderId ?? throw new InvalidOperationException("No rider assigned.")
            : errand.CustomerId;

        var review = new Review
        {
            ErrandId = command.Request.ErrandId,
            ReviewerId = command.ReviewerId,
            RevieweeId = revieweeId,
            Rating = Math.Clamp(command.Request.Rating, 1, 5),
            Comment = command.Request.Comment
        };

        await _reviewRepo.AddAsync(review, ct);
        await _uow.SaveChangesAsync(ct);

        // Update rider rating aggregate if reviewing a rider
        var riderProfile = await _riderRepo.GetByUserIdAsync(revieweeId, ct);
        if (riderProfile != null)
        {
            var (avgRating, totalReviews) = await _reviewRepo.GetRatingSummaryAsync(revieweeId, ct);
            riderProfile.Rating = (decimal)avgRating;
            await _riderRepo.UpdateAsync(riderProfile, ct);
            await _uow.SaveChangesAsync(ct);

            // Rider deactivation logic: if avg rating drops below 2.0 with 10+ reviews
            if (avgRating < 2.0 && totalReviews >= 10)
            {
                // Flag for admin review rather than auto-deactivate
                await _notifDispatcher.DispatchAsync(
                    revieweeId,
                    "Rating Alert",
                    "Your rating has dropped below 2.0. Please improve your service quality.",
                    NotificationType.SystemAlert,
                    ct: ct
                );
            }
        }

        // Notify reviewee about the rating
        await _notifDispatcher.DispatchAsync(
            revieweeId,
            "New Rating Received",
            $"You received a {review.Rating}-star rating.",
            NotificationType.RatingReceived,
            System.Text.Json.JsonSerializer.Serialize(new { errandId = errand.Id, rating = review.Rating }),
            ct
        );

        // Reload for reviewer/reviewee names
        var saved = await _reviewRepo.GetByIdAsync(review.Id, ct);
        return MapToDto(saved!);
    }

    private static ReviewDto MapToDto(Review r) => new(
        r.Id, r.ErrandId, r.ReviewerId, r.Reviewer?.FullName ?? "",
        r.RevieweeId, r.Reviewee?.FullName ?? "",
        r.Rating, r.Comment, r.IsApproved, r.IsFlagged, r.FlagReason, r.CreatedAt
    );
}

// ── Flag Review ────────────────────────────────

public record FlagReviewCommand(Guid ReviewId, string Reason) : IRequest<ReviewDto>;

public class FlagReviewCommandHandler : IRequestHandler<FlagReviewCommand, ReviewDto>
{
    private readonly IReviewRepository _reviewRepo;
    private readonly IUnitOfWork _uow;

    public FlagReviewCommandHandler(IReviewRepository reviewRepo, IUnitOfWork uow)
    {
        _reviewRepo = reviewRepo;
        _uow = uow;
    }

    public async Task<ReviewDto> Handle(FlagReviewCommand command, CancellationToken ct)
    {
        var review = await _reviewRepo.GetByIdAsync(command.ReviewId, ct)
            ?? throw new InvalidOperationException("Review not found.");

        review.IsFlagged = true;
        review.FlagReason = command.Reason;
        await _reviewRepo.UpdateAsync(review, ct);
        await _uow.SaveChangesAsync(ct);

        return new ReviewDto(
            review.Id, review.ErrandId, review.ReviewerId, review.Reviewer?.FullName ?? "",
            review.RevieweeId, review.Reviewee?.FullName ?? "",
            review.Rating, review.Comment, review.IsApproved, review.IsFlagged, review.FlagReason, review.CreatedAt
        );
    }
}

// ── Moderate Review (Admin) ────────────────────

public record ModerateReviewCommand(Guid ReviewId, bool Approve) : IRequest<ReviewDto>;

public class ModerateReviewCommandHandler : IRequestHandler<ModerateReviewCommand, ReviewDto>
{
    private readonly IReviewRepository _reviewRepo;
    private readonly IUnitOfWork _uow;

    public ModerateReviewCommandHandler(IReviewRepository reviewRepo, IUnitOfWork uow)
    {
        _reviewRepo = reviewRepo;
        _uow = uow;
    }

    public async Task<ReviewDto> Handle(ModerateReviewCommand command, CancellationToken ct)
    {
        var review = await _reviewRepo.GetByIdAsync(command.ReviewId, ct)
            ?? throw new InvalidOperationException("Review not found.");

        review.IsApproved = command.Approve;
        review.IsFlagged = false;
        await _reviewRepo.UpdateAsync(review, ct);
        await _uow.SaveChangesAsync(ct);

        return new ReviewDto(
            review.Id, review.ErrandId, review.ReviewerId, review.Reviewer?.FullName ?? "",
            review.RevieweeId, review.Reviewee?.FullName ?? "",
            review.Rating, review.Comment, review.IsApproved, review.IsFlagged, review.FlagReason, review.CreatedAt
        );
    }
}
