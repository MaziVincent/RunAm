using System.Text.RegularExpressions;
using MediatR;
using RunAm.Domain.Entities;
using RunAm.Domain.Interfaces;
using RunAm.Shared.DTOs.Vendors;

namespace RunAm.Application.ServiceCategories.Commands;

// ─── Create Service Category (Admin) ────────────────────────

public record CreateServiceCategoryCommand(CreateServiceCategoryRequest Request) : IRequest<ServiceCategoryDto>;

public class CreateServiceCategoryCommandHandler : IRequestHandler<CreateServiceCategoryCommand, ServiceCategoryDto>
{
    private readonly IServiceCategoryRepository _repo;
    private readonly IUnitOfWork _uow;

    public CreateServiceCategoryCommandHandler(IServiceCategoryRepository repo, IUnitOfWork uow)
    {
        _repo = repo;
        _uow = uow;
    }

    public async Task<ServiceCategoryDto> Handle(CreateServiceCategoryCommand command, CancellationToken ct)
    {
        var req = command.Request;
        var slug = GenerateSlug(req.Name);

        var category = new ServiceCategory
        {
            Name = req.Name,
            Slug = slug,
            Description = req.Description,
            IconUrl = req.IconUrl,
            SortOrder = req.SortOrder,
            RequiresVendor = req.RequiresVendor,
            IsActive = true
        };

        await _repo.AddAsync(category, ct);
        await _uow.SaveChangesAsync(ct);

        return new ServiceCategoryDto(
            category.Id, category.Name, category.Slug, category.Description,
            category.IconUrl, category.SortOrder, category.IsActive, category.RequiresVendor, 0
        );
    }

    private static string GenerateSlug(string name)
        => Regex.Replace(name.ToLowerInvariant().Trim(), @"[^a-z0-9]+", "-").Trim('-');
}

// ─── Update Service Category (Admin) ────────────────────────

public record UpdateServiceCategoryCommand(Guid Id, UpdateServiceCategoryRequest Request) : IRequest<ServiceCategoryDto>;

public class UpdateServiceCategoryCommandHandler : IRequestHandler<UpdateServiceCategoryCommand, ServiceCategoryDto>
{
    private readonly IServiceCategoryRepository _repo;
    private readonly IUnitOfWork _uow;

    public UpdateServiceCategoryCommandHandler(IServiceCategoryRepository repo, IUnitOfWork uow)
    {
        _repo = repo;
        _uow = uow;
    }

    public async Task<ServiceCategoryDto> Handle(UpdateServiceCategoryCommand command, CancellationToken ct)
    {
        var category = await _repo.GetByIdAsync(command.Id, ct)
            ?? throw new KeyNotFoundException($"ServiceCategory {command.Id} not found");

        var req = command.Request;
        category.Name = req.Name;
        category.Description = req.Description;
        category.IconUrl = req.IconUrl;
        category.SortOrder = req.SortOrder;
        category.IsActive = req.IsActive;
        category.RequiresVendor = req.RequiresVendor;

        await _repo.UpdateAsync(category, ct);
        await _uow.SaveChangesAsync(ct);

        return new ServiceCategoryDto(
            category.Id, category.Name, category.Slug, category.Description,
            category.IconUrl, category.SortOrder, category.IsActive, category.RequiresVendor, 0
        );
    }
}

// ─── Delete Service Category (Admin) ────────────────────────

public record DeleteServiceCategoryCommand(Guid Id) : IRequest;

public class DeleteServiceCategoryCommandHandler : IRequestHandler<DeleteServiceCategoryCommand>
{
    private readonly IServiceCategoryRepository _repo;
    private readonly IUnitOfWork _uow;

    public DeleteServiceCategoryCommandHandler(IServiceCategoryRepository repo, IUnitOfWork uow)
    {
        _repo = repo;
        _uow = uow;
    }

    public async Task Handle(DeleteServiceCategoryCommand command, CancellationToken ct)
    {
        await _repo.DeleteAsync(command.Id, ct);
        await _uow.SaveChangesAsync(ct);
    }
}
