using FluentValidation;
using RunAm.Application.Errands.Commands;
using RunAm.Shared.DTOs.Errands;

namespace RunAm.Application.Errands.Validators;

public class CreateErrandRequestValidator : AbstractValidator<CreateErrandRequest>
{
    public CreateErrandRequestValidator()
    {
        RuleFor(x => x.Category).IsInEnum().WithMessage("Invalid errand category.");
        RuleFor(x => x.Priority).IsInEnum().WithMessage("Invalid priority.");
        RuleFor(x => x.PickupAddress).NotEmpty().WithMessage("Pickup address is required.").MaximumLength(500);
        RuleFor(x => x.DropoffAddress).NotEmpty().WithMessage("Drop-off address is required.").MaximumLength(500);
        RuleFor(x => x.PickupLatitude).InclusiveBetween(-90, 90);
        RuleFor(x => x.PickupLongitude).InclusiveBetween(-180, 180);
        RuleFor(x => x.DropoffLatitude).InclusiveBetween(-90, 90);
        RuleFor(x => x.DropoffLongitude).InclusiveBetween(-180, 180);
        RuleFor(x => x.PaymentMethod).IsInEnum().WithMessage("Invalid payment method.");

        When(x => x.Stops != null && x.Stops.Any(), () =>
        {
            RuleForEach(x => x.Stops).ChildRules(stop =>
            {
                stop.RuleFor(s => s.Address).NotEmpty().MaximumLength(500);
                stop.RuleFor(s => s.Latitude).InclusiveBetween(-90, 90);
                stop.RuleFor(s => s.Longitude).InclusiveBetween(-180, 180);
                stop.RuleFor(s => s.StopOrder).GreaterThan(0);
            });
        });
    }
}
