using MediatR;
using RunAm.Domain.Interfaces;
using RunAm.Shared.DTOs.Reviews;

namespace RunAm.Application.Reviews.Queries;

// ── Get Reviews for a User ─────────────────────

public record GetUserReviewsQuery(Guid UserId, int Page = 1, int PageSize = 20) : IRequest<(IReadOnlyList<ReviewDto> Reviews, int TotalCount)>;

public class GetUserReviewsQueryHandler : IRequestHandler<GetUserReviewsQuery, (IReadOnlyList<ReviewDto> Reviews, int TotalCount)>
{
    private readonly IReviewRepository _reviewRepo;

    public GetUserReviewsQueryHandler(IReviewRepository reviewRepo) => _reviewRepo = reviewRepo;

    public async Task<(IReadOnlyList<ReviewDto> Reviews, int TotalCount)> Handle(GetUserReviewsQuery query, CancellationToken ct)
    {
        var reviews = await _reviewRepo.GetByRevieweeIdAsync(query.UserId, query.Page, query.PageSize, ct);
        var totalCount = await _reviewRepo.GetCountByRevieweeIdAsync(query.UserId, ct);

        var dtos = reviews.Select(r => new ReviewDto(
            r.Id, r.ErrandId, r.ReviewerId, r.Reviewer?.FullName ?? "",
            r.RevieweeId, r.Reviewee?.FullName ?? "",
            r.Rating, r.Comment, r.IsApproved, r.IsFlagged, r.FlagReason, r.CreatedAt
        )).ToList();

        return (dtos, totalCount);
    }
}

// ── Get Reviews for an Errand ──────────────────

public record GetErrandReviewsQuery(Guid ErrandId) : IRequest<IReadOnlyList<ReviewDto>>;

public class GetErrandReviewsQueryHandler : IRequestHandler<GetErrandReviewsQuery, IReadOnlyList<ReviewDto>>
{
    private readonly IReviewRepository _reviewRepo;

    public GetErrandReviewsQueryHandler(IReviewRepository reviewRepo) => _reviewRepo = reviewRepo;

    public async Task<IReadOnlyList<ReviewDto>> Handle(GetErrandReviewsQuery query, CancellationToken ct)
    {
        var reviews = await _reviewRepo.GetByErrandIdAsync(query.ErrandId, ct);
        return reviews.Select(r => new ReviewDto(
            r.Id, r.ErrandId, r.ReviewerId, r.Reviewer?.FullName ?? "",
            r.RevieweeId, r.Reviewee?.FullName ?? "",
            r.Rating, r.Comment, r.IsApproved, r.IsFlagged, r.FlagReason, r.CreatedAt
        )).ToList();
    }
}

// ── Get Rating Summary ─────────────────────────

public record GetRatingSummaryQuery(Guid UserId) : IRequest<ReviewSummaryDto>;

public class GetRatingSummaryQueryHandler : IRequestHandler<GetRatingSummaryQuery, ReviewSummaryDto>
{
    private readonly IReviewRepository _reviewRepo;

    public GetRatingSummaryQueryHandler(IReviewRepository reviewRepo) => _reviewRepo = reviewRepo;

    public async Task<ReviewSummaryDto> Handle(GetRatingSummaryQuery query, CancellationToken ct)
    {
        var (avgRating, totalReviews) = await _reviewRepo.GetRatingSummaryAsync(query.UserId, ct);

        // Get star breakdown
        var reviews = await _reviewRepo.GetByRevieweeIdAsync(query.UserId, 1, 10000, ct);
        var fiveStar = reviews.Count(r => r.Rating == 5);
        var fourStar = reviews.Count(r => r.Rating == 4);
        var threeStar = reviews.Count(r => r.Rating == 3);
        var twoStar = reviews.Count(r => r.Rating == 2);
        var oneStar = reviews.Count(r => r.Rating == 1);

        return new ReviewSummaryDto(avgRating, totalReviews, fiveStar, fourStar, threeStar, twoStar, oneStar);
    }
}

// ── Get Flagged Reviews (Admin) ────────────────

public record GetFlaggedReviewsQuery(int Page = 1, int PageSize = 20) : IRequest<IReadOnlyList<ReviewDto>>;

public class GetFlaggedReviewsQueryHandler : IRequestHandler<GetFlaggedReviewsQuery, IReadOnlyList<ReviewDto>>
{
    private readonly IReviewRepository _reviewRepo;

    public GetFlaggedReviewsQueryHandler(IReviewRepository reviewRepo) => _reviewRepo = reviewRepo;

    public async Task<IReadOnlyList<ReviewDto>> Handle(GetFlaggedReviewsQuery query, CancellationToken ct)
    {
        var reviews = await _reviewRepo.GetFlaggedReviewsAsync(query.Page, query.PageSize, ct);
        return reviews.Select(r => new ReviewDto(
            r.Id, r.ErrandId, r.ReviewerId, r.Reviewer?.FullName ?? "",
            r.RevieweeId, r.Reviewee?.FullName ?? "",
            r.Rating, r.Comment, r.IsApproved, r.IsFlagged, r.FlagReason, r.CreatedAt
        )).ToList();
    }
}
