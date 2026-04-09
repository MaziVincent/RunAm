using MediatR;
using Microsoft.AspNetCore.Identity;
using RunAm.Application.Common.Interfaces;
using RunAm.Domain.Entities;
using RunAm.Domain.Enums;
using RunAm.Domain.Interfaces;
using RunAm.Application.Auth;
using RunAm.Shared.DTOs.Vendors;

namespace RunAm.Application.Vendors.Commands;

// ─── Create Vendor (Merchant) ───────────────────────────────

public record CreateVendorCommand(Guid UserId, CreateVendorRequest Request) : IRequest<VendorDto>;

public class CreateVendorCommandHandler : IRequestHandler<CreateVendorCommand, VendorDto>
{
    private readonly IAppCache _cache;
    private readonly IVendorRepository _vendorRepo;
    private readonly IServiceCategoryRepository _categoryRepo;
    private readonly IUnitOfWork _uow;

    public CreateVendorCommandHandler(IVendorRepository vendorRepo, IServiceCategoryRepository categoryRepo, IUnitOfWork uow, IAppCache cache)
    {
        _vendorRepo = vendorRepo;
        _categoryRepo = categoryRepo;
        _uow = uow;
        _cache = cache;
    }

    public async Task<VendorDto> Handle(CreateVendorCommand command, CancellationToken ct)
    {
        var existing = await _vendorRepo.GetByUserIdAsync(command.UserId, ct);
        if (existing is not null)
            throw new InvalidOperationException("User already has a vendor profile.");

        var req = command.Request;
        var vendor = new Vendor
        {
            UserId = command.UserId,
            BusinessName = req.BusinessName,
            BusinessDescription = req.BusinessDescription,
            LogoUrl = req.LogoUrl,
            Address = req.Address,
            Latitude = req.Latitude,
            Longitude = req.Longitude,
            OperatingHours = req.OperatingHours,
            MinimumOrderAmount = req.MinimumOrderAmount,
            DeliveryFee = req.DeliveryFee,
            EstimatedPrepTimeMinutes = req.EstimatedPrepTimeMinutes,
            Status = VendorStatus.Pending
        };

        // Link service categories
        foreach (var catId in req.ServiceCategoryIds)
        {
            var category = await _categoryRepo.GetByIdAsync(catId, ct)
                ?? throw new InvalidOperationException("One or more selected service categories do not exist.");

            if (!category.IsActive || !category.RequiresVendor)
                throw new InvalidOperationException("One or more selected service categories are not valid for vendors.");

            vendor.VendorServiceCategories.Add(new VendorServiceCategory
            {
                VendorId = vendor.Id,
                ServiceCategoryId = catId
            });
        }

        await _vendorRepo.AddAsync(vendor, ct);
        await _uow.SaveChangesAsync(ct);
        await VendorCache.BumpCatalogVersionAsync(_cache, ct);

        // Reload to include navigation properties
        var created = await _vendorRepo.GetByUserIdAsync(command.UserId, ct);
        return Queries.GetVendorsQueryHandler.MapToDto(created!);
    }
}

// ─── Update Vendor (Merchant) ───────────────────────────────

public record UpdateVendorCommand(Guid UserId, UpdateVendorRequest Request) : IRequest<VendorDto>;

public class UpdateVendorCommandHandler : IRequestHandler<UpdateVendorCommand, VendorDto>
{
    private readonly IAppCache _cache;
    private readonly IVendorRepository _vendorRepo;
    private readonly IServiceCategoryRepository _categoryRepo;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IUnitOfWork _uow;

    public UpdateVendorCommandHandler(
        IVendorRepository vendorRepo,
        IServiceCategoryRepository categoryRepo,
        UserManager<ApplicationUser> userManager,
        IUnitOfWork uow,
        IAppCache cache)
    {
        _vendorRepo = vendorRepo;
        _categoryRepo = categoryRepo;
        _userManager = userManager;
        _uow = uow;
        _cache = cache;
    }

    public async Task<VendorDto> Handle(UpdateVendorCommand command, CancellationToken ct)
    {
        var vendor = await _vendorRepo.GetByUserIdAsync(command.UserId, ct)
            ?? throw new KeyNotFoundException("Vendor profile not found.");

        var req = command.Request;
        vendor.BusinessName = req.BusinessName ?? vendor.BusinessName;
        vendor.BusinessDescription = req.Description ?? vendor.BusinessDescription;
        vendor.Address = req.Address ?? vendor.Address;
        vendor.Latitude = req.Latitude ?? vendor.Latitude;
        vendor.Longitude = req.Longitude ?? vendor.Longitude;
        vendor.OperatingHours = req.OperatingHours ?? vendor.OperatingHours;
        vendor.MinimumOrderAmount = req.MinimumOrderAmount ?? vendor.MinimumOrderAmount;
        vendor.DeliveryFee = req.DeliveryFee ?? vendor.DeliveryFee;
        vendor.EstimatedPrepTimeMinutes = req.EstimatedPrepTimeMinutes ?? vendor.EstimatedPrepTimeMinutes;

        if (req.LogoUrl is not null)
            vendor.LogoUrl = string.IsNullOrWhiteSpace(req.LogoUrl) ? null : req.LogoUrl;

        if (req.BannerUrl is not null)
            vendor.BannerUrl = string.IsNullOrWhiteSpace(req.BannerUrl) ? null : req.BannerUrl;

        if (req.PhoneNumber is not null)
        {
            var normalizedPhoneNumber = PhoneNumberNormalizer.Normalize(req.PhoneNumber);
            var existingPhoneUser = _userManager.Users.FirstOrDefault(u =>
                u.PhoneNumber == normalizedPhoneNumber && u.Id != vendor.UserId);

            if (existingPhoneUser is not null)
                throw new InvalidOperationException("A user with this phone number already exists.");

            vendor.User.PhoneNumber = string.IsNullOrWhiteSpace(normalizedPhoneNumber)
                ? null
                : normalizedPhoneNumber;
        }

        if (req.ServiceCategoryIds is not null)
        {
            vendor.VendorServiceCategories.Clear();
            foreach (var catId in req.ServiceCategoryIds)
            {
                var category = await _categoryRepo.GetByIdAsync(catId, ct)
                    ?? throw new InvalidOperationException("One or more selected service categories do not exist.");

                if (!category.IsActive || !category.RequiresVendor)
                    throw new InvalidOperationException("One or more selected service categories are not valid for vendors.");

                vendor.VendorServiceCategories.Add(new VendorServiceCategory
                {
                    VendorId = vendor.Id,
                    ServiceCategoryId = catId
                });
            }
        }

        await _vendorRepo.UpdateAsync(vendor, ct);
        await _uow.SaveChangesAsync(ct);
        await VendorCache.BumpCatalogVersionAsync(_cache, ct);

        var updated = await _vendorRepo.GetByUserIdAsync(command.UserId, ct);
        return Queries.GetVendorsQueryHandler.MapToDto(updated!);
    }
}

