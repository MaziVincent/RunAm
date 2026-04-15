using FluentAssertions;
using Moq;
using RunAm.Application.Users.Commands;
using RunAm.Domain.Entities;
using RunAm.Domain.Interfaces;
using RunAm.Shared.DTOs;
using Xunit;

namespace RunAm.UnitTests.Services;

public class UserAddressCommandTests
{
    [Fact]
    public async Task CreateAddress_FirstAddressBecomesDefault_WhenRequestDoesNotSetDefault()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var addresses = new List<UserAddress>();
        var repo = CreateRepository(addresses);
        var uow = CreateUnitOfWork();
        var handler = new CreateAddressCommandHandler(repo.Object, uow.Object);

        var command = new CreateAddressCommand(
            userId,
            new CreateAddressRequest("Home", "12 Marina, Lagos", 6.45, 3.39, false));

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsDefault.Should().BeTrue();
        addresses.Should().ContainSingle();
        addresses[0].IsDefault.Should().BeTrue();
        uow.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task UpdateAddress_SettingDefault_UnsetsExistingDefault()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var primary = new UserAddress
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Label = "Home",
            Address = "12 Marina, Lagos",
            Latitude = 6.45,
            Longitude = 3.39,
            IsDefault = true,
        };
        var secondary = new UserAddress
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Label = "Office",
            Address = "15 Broad Street, Lagos",
            Latitude = 6.46,
            Longitude = 3.4,
            IsDefault = false,
        };
        var addresses = new List<UserAddress> { primary, secondary };
        var repo = CreateRepository(addresses);
        var uow = CreateUnitOfWork();
        var handler = new UpdateAddressCommandHandler(repo.Object, uow.Object);

        var command = new UpdateAddressCommand(
            userId,
            secondary.Id,
            new UpdateAddressRequest("HQ", null, null, null, true));

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsDefault.Should().BeTrue();
        result.Label.Should().Be("HQ");
        primary.IsDefault.Should().BeFalse();
        secondary.IsDefault.Should().BeTrue();
    }

    [Fact]
    public async Task DeleteAddress_RemovingDefault_PromotesAnotherAddress()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var defaultAddress = new UserAddress
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Label = "Home",
            Address = "12 Marina, Lagos",
            Latitude = 6.45,
            Longitude = 3.39,
            IsDefault = true,
        };
        var backupAddress = new UserAddress
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Label = "Office",
            Address = "15 Broad Street, Lagos",
            Latitude = 6.46,
            Longitude = 3.4,
            IsDefault = false,
        };
        var addresses = new List<UserAddress> { defaultAddress, backupAddress };
        var repo = CreateRepository(addresses);
        var uow = CreateUnitOfWork();
        var handler = new DeleteAddressCommandHandler(repo.Object, uow.Object);

        // Act
        await handler.Handle(new DeleteAddressCommand(userId, defaultAddress.Id), CancellationToken.None);

        // Assert
        addresses.Should().ContainSingle();
        addresses[0].Id.Should().Be(backupAddress.Id);
        backupAddress.IsDefault.Should().BeTrue();
    }

    [Fact]
    public async Task SetDefaultAddress_UnsetsAllOtherDefaults()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var first = new UserAddress
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Label = "Home",
            Address = "12 Marina, Lagos",
            Latitude = 6.45,
            Longitude = 3.39,
            IsDefault = true,
        };
        var second = new UserAddress
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Label = "Gym",
            Address = "20 Allen Avenue, Ikeja",
            Latitude = 6.6,
            Longitude = 3.35,
            IsDefault = false,
        };
        var addresses = new List<UserAddress> { first, second };
        var repo = CreateRepository(addresses);
        var uow = CreateUnitOfWork();
        var handler = new SetDefaultAddressCommandHandler(repo.Object, uow.Object);

        // Act
        var result = await handler.Handle(new SetDefaultAddressCommand(userId, second.Id), CancellationToken.None);

        // Assert
        result.Id.Should().Be(second.Id);
        result.IsDefault.Should().BeTrue();
        first.IsDefault.Should().BeFalse();
        second.IsDefault.Should().BeTrue();
    }

    private static Mock<IUserAddressRepository> CreateRepository(List<UserAddress> addresses)
    {
        var repo = new Mock<IUserAddressRepository>();

        repo.Setup(x => x.GetByUserIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Guid userId, CancellationToken _) =>
                addresses
                    .Where(address => address.UserId == userId)
                    .OrderByDescending(address => address.IsDefault)
                    .ThenBy(address => address.Label)
                    .ToList());

        repo.Setup(x => x.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Guid id, CancellationToken _) => addresses.FirstOrDefault(address => address.Id == id));

        repo.Setup(x => x.AddAsync(It.IsAny<UserAddress>(), It.IsAny<CancellationToken>()))
            .Callback<UserAddress, CancellationToken>((address, _) =>
            {
                if (address.Id == Guid.Empty)
                {
                    address.Id = Guid.NewGuid();
                }

                addresses.Add(address);
            })
            .Returns(Task.CompletedTask);

        repo.Setup(x => x.UpdateAsync(It.IsAny<UserAddress>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        repo.Setup(x => x.DeleteAsync(It.IsAny<UserAddress>(), It.IsAny<CancellationToken>()))
            .Callback<UserAddress, CancellationToken>((address, _) => addresses.Remove(address))
            .Returns(Task.CompletedTask);

        return repo;
    }

    private static Mock<IUnitOfWork> CreateUnitOfWork()
    {
        var uow = new Mock<IUnitOfWork>();
        uow.Setup(x => x.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);
        return uow;
    }
}