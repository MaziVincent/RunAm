using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using RunAm.Domain.Entities;
using RunAm.Domain.Enums;
using RunAm.Infrastructure.Persistence;
using RunAm.Shared.Constants;

namespace RunAm.Api;

public static class ProductionAdminSeeder
{
    // Stable, application-specific PostgreSQL advisory-lock key.
    private const long AdvisoryLockKey = 7_246_263_664_612_641_001;
    private static readonly string[] RequiredRoles =
    [
        AppConstants.Roles.Customer,
        AppConstants.Roles.Rider,
        AppConstants.Roles.Merchant,
        AppConstants.Roles.Admin,
        AppConstants.Roles.SupportAgent,
    ];

    public static async Task SeedAsync(
        IServiceProvider serviceProvider,
        IConfiguration configuration,
        CancellationToken cancellationToken = default)
    {
        if (!configuration.GetValue<bool>("AdminSeed:Enabled"))
        {
            return;
        }

        var email = Required(configuration, "AdminSeed:Email", "ADMIN_SEED_EMAIL");
        var password = Required(configuration, "AdminSeed:Password", "ADMIN_SEED_PASSWORD");
        var firstName = configuration["AdminSeed:FirstName"]?.Trim();
        var lastName = configuration["AdminSeed:LastName"]?.Trim();

        var db = serviceProvider.GetRequiredService<AppDbContext>();
        var userManager = serviceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        var roleManager = serviceProvider.GetRequiredService<RoleManager<IdentityRole<Guid>>>();
        var logger = serviceProvider.GetRequiredService<ILoggerFactory>()
            .CreateLogger("ProductionAdminSeeder");

        var executionStrategy = db.Database.CreateExecutionStrategy();
        await executionStrategy.ExecuteAsync(async () =>
        {
            await using var transaction = await db.Database.BeginTransactionAsync(cancellationToken);
            await db.Database.ExecuteSqlRawAsync(
                $"SELECT pg_advisory_xact_lock({AdvisoryLockKey})",
                cancellationToken);

            foreach (var roleName in RequiredRoles)
            {
                if (!await roleManager.RoleExistsAsync(roleName))
                {
                    EnsureSucceeded(
                        await roleManager.CreateAsync(new IdentityRole<Guid>(roleName)),
                        $"Creating the {roleName} role");
                }
            }

            var admin = await userManager.FindByEmailAsync(email);
            if (admin is null)
            {
                admin = new ApplicationUser
                {
                    UserName = email,
                    Email = email,
                    FirstName = string.IsNullOrWhiteSpace(firstName) ? "System" : firstName,
                    LastName = string.IsNullOrWhiteSpace(lastName) ? "Admin" : lastName,
                    Role = UserRole.Admin,
                    Status = UserStatus.Active,
                    IsEmailVerified = true,
                    EmailConfirmed = true,
                };

                EnsureSucceeded(
                    await userManager.CreateAsync(admin, password),
                    "Creating the production admin user");
            }
            else
            {
                var alreadyAdmin = admin.Role == UserRole.Admin
                    || await userManager.IsInRoleAsync(admin, AppConstants.Roles.Admin);

                if (!alreadyAdmin)
                {
                    throw new InvalidOperationException(
                        $"ADMIN_SEED_EMAIL belongs to an existing non-admin account ({email}). " +
                        "Refusing to promote it automatically.");
                }

                admin.Role = UserRole.Admin;
                admin.Status = UserStatus.Active;
                admin.IsEmailVerified = true;
                admin.EmailConfirmed = true;
                EnsureSucceeded(
                    await userManager.UpdateAsync(admin),
                    "Updating the production admin user");
            }

            if (!await userManager.IsInRoleAsync(admin, AppConstants.Roles.Admin))
            {
                EnsureSucceeded(
                    await userManager.AddToRoleAsync(admin, AppConstants.Roles.Admin),
                    "Assigning the Admin role");
            }

            await transaction.CommitAsync(cancellationToken);
            logger.LogInformation("Production admin account is present for {AdminEmail}", email);
        });
    }

    private static string Required(
        IConfiguration configuration,
        string configurationKey,
        string environmentVariableName)
    {
        var value = configuration[configurationKey]?.Trim();
        if (string.IsNullOrWhiteSpace(value))
        {
            throw new InvalidOperationException(
                $"{environmentVariableName} is required when ADMIN_SEED_ENABLED=true.");
        }

        return value;
    }

    private static void EnsureSucceeded(IdentityResult result, string operation)
    {
        if (result.Succeeded)
        {
            return;
        }

        var errors = string.Join("; ", result.Errors.Select(error => error.Description));
        throw new InvalidOperationException($"{operation} failed: {errors}");
    }
}
