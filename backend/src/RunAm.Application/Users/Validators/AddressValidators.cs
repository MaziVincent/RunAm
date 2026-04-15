using FluentValidation;
using RunAm.Application.Users.Commands;
using RunAm.Shared.DTOs;

namespace RunAm.Application.Users.Validators;

public class CreateAddressCommandValidator : AbstractValidator<CreateAddressCommand>
{
    public CreateAddressCommandValidator()
    {
        RuleFor(x => x.Request.Label)
            .NotEmpty()
            .MaximumLength(100);

        RuleFor(x => x.Request.Address)
            .NotEmpty()
            .MaximumLength(500);

        RuleFor(x => x.Request.Latitude)
            .InclusiveBetween(-90, 90);

        RuleFor(x => x.Request.Longitude)
            .InclusiveBetween(-180, 180);
    }
}

public class UpdateAddressCommandValidator : AbstractValidator<UpdateAddressCommand>
{
    public UpdateAddressCommandValidator()
    {
        RuleFor(x => x.Request)
            .Must(HasAtLeastOneField)
            .WithMessage("At least one address field must be supplied.");

        RuleFor(x => x.Request.Label)
            .NotEmpty()
            .MaximumLength(100)
            .When(x => x.Request.Label is not null);

        RuleFor(x => x.Request.Address)
            .NotEmpty()
            .MaximumLength(500)
            .When(x => x.Request.Address is not null);

        RuleFor(x => x.Request.Latitude!.Value)
            .InclusiveBetween(-90, 90)
            .When(x => x.Request.Latitude.HasValue);

        RuleFor(x => x.Request.Longitude!.Value)
            .InclusiveBetween(-180, 180)
            .When(x => x.Request.Longitude.HasValue);
    }

    private static bool HasAtLeastOneField(UpdateAddressRequest request)
        => request.Label is not null
            || request.Address is not null
            || request.Latitude.HasValue
            || request.Longitude.HasValue
            || request.IsDefault.HasValue;
}
