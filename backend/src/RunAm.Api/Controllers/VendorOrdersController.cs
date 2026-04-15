using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RunAm.Application.Vendors.Commands;
using RunAm.Application.Vendors.Queries;
using RunAm.Shared.DTOs;
using RunAm.Shared.DTOs.Vendors;

namespace RunAm.Api.Controllers;

[Route("api/v1/vendors/me/orders")]
[Authorize(Roles = "Merchant")]
public class VendorOrdersController : BaseApiController
{
    private readonly IMediator _mediator;

    public VendorOrdersController(IMediator mediator) => _mediator = mediator;

    /// <summary>Get incoming orders for my vendor</summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<VendorOrderDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetOrders([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? status = null)
    {
        var (orders, totalCount) = await _mediator.Send(new GetVendorOrdersQuery(GetUserId(), page, pageSize, status));
        return Ok(ApiResponse<IReadOnlyList<VendorOrderDto>>.Ok(orders, new PaginationMeta
        {
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount
        }));
    }

    /// <summary>Get a single order for my vendor</summary>
    [HttpGet("{errandId:guid}")]
    [ProducesResponseType(typeof(ApiResponse<RunAm.Shared.DTOs.Errands.ErrandDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetOrderDetail(Guid errandId)
    {
        var result = await _mediator.Send(new GetVendorOrderDetailQuery(GetUserId(), errandId));
        return Ok(ApiResponse<RunAm.Shared.DTOs.Errands.ErrandDto>.Ok(result));
    }

    /// <summary>Confirm an order</summary>
    [HttpPut("{errandId:guid}/confirm")]
    [ProducesResponseType(typeof(ApiResponse<VendorOrderDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Confirm(Guid errandId)
    {
        var result = await _mediator.Send(new ConfirmVendorOrderCommand(GetUserId(), errandId));
        return Ok(ApiResponse<VendorOrderDto>.Ok(result));
    }

    /// <summary>Mark an order as ready for pickup</summary>
    [HttpPut("{errandId:guid}/ready")]
    [ProducesResponseType(typeof(ApiResponse<VendorOrderDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> MarkReady(Guid errandId)
    {
        var result = await _mediator.Send(new MarkOrderReadyCommand(GetUserId(), errandId));
        return Ok(ApiResponse<VendorOrderDto>.Ok(result));
    }
}
