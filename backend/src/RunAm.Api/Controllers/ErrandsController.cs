using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RunAm.Application.Errands.Commands;
using RunAm.Application.Errands.Queries;
using RunAm.Shared.DTOs;
using RunAm.Shared.DTOs.Errands;

namespace RunAm.Api.Controllers;

[Route("api/v1/errands")]
[Authorize]
public class ErrandsController : BaseApiController
{
    private readonly IMediator _mediator;

    public ErrandsController(IMediator mediator) => _mediator = mediator;

    /// <summary>Create a new errand</summary>
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<ErrandDto>), StatusCodes.Status201Created)]
    public async Task<IActionResult> Create([FromBody] CreateErrandRequest request)
    {
        var result = await _mediator.Send(new CreateErrandCommand(GetUserId(), request));
        return Created($"/api/v1/errands/{result.Id}", ApiResponse<ErrandDto>.Ok(result));
    }

    /// <summary>Create a marketplace (vendor) order</summary>
    [HttpPost("marketplace")]
    [ProducesResponseType(typeof(ApiResponse<MarketplaceOrderResult>), StatusCodes.Status201Created)]
    public async Task<IActionResult> CreateMarketplaceOrder([FromBody] CreateMarketplaceOrderRequest request)
    {
        var result = await _mediator.Send(new CreateMarketplaceOrderCommand(GetUserId(), request));
        return Created($"/api/v1/errands/{result.Errand.Id}", ApiResponse<MarketplaceOrderResult>.Ok(result));
    }

    /// <summary>Get current user's errands</summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<ErrandDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyErrands([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? status = null)
    {
        var (errands, totalCount) = await _mediator.Send(new GetMyErrandsQuery(GetUserId(), page, pageSize, status));
        return Ok(ApiResponse<IReadOnlyList<ErrandDto>>.Ok(errands, new PaginationMeta
        {
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount
        }));
    }

    /// <summary>Get errand by ID</summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<ErrandDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetById(Guid id)
    {
        var result = await _mediator.Send(new GetErrandByIdQuery(id, GetUserId()));
        return Ok(ApiResponse<ErrandDto>.Ok(result));
    }

    /// <summary>Cancel an errand</summary>
    [HttpPatch("{id:guid}/cancel")]
    [ProducesResponseType(typeof(ApiResponse<ErrandDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Cancel(Guid id, [FromBody] CancelErrandRequest request)
    {
        var result = await _mediator.Send(new CancelErrandCommand(id, GetUserId(), request.Reason));
        return Ok(ApiResponse<ErrandDto>.Ok(result));
    }

    /// <summary>Get price estimate for an errand</summary>
    [HttpGet("estimate")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponse<PriceEstimateResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetEstimate([FromQuery] PriceEstimateRequest request)
    {
        var result = await _mediator.Send(new GetPriceEstimateQuery(request));
        return Ok(ApiResponse<PriceEstimateResponse>.Ok(result));
    }

    /// <summary>Get price estimate for an errand with structured payload support</summary>
    [HttpPost("estimate")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponse<PriceEstimateResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> PostEstimate([FromBody] PriceEstimateRequest request)
    {
        var result = await _mediator.Send(new GetPriceEstimateQuery(request));
        return Ok(ApiResponse<PriceEstimateResponse>.Ok(result));
    }
}
