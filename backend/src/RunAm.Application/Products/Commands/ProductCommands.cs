using MediatR;
using RunAm.Application.Common.Interfaces;
using RunAm.Application.Vendors;
using RunAm.Domain.Entities;
using RunAm.Domain.Interfaces;
using RunAm.Shared.DTOs.Vendors;

namespace RunAm.Application.Products.Commands;

// ─── Create Product Category (Merchant) ─────────────────────

public record CreateProductCategoryCommand(Guid UserId, CreateProductCategoryRequest Request) : IRequest<ProductCategoryDto>;

public class CreateProductCategoryCommandHandler : IRequestHandler<CreateProductCategoryCommand, ProductCategoryDto>
{
    private readonly IAppCache _cache;
    private readonly IVendorRepository _vendorRepo;
    private readonly IProductCategoryRepository _catRepo;
    private readonly IUnitOfWork _uow;

    public CreateProductCategoryCommandHandler(IVendorRepository vendorRepo, IProductCategoryRepository catRepo, IUnitOfWork uow, IAppCache cache)
    {
        _vendorRepo = vendorRepo;
        _catRepo = catRepo;
        _uow = uow;
        _cache = cache;
    }

    public async Task<ProductCategoryDto> Handle(CreateProductCategoryCommand command, CancellationToken ct)
    {
        var vendor = await _vendorRepo.GetByUserIdAsync(command.UserId, ct)
            ?? throw new KeyNotFoundException("Vendor profile not found.");

        var req = command.Request;
        var category = new ProductCategory
        {
            VendorId = vendor.Id,
            Name = req.Name,
            Description = req.Description,
            ImageUrl = req.ImageUrl,
            SortOrder = req.SortOrder
        };

        await _catRepo.AddAsync(category, ct);
        await _uow.SaveChangesAsync(ct);
        await VendorCache.BumpCatalogVersionAsync(_cache, ct);

        return new ProductCategoryDto(category.Id, category.VendorId, category.Name, category.Description, category.ImageUrl, category.SortOrder, category.IsActive);
    }
}

// ─── Update Product Category (Merchant) ─────────────────────

public record UpdateProductCategoryCommand(Guid UserId, Guid CategoryId, UpdateProductCategoryRequest Request) : IRequest<ProductCategoryDto>;

public class UpdateProductCategoryCommandHandler : IRequestHandler<UpdateProductCategoryCommand, ProductCategoryDto>
{
    private readonly IAppCache _cache;
    private readonly IVendorRepository _vendorRepo;
    private readonly IProductCategoryRepository _catRepo;
    private readonly IUnitOfWork _uow;

    public UpdateProductCategoryCommandHandler(IVendorRepository vendorRepo, IProductCategoryRepository catRepo, IUnitOfWork uow, IAppCache cache)
    {
        _vendorRepo = vendorRepo;
        _catRepo = catRepo;
        _uow = uow;
        _cache = cache;
    }

    public async Task<ProductCategoryDto> Handle(UpdateProductCategoryCommand command, CancellationToken ct)
    {
        var vendor = await _vendorRepo.GetByUserIdAsync(command.UserId, ct)
            ?? throw new KeyNotFoundException("Vendor profile not found.");

        var category = await _catRepo.GetByIdAsync(command.CategoryId, ct)
            ?? throw new KeyNotFoundException($"Product category {command.CategoryId} not found.");

        if (category.VendorId != vendor.Id)
            throw new UnauthorizedAccessException("You don't own this product category.");

        var req = command.Request;
        category.Name = req.Name;
        category.Description = req.Description;
        category.ImageUrl = req.ImageUrl;
        category.SortOrder = req.SortOrder;
        category.IsActive = req.IsActive;

        await _catRepo.UpdateAsync(category, ct);
        await _uow.SaveChangesAsync(ct);
        await VendorCache.BumpCatalogVersionAsync(_cache, ct);

        return new ProductCategoryDto(category.Id, category.VendorId, category.Name, category.Description, category.ImageUrl, category.SortOrder, category.IsActive);
    }
}

// ─── Delete Product Category (Merchant) ─────────────────────

public record DeleteProductCategoryCommand(Guid UserId, Guid CategoryId) : IRequest;

public class DeleteProductCategoryCommandHandler : IRequestHandler<DeleteProductCategoryCommand>
{
    private readonly IAppCache _cache;
    private readonly IVendorRepository _vendorRepo;
    private readonly IProductCategoryRepository _catRepo;
    private readonly IUnitOfWork _uow;

    public DeleteProductCategoryCommandHandler(IVendorRepository vendorRepo, IProductCategoryRepository catRepo, IUnitOfWork uow, IAppCache cache)
    {
        _vendorRepo = vendorRepo;
        _catRepo = catRepo;
        _uow = uow;
        _cache = cache;
    }

