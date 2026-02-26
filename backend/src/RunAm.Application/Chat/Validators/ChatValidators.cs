using FluentValidation;
using RunAm.Application.Chat.Commands;

namespace RunAm.Application.Chat.Validators;

public class SendMessageCommandValidator : AbstractValidator<SendMessageCommand>
{
    public SendMessageCommandValidator()
    {
        RuleFor(x => x.ErrandId).NotEmpty().WithMessage("Errand ID is required.");
        RuleFor(x => x.SenderId).NotEmpty().WithMessage("Sender ID is required.");
        RuleFor(x => x.Request.Message)
            .NotEmpty().WithMessage("Message is required.")
            .MaximumLength(2000).WithMessage("Message must not exceed 2000 characters.");
        RuleFor(x => x.Request.MessageType).IsInEnum().WithMessage("Invalid message type.");
    }
}
