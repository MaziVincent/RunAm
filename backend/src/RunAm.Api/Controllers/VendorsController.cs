using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RunAm.Application.Vendors.Commands;
using RunAm.Application.Vendors.Queries;
using RunAm.Shared.DTOs;
using RunAm.Shared.DTOs.Vendors;

namespace RunAm.Api.Controllers;

[Route("api/v1/vendors")]
public class VendorsController : BaseApiController
{
    private readonly IMediator _mediator;

    public VendorsController(IMediator mediator) => _mediator = mediator;

    /// <summary>Browse / search vendors (public)</summary>
    [HttpGet]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<VendorDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetVendors(
        [FromQuery] string? search,
        [FromQuery] Guid? categoryId,
        [FromQuery] double? lat,
        [FromQuery] double? lng,
        [FromQuery] double? radius,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var (vendors, totalCount) = await _mediator.Send(new GetVendorsQuery(search, categoryId, lat, lng, radius, page, pageSize));
        return Ok(ApiResponse<IReadOnlyList<VendorDto>>.Ok(vendors, new PaginationMeta
        {
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount
        }));
    }

    /// <summary>Get vendor detail with products (public)</summary>
    [HttpGet("{id:guid}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponse<VendorDetailDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetById(Guid id)
    {
        var result = await _mediator.Send(new GetVendorByIdQuery(id));
        if (result is null) return NotFound(ApiResponse.Fail("Vendor not found", "NOT_FOUND"));
        return Ok(ApiResponse<VendorDetailDto>.Ok(result));
    }

    /// <summary>Get my vendor profile (Merchant)</summary>
    [HttpGet("me")]
    [Authorize(Roles = "Merchant")]
    [ProducesResponseType(typeof(ApiResponse<VendorDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyVendor()
    {
        var result = await _mediator.Send(new GetMyVendorQuery(GetUserId()));
        if (result is null) return NotFound(ApiResponse.Fail("Vendor profile not found", "NOT_FOUND"));
        return Ok(ApiResponse<VendorDto>.Ok(result));
    }

    /// <summary>Create vendor profile (Merchant)</summary>
    [HttpPost("me")]
    [Authorize(Roles = "Merchant")]
    [ProducesResponseType(typeof(ApiResponse<VendorDto>), StatusCodes.Status201Created)]
    public async Task<IActionResult> Create([FromBody] CreateVendorRequest request)
    {
        var result = await _mediator.Send(new CreateVendorCommand(GetUserId(), request));
        return Created($"/api/v1/vendors/{result.Id}", ApiResponse<VendorDto>.Ok(result));
    }

    /// <summary>Update vendor profile (Merchant)</summary>
    [HttpPut("me")]
    [Authorize(Roles = "Merchant")]
    [ProducesResponseType(typeof(ApiResponse<VendorDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Update([FromBody] UpdateVendorRequest request)
    {
        var result = await _mediator.Send(new UpdateVendorCommand(GetUserId(), request));
        return Ok(ApiResponse<VendorDto>.Ok(result));
    }

    /// <summary>Toggle vendor open/closed (Merchant)</summary>
    [HttpPut("me/status")]
    [Authorize(Roles = "Merchant")]
    [ProducesResponseType(typeof(ApiResponse<VendorDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ToggleStatus([FromBody] UpdateVendorStatusRequest request)
    {
        var result = await _mediator.Send(new ToggleVendorStatusCommand(GetUserId(), request.IsOpen));
        return Ok(ApiResponse<VendorDto>.Ok(result));
    }

    /// <summary>Approve or reject a vendor (Admin)</summary>
    [HttpPut("{id:guid}/approve")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(ApiResponse<VendorDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Approve(Guid id, [FromQuery] bool approve = true)
    {
        var result = await _mediator.Send(new ApproveVendorCommand(id, approve));
        return Ok(ApiResponse<VendorDto>.Ok(result));
    }
}