    public async Task Handle(DeleteProductCategoryCommand command, CancellationToken ct)
    {
        var vendor = await _vendorRepo.GetByUserIdAsync(command.UserId, ct)
            ?? throw new KeyNotFoundException("Vendor profile not found.");

        var category = await _catRepo.GetByIdAsync(command.CategoryId, ct)
            ?? throw new KeyNotFoundException($"Product category {command.CategoryId} not found.");

        if (category.VendorId != vendor.Id)
            throw new UnauthorizedAccessException("You don't own this product category.");

        await _catRepo.DeleteAsync(command.CategoryId, ct);
        await _uow.SaveChangesAsync(ct);
        await VendorCache.BumpCatalogVersionAsync(_cache, ct);
    }
}

// ─── Create Product (Merchant) ──────────────────────────────

public record CreateProductCommand(Guid UserId, CreateProductRequest Request) : IRequest<ProductDto>;

public class CreateProductCommandHandler : IRequestHandler<CreateProductCommand, ProductDto>
{
    private readonly IAppCache _cache;
    private readonly IVendorRepository _vendorRepo;
    private readonly IProductRepository _productRepo;
    private readonly IProductCategoryRepository _catRepo;
    private readonly IUnitOfWork _uow;

    public CreateProductCommandHandler(IVendorRepository vendorRepo, IProductRepository productRepo, IProductCategoryRepository catRepo, IUnitOfWork uow, IAppCache cache)
    {
        _vendorRepo = vendorRepo;
        _productRepo = productRepo;
        _catRepo = catRepo;
        _uow = uow;
        _cache = cache;
    }

    public async Task<ProductDto> Handle(CreateProductCommand command, CancellationToken ct)
    {
        var vendor = await _vendorRepo.GetByUserIdAsync(command.UserId, ct)
            ?? throw new KeyNotFoundException("Vendor profile not found.");

        var req = command.Request;

        var category = await _catRepo.GetByIdAsync(req.ProductCategoryId, ct)
            ?? throw new KeyNotFoundException($"Product category {req.ProductCategoryId} not found.");

        if (category.VendorId != vendor.Id)
            throw new UnauthorizedAccessException("Product category doesn't belong to your vendor.");

        var product = new Product
        {
            VendorId = vendor.Id,
            ProductCategoryId = req.ProductCategoryId,
            Name = req.Name,
            Description = req.Description,
            Price = req.Price,
            CompareAtPrice = req.CompareAtPrice,
            ImageUrl = req.ImageUrl,
            SortOrder = req.SortOrder,
            VariantsJson = req.VariantsJson,
            ExtrasJson = req.ExtrasJson
        };

        await _productRepo.AddAsync(product, ct);
        await _uow.SaveChangesAsync(ct);
        await VendorCache.BumpCatalogVersionAsync(_cache, ct);

        return new ProductDto(
            product.Id, product.VendorId, product.ProductCategoryId, category.Name,
            product.Name, product.Description, product.Price, product.CompareAtPrice,
            product.ImageUrl, product.IsAvailable, product.IsActive, product.SortOrder,
            product.VariantsJson, product.ExtrasJson
        );
    }
}

// ─── Update Product (Merchant) ──────────────────────────────

public record UpdateProductCommand(Guid UserId, Guid ProductId, UpdateProductRequest Request) : IRequest<ProductDto>;

public class UpdateProductCommandHandler : IRequestHandler<UpdateProductCommand, ProductDto>
{
    private readonly IAppCache _cache;
    private readonly IVendorRepository _vendorRepo;
    private readonly IProductRepository _productRepo;
    private readonly IUnitOfWork _uow;

    public UpdateProductCommandHandler(IVendorRepository vendorRepo, IProductRepository productRepo, IUnitOfWork uow, IAppCache cache)
    {
        _vendorRepo = vendorRepo;
        _productRepo = productRepo;
        _uow = uow;
        _cache = cache;
    }

    public async Task<ProductDto> Handle(UpdateProductCommand command, CancellationToken ct)
    {
        var vendor = await _vendorRepo.GetByUserIdAsync(command.UserId, ct)
            ?? throw new KeyNotFoundException("Vendor profile not found.");

        var product = await _productRepo.GetByIdAsync(command.ProductId, ct)
            ?? throw new KeyNotFoundException($"Product {command.ProductId} not found.");

        if (product.VendorId != vendor.Id)
            throw new UnauthorizedAccessException("You don't own this product.");

        if (!product.IsActive)
            throw new InvalidOperationException("This product has been deactivated by an admin. Contact support.");

        var req = command.Request;
        product.ProductCategoryId = req.ProductCategoryId;
        product.Name = req.Name;
        product.Description = req.Description;
        product.Price = req.Price;
        product.CompareAtPrice = req.CompareAtPrice;
        product.ImageUrl = req.ImageUrl;
        product.SortOrder = req.SortOrder;
        product.IsAvailable = req.IsAvailable;
        product.VariantsJson = req.VariantsJson;
        product.ExtrasJson = req.ExtrasJson;

        await _productRepo.UpdateAsync(product, ct);
        await _uow.SaveChangesAsync(ct);
        await VendorCache.BumpCatalogVersionAsync(_cache, ct);

        return new ProductDto(
            product.Id, product.VendorId, product.ProductCategoryId, product.ProductCategory.Name,
            product.Name, product.Description, product.Price, product.CompareAtPrice,
            product.ImageUrl, product.IsAvailable, product.IsActive, product.SortOrder,
            product.VariantsJson, product.ExtrasJson
        );
    }
}

