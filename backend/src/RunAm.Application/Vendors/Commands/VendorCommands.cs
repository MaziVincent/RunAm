using MediatR;
using RunAm.Domain.Entities;
using RunAm.Domain.Enums;
using RunAm.Domain.Interfaces;
using RunAm.Shared.DTOs.Vendors;

namespace RunAm.Application.Vendors.Commands;

// ─── Create Vendor (Merchant) ───────────────────────────────

public record CreateVendorCommand(Guid UserId, CreateVendorRequest Request) : IRequest<VendorDto>;

public class CreateVendorCommandHandler : IRequestHandler<CreateVendorCommand, VendorDto>
{
    private readonly IVendorRepository _vendorRepo;
    private readonly IServiceCategoryRepository _categoryRepo;
    private readonly IUnitOfWork _uow;

    public CreateVendorCommandHandler(IVendorRepository vendorRepo, IServiceCategoryRepository categoryRepo, IUnitOfWork uow)
    {
        _vendorRepo = vendorRepo;
        _categoryRepo = categoryRepo;
        _uow = uow;
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
            vendor.VendorServiceCategories.Add(new VendorServiceCategory
            {
                VendorId = vendor.Id,
                ServiceCategoryId = catId
            });
        }

        await _vendorRepo.AddAsync(vendor, ct);
        await _uow.SaveChangesAsync(ct);

        // Reload to include navigation properties
        var created = await _vendorRepo.GetByUserIdAsync(command.UserId, ct);
        return Queries.GetVendorsQueryHandler.MapToDto(created!);
    }
}

// ─── Update Vendor (Merchant) ───────────────────────────────

public record UpdateVendorCommand(Guid UserId, UpdateVendorRequest Request) : IRequest<VendorDto>;

public class UpdateVendorCommandHandler : IRequestHandler<UpdateVendorCommand, VendorDto>
{
    private readonly IVendorRepository _vendorRepo;
    private readonly IUnitOfWork _uow;

    public UpdateVendorCommandHandler(IVendorRepository vendorRepo, IUnitOfWork uow)
    {
        _vendorRepo = vendorRepo;
        _uow = uow;
    }

    public async Task<VendorDto> Handle(UpdateVendorCommand command, CancellationToken ct)
    {
        var vendor = await _vendorRepo.GetByUserIdAsync(command.UserId, ct)
            ?? throw new KeyNotFoundException("Vendor profile not found.");

        var req = command.Request;
        vendor.BusinessName = req.BusinessName;
        vendor.BusinessDescription = req.BusinessDescription;
        vendor.Address = req.Address;
        vendor.Latitude = req.Latitude;
        vendor.Longitude = req.Longitude;
        vendor.OperatingHours = req.OperatingHours;
        vendor.MinimumOrderAmount = req.MinimumOrderAmount;
        vendor.DeliveryFee = req.DeliveryFee;
        vendor.EstimatedPrepTimeMinutes = req.EstimatedPrepTimeMinutes;

        // Update service categories
        vendor.VendorServiceCategories.Clear();
        foreach (var catId in req.ServiceCategoryIds)
        {
            vendor.VendorServiceCategories.Add(new VendorServiceCategory
            {
                VendorId = vendor.Id,
                ServiceCategoryId = catId
            });
        }

        await _vendorRepo.UpdateAsync(vendor, ct);
        await _uow.SaveChangesAsync(ct);

        var updated = await _vendorRepo.GetByUserIdAsync(command.UserId, ct);
        return Queries.GetVendorsQueryHandler.MapToDto(updated!);
    }
}

// ─── Toggle Vendor Open/Closed ──────────────────────────────

public record ToggleVendorStatusCommand(Guid UserId, bool IsOpen) : IRequest<VendorDto>;

public class ToggleVendorStatusCommandHandler : IRequestHandler<ToggleVendorStatusCommand, VendorDto>
{
    private readonly IVendorRepository _vendorRepo;
    private readonly IUnitOfWork _uow;

    public ToggleVendorStatusCommandHandler(IVendorRepository vendorRepo, IUnitOfWork uow)
    {
        _vendorRepo = vendorRepo;
        _uow = uow;
    }

    public async Task<VendorDto> Handle(ToggleVendorStatusCommand command, CancellationToken ct)
    {
        var vendor = await _vendorRepo.GetByUserIdAsync(command.UserId, ct)
            ?? throw new KeyNotFoundException("Vendor profile not found.");

        vendor.IsOpen = command.IsOpen;
        await _vendorRepo.UpdateAsync(vendor, ct);
        await _uow.SaveChangesAsync(ct);

        return Queries.GetVendorsQueryHandler.MapToDto(vendor);
    }
}

// ─── Approve / Reject Vendor (Admin) ────────────────────────

public record ApproveVendorCommand(Guid VendorId, bool Approve) : IRequest<VendorDto>;

public class ApproveVendorCommandHandler : IRequestHandler<ApproveVendorCommand, VendorDto>
{
    private readonly IVendorRepository _vendorRepo;
    private readonly IUnitOfWork _uow;

    public ApproveVendorCommandHandler(IVendorRepository vendorRepo, IUnitOfWork uow)
    {
        _vendorRepo = vendorRepo;
        _uow = uow;
    }

    public async Task<VendorDto> Handle(ApproveVendorCommand command, CancellationToken ct)
    {
        var vendor = await _vendorRepo.GetByIdAsync(command.VendorId, ct)
            ?? throw new KeyNotFoundException($"Vendor {command.VendorId} not found.");

        vendor.Status = command.Approve ? VendorStatus.Active : VendorStatus.Suspended;
        await _vendorRepo.UpdateAsync(vendor, ct);
        await _uow.SaveChangesAsync(ct);

        var updated = await _vendorRepo.GetByIdWithDetailsAsync(command.VendorId, ct);
        return Queries.GetVendorsQueryHandler.MapToDto(updated!);
    }
}