// ─── Toggle Vendor Open/Closed ──────────────────────────────

public record ToggleVendorStatusCommand(Guid UserId, bool IsOpen) : IRequest<VendorDto>;

public class ToggleVendorStatusCommandHandler : IRequestHandler<ToggleVendorStatusCommand, VendorDto>
{
    private readonly IAppCache _cache;
    private readonly IVendorRepository _vendorRepo;
    private readonly IUnitOfWork _uow;

    public ToggleVendorStatusCommandHandler(IVendorRepository vendorRepo, IUnitOfWork uow, IAppCache cache)
    {
        _vendorRepo = vendorRepo;
        _uow = uow;
        _cache = cache;
    }

    public async Task<VendorDto> Handle(ToggleVendorStatusCommand command, CancellationToken ct)
    {
        var vendor = await _vendorRepo.GetByUserIdAsync(command.UserId, ct)
            ?? throw new KeyNotFoundException("Vendor profile not found.");

        vendor.IsOpen = command.IsOpen;
        await _vendorRepo.UpdateAsync(vendor, ct);
        await _uow.SaveChangesAsync(ct);
        await VendorCache.BumpCatalogVersionAsync(_cache, ct);

        return Queries.GetVendorsQueryHandler.MapToDto(vendor);
    }
}

// ─── Approve / Reject Vendor (Admin) ────────────────────────

public record ApproveVendorCommand(Guid VendorId, bool Approve) : IRequest<VendorDto>;

public class ApproveVendorCommandHandler : IRequestHandler<ApproveVendorCommand, VendorDto>
{
    private readonly IAppCache _cache;
    private readonly IVendorRepository _vendorRepo;
    private readonly IUnitOfWork _uow;

    public ApproveVendorCommandHandler(IVendorRepository vendorRepo, IUnitOfWork uow, IAppCache cache)
    {
        _vendorRepo = vendorRepo;
        _uow = uow;
        _cache = cache;
    }

    public async Task<VendorDto> Handle(ApproveVendorCommand command, CancellationToken ct)
    {
        var vendor = await _vendorRepo.GetByIdAsync(command.VendorId, ct)
            ?? throw new KeyNotFoundException($"Vendor {command.VendorId} not found.");

        vendor.Status = command.Approve ? VendorStatus.Active : VendorStatus.Suspended;
        await _vendorRepo.UpdateAsync(vendor, ct);
        await _uow.SaveChangesAsync(ct);
        await VendorCache.BumpCatalogVersionAsync(_cache, ct);

        var updated = await _vendorRepo.GetByIdWithDetailsAsync(command.VendorId, ct);
        return Queries.GetVendorsQueryHandler.MapToDto(updated!);
    }
}

// ─── Update Vendor Categories (Admin) ───────────────────────

public record UpdateVendorCategoriesCommand(Guid VendorId, List<Guid> ServiceCategoryIds) : IRequest<VendorDto>;

public class UpdateVendorCategoriesCommandHandler : IRequestHandler<UpdateVendorCategoriesCommand, VendorDto>
{
    private readonly IAppCache _cache;
    private readonly IVendorRepository _vendorRepo;
    private readonly IUnitOfWork _uow;

    public UpdateVendorCategoriesCommandHandler(IVendorRepository vendorRepo, IUnitOfWork uow, IAppCache cache)
    {
        _vendorRepo = vendorRepo;
        _uow = uow;
        _cache = cache;
    }

    public async Task<VendorDto> Handle(UpdateVendorCategoriesCommand command, CancellationToken ct)
    {
        var vendor = await _vendorRepo.GetByIdWithDetailsAsync(command.VendorId, ct)
            ?? throw new KeyNotFoundException($"Vendor {command.VendorId} not found.");

        vendor.VendorServiceCategories.Clear();
        foreach (var catId in command.ServiceCategoryIds)
        {
            vendor.VendorServiceCategories.Add(new VendorServiceCategory
            {
                VendorId = vendor.Id,
                ServiceCategoryId = catId
            });
        }

        await _vendorRepo.UpdateAsync(vendor, ct);
        await _uow.SaveChangesAsync(ct);
        await VendorCache.BumpCatalogVersionAsync(_cache, ct);

        var updated = await _vendorRepo.GetByIdWithDetailsAsync(command.VendorId, ct);
        return Queries.GetVendorsQueryHandler.MapToDto(updated!);
    }
}
