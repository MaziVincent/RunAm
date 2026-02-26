using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RunAm.Application.Products.Commands;
using RunAm.Application.Products.Queries;
using RunAm.Shared.DTOs;
using RunAm.Shared.DTOs.Vendors;

namespace RunAm.Api.Controllers;

[Route("api/v1/vendors")]
public class VendorProductsController : BaseApiController
{
    private readonly IMediator _mediator;

    public VendorProductsController(IMediator mediator) => _mediator = mediator;

    // ─── Public ─────────────────────────────────────────────

    /// <summary>Get all products for a vendor grouped by category (public)</summary>
    [HttpGet("{vendorId:guid}/products")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<ProductCategoryWithProductsDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetVendorProducts(Guid vendorId)
    {
        var result = await _mediator.Send(new GetVendorProductsQuery(vendorId));
        return Ok(ApiResponse<IReadOnlyList<ProductCategoryWithProductsDto>>.Ok(result));
    }

    // ─── Merchant – Product Categories ──────────────────────

    /// <summary>Get my product categories (Merchant)</summary>
    [HttpGet("me/categories")]
    [Authorize(Roles = "Merchant")]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<ProductCategoryDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyCategories()
    {
        var result = await _mediator.Send(new GetMyProductCategoriesQuery(GetUserId()));
        return Ok(ApiResponse<IReadOnlyList<ProductCategoryDto>>.Ok(result));
    }

    /// <summary>Create product category (Merchant)</summary>
    [HttpPost("me/categories")]
    [Authorize(Roles = "Merchant")]
    [ProducesResponseType(typeof(ApiResponse<ProductCategoryDto>), StatusCodes.Status201Created)]
    public async Task<IActionResult> CreateCategory([FromBody] CreateProductCategoryRequest request)
    {
        var result = await _mediator.Send(new CreateProductCategoryCommand(GetUserId(), request));
        return Created($"/api/v1/vendors/me/categories/{result.Id}", ApiResponse<ProductCategoryDto>.Ok(result));
    }

    /// <summary>Update product category (Merchant)</summary>
    [HttpPut("me/categories/{id:guid}")]
    [Authorize(Roles = "Merchant")]
    [ProducesResponseType(typeof(ApiResponse<ProductCategoryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> UpdateCategory(Guid id, [FromBody] UpdateProductCategoryRequest request)
    {
        var result = await _mediator.Send(new UpdateProductCategoryCommand(GetUserId(), id, request));
        return Ok(ApiResponse<ProductCategoryDto>.Ok(result));
    }

    /// <summary>Delete product category (Merchant)</summary>
    [HttpDelete("me/categories/{id:guid}")]
    [Authorize(Roles = "Merchant")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> DeleteCategory(Guid id)
    {
        await _mediator.Send(new DeleteProductCategoryCommand(GetUserId(), id));
        return NoContent();
    }

    // ─── Merchant – Products ────────────────────────────────

    /// <summary>Get my products (Merchant)</summary>
    [HttpGet("me/products")]
    [Authorize(Roles = "Merchant")]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<ProductDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyProducts()
    {
        var result = await _mediator.Send(new GetMyProductsQuery(GetUserId()));
        return Ok(ApiResponse<IReadOnlyList<ProductDto>>.Ok(result));
    }

    /// <summary>Create product (Merchant)</summary>
    [HttpPost("me/products")]
    [Authorize(Roles = "Merchant")]
    [ProducesResponseType(typeof(ApiResponse<ProductDto>), StatusCodes.Status201Created)]
    public async Task<IActionResult> CreateProduct([FromBody] CreateProductRequest request)
    {
        var result = await _mediator.Send(new CreateProductCommand(GetUserId(), request));
        return Created($"/api/v1/vendors/me/products/{result.Id}", ApiResponse<ProductDto>.Ok(result));
    }

    /// <summary>Update product (Merchant)</summary>
    [HttpPut("me/products/{id:guid}")]
    [Authorize(Roles = "Merchant")]
    [ProducesResponseType(typeof(ApiResponse<ProductDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> UpdateProduct(Guid id, [FromBody] UpdateProductRequest request)
    {
        var result = await _mediator.Send(new UpdateProductCommand(GetUserId(), id, request));
        return Ok(ApiResponse<ProductDto>.Ok(result));
    }

    /// <summary>Delete product (Merchant)</summary>
    [HttpDelete("me/products/{id:guid}")]
    [Authorize(Roles = "Merchant")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> DeleteProduct(Guid id)
    {
        await _mediator.Send(new DeleteProductCommand(GetUserId(), id));
        return NoContent();
    }

    /// <summary>Toggle product availability (Merchant)</summary>
    [HttpPut("me/products/{id:guid}/availability")]
    [Authorize(Roles = "Merchant")]
    [ProducesResponseType(typeof(ApiResponse<ProductDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ToggleAvailability(Guid id, [FromBody] ToggleProductAvailabilityRequest request)
    {
        var result = await _mediator.Send(new ToggleProductAvailabilityCommand(GetUserId(), id, request.IsAvailable));
        return Ok(ApiResponse<ProductDto>.Ok(result));
    }
}
