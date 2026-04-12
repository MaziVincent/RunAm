using FluentValidation;
using RunAm.Application.Payments.Commands;
using RunAm.Shared.DTOs.Payments;

namespace RunAm.Application.Payments.Validators;

public class CreateWalletCommandValidator : AbstractValidator<CreateWalletCommand>
{
    public CreateWalletCommandValidator()
    {
        RuleFor(x => x.UserId).NotEmpty();
        RuleFor(x => x.Request.Nin)
            .NotEmpty().WithMessage("NIN is required.")
            .Matches("^[0-9]{11}$").WithMessage("NIN must be exactly 11 digits.");
    }
}

public class TopUpWalletCommandValidator : AbstractValidator<TopUpWalletCommand>
{
    public TopUpWalletCommandValidator()
    {
        RuleFor(x => x.UserId).NotEmpty();
        RuleFor(x => x.Request.Amount)
            .GreaterThan(0).WithMessage("Top-up amount must be greater than zero.")
            .LessThanOrEqualTo(1_000_000m).WithMessage("Top-up amount cannot exceed 1,000,000.");
        RuleFor(x => x.Request.PaymentMethod).IsInEnum();
        RuleFor(x => x.Request.PaymentReference)
            .NotEmpty().WithMessage("Wallet funding is settled from a verified Monnify payment reference.");
    }
}

public class ProcessPaymentCommandValidator : AbstractValidator<ProcessPaymentCommand>
{
    public ProcessPaymentCommandValidator()
    {
        RuleFor(x => x.PayerId).NotEmpty();
        RuleFor(x => x.Request.ErrandId).NotEmpty();
        RuleFor(x => x.Request.PaymentMethod).IsInEnum();
    }
}

public class AddTipCommandValidator : AbstractValidator<AddTipCommand>
{
    public AddTipCommandValidator()
    {
        RuleFor(x => x.UserId).NotEmpty();
        RuleFor(x => x.ErrandId).NotEmpty();
        RuleFor(x => x.Amount)
            .GreaterThan(0).WithMessage("Tip amount must be greater than zero.")
            .LessThanOrEqualTo(50_000m).WithMessage("Tip amount cannot exceed 50,000.");
    }
}

public class CreateRiderPayoutCommandValidator : AbstractValidator<CreateRiderPayoutCommand>
{
    public CreateRiderPayoutCommandValidator()
    {
        RuleFor(x => x.RiderId).NotEmpty();
        RuleFor(x => x.Request.Amount)
            .GreaterThan(0).WithMessage("Withdrawal amount must be greater than zero.");
    }
}
