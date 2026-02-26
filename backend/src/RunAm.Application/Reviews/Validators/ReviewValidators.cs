using FluentValidation;
using RunAm.Application.Reviews.Commands;

namespace RunAm.Application.Reviews.Validators;

public class CreateReviewCommandValidator : AbstractValidator<CreateReviewCommand>
{
    public CreateReviewCommandValidator()
    {
        RuleFor(x => x.Request.ErrandId).NotEmpty();
        RuleFor(x => x.Request.Rating).InclusiveBetween(1, 5);
        RuleFor(x => x.Request.Comment).MaximumLength(2000);
    }
}
