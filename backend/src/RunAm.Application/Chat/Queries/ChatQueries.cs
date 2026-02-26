using MediatR;
using RunAm.Domain.Interfaces;
using RunAm.Shared.DTOs.Chat;

namespace RunAm.Application.Chat.Queries;

public record GetMessagesQuery(Guid ErrandId, int Page = 1, int PageSize = 50) : IRequest<IReadOnlyList<ChatMessageDto>>;

public class GetMessagesQueryHandler : IRequestHandler<GetMessagesQuery, IReadOnlyList<ChatMessageDto>>
{
    private readonly IChatRepository _chatRepo;

    public GetMessagesQueryHandler(IChatRepository chatRepo) => _chatRepo = chatRepo;

    public async Task<IReadOnlyList<ChatMessageDto>> Handle(GetMessagesQuery query, CancellationToken ct)
    {
        var messages = await _chatRepo.GetByErrandIdAsync(query.ErrandId, query.Page, query.PageSize, ct);

        return messages.Select(m => new ChatMessageDto(
            m.Id,
            m.ErrandId,
            m.SenderId,
            m.Sender?.FullName ?? "",
            m.Message,
            m.MessageType,
            m.IsRead,
            m.CreatedAt
        )).ToList();
    }
}
