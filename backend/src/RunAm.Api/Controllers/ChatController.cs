using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using RunAm.Api.Hubs;
using RunAm.Application.Chat.Commands;
using RunAm.Application.Chat.Queries;
using RunAm.Shared.DTOs;
using RunAm.Shared.DTOs.Chat;

namespace RunAm.Api.Controllers;

[Route("api/v1/errands/{errandId:guid}/messages")]
[Authorize]
public class ChatController : BaseApiController
{
    private readonly IMediator _mediator;
    private readonly IHubContext<ChatHub> _chatHub;

    public ChatController(IMediator mediator, IHubContext<ChatHub> chatHub)
    {
        _mediator = mediator;
        _chatHub = chatHub;
    }

    /// <summary>Get messages for an errand</summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<ChatMessageDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMessages(Guid errandId, [FromQuery] int page = 1, [FromQuery] int pageSize = 50)
    {
        var (messages, totalCount) = await _mediator.Send(new GetMessagesQuery(errandId, GetUserId(), page, pageSize));
        return Ok(ApiResponse<IReadOnlyList<ChatMessageDto>>.Ok(messages, new PaginationMeta
        {
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount
        }));
    }

    /// <summary>Send a chat message</summary>
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<ChatMessageDto>), StatusCodes.Status201Created)]
    public async Task<IActionResult> SendMessage(Guid errandId, [FromBody] SendMessageRequest request)
    {
        var userId = GetUserId();
        var result = await _mediator.Send(new SendMessageCommand(errandId, userId, request));

        // Broadcast via SignalR
        await ChatHub.BroadcastMessage(_chatHub, errandId, result);

        return Created("", ApiResponse<ChatMessageDto>.Ok(result));
    }

    /// <summary>Mark messages as read</summary>
    [HttpPatch("read")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> MarkAsRead(Guid errandId)
    {
        var userId = GetUserId();
        await _mediator.Send(new MarkMessagesReadCommand(errandId, userId));

        await ChatHub.BroadcastMessagesRead(_chatHub, errandId, userId);

        return NoContent();
    }
}