// ─── Delete Product (Merchant) ──────────────────────────────

public record DeleteProductCommand(Guid UserId, Guid ProductId) : IRequest;

public class DeleteProductCommandHandler : IRequestHandler<DeleteProductCommand>
{
    private readonly IAppCache _cache;
    private readonly IVendorRepository _vendorRepo;
    private readonly IProductRepository _productRepo;
    private readonly IUnitOfWork _uow;

    public DeleteProductCommandHandler(IVendorRepository vendorRepo, IProductRepository productRepo, IUnitOfWork uow, IAppCache cache)
    {
        _vendorRepo = vendorRepo;
        _productRepo = productRepo;
        _uow = uow;
        _cache = cache;
    }

    public async Task Handle(DeleteProductCommand command, CancellationToken ct)
    {
        var vendor = await _vendorRepo.GetByUserIdAsync(command.UserId, ct)
            ?? throw new KeyNotFoundException("Vendor profile not found.");

        var product = await _productRepo.GetByIdAsync(command.ProductId, ct)
            ?? throw new KeyNotFoundException($"Product {command.ProductId} not found.");

        if (product.VendorId != vendor.Id)
            throw new UnauthorizedAccessException("You don't own this product.");

        await _productRepo.DeleteAsync(command.ProductId, ct);
        await _uow.SaveChangesAsync(ct);
        await VendorCache.BumpCatalogVersionAsync(_cache, ct);
    }
}

// ─── Toggle Product Availability (Merchant) ─────────────────

public record ToggleProductAvailabilityCommand(Guid UserId, Guid ProductId, bool IsAvailable) : IRequest<ProductDto>;

public class ToggleProductAvailabilityCommandHandler : IRequestHandler<ToggleProductAvailabilityCommand, ProductDto>
{
    private readonly IAppCache _cache;
    private readonly IVendorRepository _vendorRepo;
    private readonly IProductRepository _productRepo;
    private readonly IUnitOfWork _uow;

    public ToggleProductAvailabilityCommandHandler(IVendorRepository vendorRepo, IProductRepository productRepo, IUnitOfWork uow, IAppCache cache)
    {
        _vendorRepo = vendorRepo;
        _productRepo = productRepo;
        _uow = uow;
        _cache = cache;
    }

    public async Task<ProductDto> Handle(ToggleProductAvailabilityCommand command, CancellationToken ct)
    {
        var vendor = await _vendorRepo.GetByUserIdAsync(command.UserId, ct)
            ?? throw new KeyNotFoundException("Vendor profile not found.");

        var product = await _productRepo.GetByIdAsync(command.ProductId, ct)
            ?? throw new KeyNotFoundException($"Product {command.ProductId} not found.");

        if (product.VendorId != vendor.Id)
            throw new UnauthorizedAccessException("You don't own this product.");

        if (!product.IsActive)
            throw new InvalidOperationException("This product has been deactivated by an admin. Contact support.");

        product.IsAvailable = command.IsAvailable;
        await _productRepo.UpdateAsync(product, ct);
        await _uow.SaveChangesAsync(ct);
        await VendorCache.BumpCatalogVersionAsync(_cache, ct);

        return new ProductDto(
            product.Id, product.VendorId, product.ProductCategoryId, product.ProductCategory.Name,
            product.Name, product.Description, product.Price, product.CompareAtPrice,
            product.ImageUrl, product.IsAvailable, product.IsActive, product.SortOrder,
            product.VariantsJson, product.ExtrasJson
        );
    }
}

// ─── Toggle Product Active Status (Admin) ───────────────────

public record ToggleProductActiveCommand(Guid ProductId, bool IsActive) : IRequest<ProductDto>;

public class ToggleProductActiveCommandHandler : IRequestHandler<ToggleProductActiveCommand, ProductDto>
{
    private readonly IAppCache _cache;
    private readonly IProductRepository _productRepo;
    private readonly IUnitOfWork _uow;

    public ToggleProductActiveCommandHandler(IProductRepository productRepo, IUnitOfWork uow, IAppCache cache)
    {
        _productRepo = productRepo;
        _uow = uow;
        _cache = cache;
    }

    public async Task<ProductDto> Handle(ToggleProductActiveCommand command, CancellationToken ct)
    {
        var product = await _productRepo.GetByIdAsync(command.ProductId, ct)
            ?? throw new KeyNotFoundException($"Product {command.ProductId} not found.");

        product.IsActive = command.IsActive;
        await _productRepo.UpdateAsync(product, ct);
        await _uow.SaveChangesAsync(ct);
        await VendorCache.BumpCatalogVersionAsync(_cache, ct);

        return new ProductDto(
            product.Id, product.VendorId, product.ProductCategoryId, product.ProductCategory.Name,
            product.Name, product.Description, product.Price, product.CompareAtPrice,
            product.ImageUrl, product.IsAvailable, product.IsActive, product.SortOrder,
            product.VariantsJson, product.ExtrasJson
        );
    }
}
