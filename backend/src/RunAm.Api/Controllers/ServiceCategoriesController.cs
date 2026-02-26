using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RunAm.Application.ServiceCategories.Commands;
using RunAm.Application.ServiceCategories.Queries;
using RunAm.Shared.DTOs;
using RunAm.Shared.DTOs.Vendors;

namespace RunAm.Api.Controllers;

[Route("api/v1/service-categories")]
public class ServiceCategoriesController : BaseApiController
{
    private readonly IMediator _mediator;

    public ServiceCategoriesController(IMediator mediator) => _mediator = mediator;

    /// <summary>List all active service categories</summary>
    [HttpGet]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<ServiceCategoryDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll()
    {
        var result = await _mediator.Send(new GetServiceCategoriesQuery());
        return Ok(ApiResponse<IReadOnlyList<ServiceCategoryDto>>.Ok(result));
    }

    /// <summary>Get a service category by slug</summary>
    [HttpGet("{slug}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponse<ServiceCategoryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetBySlug(string slug)
    {
        var result = await _mediator.Send(new GetServiceCategoryBySlugQuery(slug));
        if (result is null) return NotFound(ApiResponse.Fail("Category not found", "NOT_FOUND"));
        return Ok(ApiResponse<ServiceCategoryDto>.Ok(result));
    }

    /// <summary>Create a service category (Admin)</summary>
    [HttpPost]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(ApiResponse<ServiceCategoryDto>), StatusCodes.Status201Created)]
    public async Task<IActionResult> Create([FromBody] CreateServiceCategoryRequest request)
    {
        var result = await _mediator.Send(new CreateServiceCategoryCommand(request));
        return Created($"/api/v1/service-categories/{result.Slug}", ApiResponse<ServiceCategoryDto>.Ok(result));
    }

    /// <summary>Update a service category (Admin)</summary>
    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(ApiResponse<ServiceCategoryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateServiceCategoryRequest request)
    {
        var result = await _mediator.Send(new UpdateServiceCategoryCommand(id, request));
        return Ok(ApiResponse<ServiceCategoryDto>.Ok(result));
    }

    /// <summary>Delete a service category (Admin)</summary>
    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Delete(Guid id)
    {
        await _mediator.Send(new DeleteServiceCategoryCommand(id));
        return NoContent();
    }
}
