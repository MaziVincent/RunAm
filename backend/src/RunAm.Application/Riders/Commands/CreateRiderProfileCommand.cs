using MediatR;
using Microsoft.AspNetCore.Identity;
using RunAm.Domain.Entities;
using RunAm.Domain.Exceptions;
using RunAm.Domain.Interfaces;
using RunAm.Shared.DTOs.Riders;

namespace RunAm.Application.Riders.Commands;

public record CreateRiderProfileCommand(Guid UserId, CreateRiderProfileRequest Request) : IRequest<RiderProfileDto>;

public class CreateRiderProfileCommandHandler : IRequestHandler<CreateRiderProfileCommand, RiderProfileDto>
{
    private readonly IRiderRepository _riderRepo;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IWalletRepository _walletRepo;
    private readonly IMonnifyService _monnify;
    private readonly IUnitOfWork _uow;

    public CreateRiderProfileCommandHandler(
        IRiderRepository riderRepo,
        UserManager<ApplicationUser> userManager,
        IWalletRepository walletRepo,
        IMonnifyService monnify,
        IUnitOfWork uow)
    {
        _riderRepo = riderRepo;
        _userManager = userManager;
        _walletRepo = walletRepo;
        _monnify = monnify;
        _uow = uow;
    }

    public async Task<RiderProfileDto> Handle(CreateRiderProfileCommand command, CancellationToken cancellationToken)
    {
        var existing = await _riderRepo.GetByUserIdAsync(command.UserId, cancellationToken);
        if (existing != null)
            throw new InvalidOperationException("Rider profile already exists.");

        var user = await _userManager.FindByIdAsync(command.UserId.ToString())
            ?? throw new NotFoundException("User", command.UserId);

        if (string.IsNullOrWhiteSpace(user.Email))
            throw new InvalidOperationException("A verified email is required to create a rider wallet.");

        var normalizedNin = NormalizeNin(command.Request.Nin);
        user.Nin = normalizedNin;

        var identityResult = await _userManager.UpdateAsync(user);
        if (!identityResult.Succeeded)
        {
            var errors = string.Join(" ", identityResult.Errors.Select(e => e.Description));
            throw new InvalidOperationException(errors);
        }

        if (!command.Request.AgreedToTerms)
            throw new InvalidOperationException("You must agree to the rider terms and policy.");

        var profile = new RiderProfile
        {
            UserId = command.UserId,
            VehicleType = command.Request.VehicleType,
            LicensePlate = command.Request.LicensePlate,
            SelfieUrl = command.Request.SelfieUrl,
            Address = command.Request.Address,
            City = command.Request.City,
            State = command.Request.State,
            SettlementBankCode = command.Request.SettlementBankCode,
            SettlementBankName = command.Request.SettlementBankName,
            SettlementAccountNumber = command.Request.SettlementAccountNumber,
            SettlementAccountName = command.Request.SettlementAccountName,
            AgreedToTerms = true,
            AgreedAt = DateTime.UtcNow,
            ApprovalStatus = Domain.Enums.ApprovalStatus.Pending
        };

        var wallet = await _walletRepo.GetByUserIdAsync(command.UserId, cancellationToken);
        if (wallet?.IsActive != true)
        {
            var reservedAccount = await _monnify.ReserveAccountAsync(
                user.Id,
                user.FullName,
                user.Email,
                normalizedNin,
                cancellationToken);

            wallet ??= new Wallet { UserId = user.Id };
            wallet.Activate(
                reservedAccount.AccountReference,
                reservedAccount.AccountNumber,
                reservedAccount.AccountName,
                reservedAccount.BankName,
                reservedAccount.BankCode);

            if (await _walletRepo.GetByUserIdAsync(user.Id, cancellationToken) is null)
                await _walletRepo.AddAsync(wallet, cancellationToken);
            else
                await _walletRepo.UpdateAsync(wallet, cancellationToken);
        }

        await _riderRepo.AddAsync(profile, cancellationToken);
        await _uow.SaveChangesAsync(cancellationToken);

        return new RiderProfileDto(
            profile.Id, profile.UserId, user.FullName, profile.VehicleType, profile.LicensePlate,
            profile.ApprovalStatus, profile.Rating, profile.TotalCompletedTasks,
            profile.IsOnline, profile.CurrentLatitude, profile.CurrentLongitude,
            profile.LastLocationUpdate, profile.CreatedAt
        );
    }

    private static string NormalizeNin(string nin)
    {
        var digits = new string((nin ?? string.Empty).Where(char.IsDigit).ToArray());
        if (digits.Length != 11)
            throw new InvalidOperationException("NIN must be exactly 11 digits.");

        return digits;
    }
}
