using MediatR;
using RunAm.Domain.Interfaces;
using RunAm.Shared.DTOs.Chat;

namespace RunAm.Application.Chat.Queries;

public record GetMessagesQuery(Guid ErrandId, Guid RequestingUserId, int Page = 1, int PageSize = 50) : IRequest<(IReadOnlyList<ChatMessageDto> Messages, int TotalCount)>;

public class GetMessagesQueryHandler : IRequestHandler<GetMessagesQuery, (IReadOnlyList<ChatMessageDto> Messages, int TotalCount)>
{
    private readonly IChatRepository _chatRepo;
    private readonly IErrandRepository _errandRepo;

    public GetMessagesQueryHandler(IChatRepository chatRepo, IErrandRepository errandRepo)
    {
        _chatRepo = chatRepo;
        _errandRepo = errandRepo;
    }

    public async Task<(IReadOnlyList<ChatMessageDto> Messages, int TotalCount)> Handle(GetMessagesQuery query, CancellationToken ct)
    {
        // Verify the requesting user is a participant in this errand
        var errand = await _errandRepo.GetByIdAsync(query.ErrandId, ct)
            ?? throw new KeyNotFoundException("Errand not found.");

        if (errand.CustomerId != query.RequestingUserId && errand.RiderId != query.RequestingUserId)
            throw new UnauthorizedAccessException("You do not have access to this conversation.");

        var messages = await _chatRepo.GetByErrandIdAsync(query.ErrandId, query.Page, query.PageSize, ct);
        var totalCount = await _chatRepo.GetCountByErrandIdAsync(query.ErrandId, ct);

        var dtos = messages.Select(m => new ChatMessageDto(
            m.Id,
            m.ErrandId,
            m.SenderId,
            m.Sender?.FullName ?? "",
            m.Message,
            m.MessageType,
            m.IsRead,
            m.CreatedAt
        )).ToList();

        return (dtos, totalCount);
    }
}
