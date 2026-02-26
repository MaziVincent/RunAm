using MediatR;
using RunAm.Domain.Entities;
using RunAm.Domain.Enums;
using RunAm.Domain.Exceptions;
using RunAm.Domain.Interfaces;
using RunAm.Shared.DTOs.Payments;

namespace RunAm.Application.Payments.Commands;

// ── Create Promo Code ───────────────────────────

public record CreatePromoCodeCommand(CreatePromoCodeRequest Request) : IRequest<PromoCodeDto>;

public class CreatePromoCodeCommandHandler : IRequestHandler<CreatePromoCodeCommand, PromoCodeDto>
{
    private readonly IPromoCodeRepository _promoRepo;
    private readonly IUnitOfWork _uow;

    public CreatePromoCodeCommandHandler(IPromoCodeRepository promoRepo, IUnitOfWork uow)
    {
        _promoRepo = promoRepo;
        _uow = uow;
    }

    public async Task<PromoCodeDto> Handle(CreatePromoCodeCommand command, CancellationToken ct)
    {
        var existing = await _promoRepo.GetByCodeAsync(command.Request.Code, ct);
        if (existing != null)
            throw new InvalidOperationException($"Promo code '{command.Request.Code}' already exists.");

        var promo = new PromoCode
        {
            Code = command.Request.Code.ToUpperInvariant(),
            DiscountType = command.Request.DiscountType,
            DiscountValue = command.Request.DiscountValue,
            MaxDiscount = command.Request.MaxDiscount,
            MinOrderAmount = command.Request.MinOrderAmount,
            UsageLimit = command.Request.UsageLimit,
            ExpiresAt = command.Request.ExpiresAt
        };

        await _promoRepo.AddAsync(promo, ct);
        await _uow.SaveChangesAsync(ct);

        return MapToDto(promo);
    }

    private static PromoCodeDto MapToDto(PromoCode p) => new(
        p.Id, p.Code, p.DiscountType, p.DiscountValue, p.MaxDiscount,
        p.MinOrderAmount, p.UsageLimit, p.UsedCount, p.ExpiresAt, p.IsActive, p.CreatedAt
    );
}

// ── Validate Promo Code ─────────────────────────

public record ValidatePromoCodeCommand(ValidatePromoCodeRequest Request) : IRequest<PromoCodeValidationResult>;

public class ValidatePromoCodeCommandHandler : IRequestHandler<ValidatePromoCodeCommand, PromoCodeValidationResult>
{
    private readonly IPromoCodeRepository _promoRepo;

    public ValidatePromoCodeCommandHandler(IPromoCodeRepository promoRepo) => _promoRepo = promoRepo;

    public async Task<PromoCodeValidationResult> Handle(ValidatePromoCodeCommand command, CancellationToken ct)
    {
        var promo = await _promoRepo.GetByCodeAsync(command.Request.Code, ct);

        if (promo == null)
            return new PromoCodeValidationResult(false, "Promo code not found.", 0, null);

        if (!promo.IsValid())
            return new PromoCodeValidationResult(false, "Promo code is expired or has reached its usage limit.", 0, null);

        if (promo.MinOrderAmount.HasValue && command.Request.OrderAmount < promo.MinOrderAmount.Value)
            return new PromoCodeValidationResult(false, $"Minimum order amount of {promo.MinOrderAmount.Value:N0} required.", 0, null);

        var discount = promo.CalculateDiscount(command.Request.OrderAmount);

        var dto = new PromoCodeDto(
            promo.Id, promo.Code, promo.DiscountType, promo.DiscountValue,
            promo.MaxDiscount, promo.MinOrderAmount, promo.UsageLimit,
            promo.UsedCount, promo.ExpiresAt, promo.IsActive, promo.CreatedAt
        );

        return new PromoCodeValidationResult(true, null, discount, dto);
    }
}

// ── Get Promo Codes (Admin) ─────────────────────

public record GetPromoCodesQuery(int Page = 1, int PageSize = 20) : IRequest<IReadOnlyList<PromoCodeDto>>;

public class GetPromoCodesQueryHandler : IRequestHandler<GetPromoCodesQuery, IReadOnlyList<PromoCodeDto>>
{
    private readonly IPromoCodeRepository _promoRepo;

    public GetPromoCodesQueryHandler(IPromoCodeRepository promoRepo) => _promoRepo = promoRepo;

    public async Task<IReadOnlyList<PromoCodeDto>> Handle(GetPromoCodesQuery query, CancellationToken ct)
    {
        var codes = await _promoRepo.GetAllAsync(query.Page, query.PageSize, ct);

        return codes.Select(p => new PromoCodeDto(
            p.Id, p.Code, p.DiscountType, p.DiscountValue, p.MaxDiscount,
            p.MinOrderAmount, p.UsageLimit, p.UsedCount, p.ExpiresAt, p.IsActive, p.CreatedAt
        )).ToList();
    }
}
