using FluentValidation;
using RunAm.Application.Payments.Commands;

namespace RunAm.Application.Payments.Validators;

public class TopUpWalletCommandValidator : AbstractValidator<TopUpWalletCommand>
{
    public TopUpWalletCommandValidator()
    {
        RuleFor(x => x.UserId).NotEmpty();
        RuleFor(x => x.Request.Amount)
            .GreaterThan(0).WithMessage("Top-up amount must be greater than zero.")
            .LessThanOrEqualTo(1_000_000m).WithMessage("Top-up amount cannot exceed 1,000,000.");
        RuleFor(x => x.Request.PaymentMethod).IsInEnum();
    }
}

public class WithdrawCommandValidator : AbstractValidator<WithdrawCommand>
{
    public WithdrawCommandValidator()
    {
        RuleFor(x => x.UserId).NotEmpty();
        RuleFor(x => x.Request.Amount)
            .GreaterThan(0).WithMessage("Withdrawal amount must be greater than zero.");
        RuleFor(x => x.Request.BankCode).NotEmpty().WithMessage("Bank code is required.");
        RuleFor(x => x.Request.AccountNumber).NotEmpty().WithMessage("Account number is required.");
        RuleFor(x => x.Request.AccountName).NotEmpty().WithMessage("Account name is required.");
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
