using MediatR;
using RunAm.Domain.Entities;
using RunAm.Domain.Enums;
using RunAm.Domain.Interfaces;
using RunAm.Shared.DTOs.Chat;

namespace RunAm.Application.Chat.Commands;

// ── Send Message ────────────────────────────────

public record SendMessageCommand(Guid ErrandId, Guid SenderId, SendMessageRequest Request) : IRequest<ChatMessageDto>;

public class SendMessageCommandHandler : IRequestHandler<SendMessageCommand, ChatMessageDto>
{
    private readonly IChatRepository _chatRepo;
    private readonly IUnitOfWork _uow;

    public SendMessageCommandHandler(IChatRepository chatRepo, IUnitOfWork uow)
    {
        _chatRepo = chatRepo;
        _uow = uow;
    }

    public async Task<ChatMessageDto> Handle(SendMessageCommand command, CancellationToken ct)
    {
        var message = new ChatMessage
        {
            ErrandId = command.ErrandId,
            SenderId = command.SenderId,
            Message = command.Request.Message,
            MessageType = command.Request.MessageType
        };

        await _chatRepo.AddAsync(message, ct);
        await _uow.SaveChangesAsync(ct);

        return new ChatMessageDto(
            message.Id,
            message.ErrandId,
            message.SenderId,
            "", // SenderName will be filled on read
            message.Message,
            message.MessageType,
            false,
            message.CreatedAt
        );
    }
}

// ── Mark Messages Read ──────────────────────────

public record MarkMessagesReadCommand(Guid ErrandId, Guid UserId) : IRequest;

public class MarkMessagesReadCommandHandler : IRequestHandler<MarkMessagesReadCommand>
{
    private readonly IChatRepository _chatRepo;

    public MarkMessagesReadCommandHandler(IChatRepository chatRepo) => _chatRepo = chatRepo;

    public async Task Handle(MarkMessagesReadCommand command, CancellationToken ct)
    {
        await _chatRepo.MarkAsReadAsync(command.ErrandId, command.UserId, ct);
    }
}
