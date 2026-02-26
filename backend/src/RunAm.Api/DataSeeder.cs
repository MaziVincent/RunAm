using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using RunAm.Domain.Entities;
using RunAm.Domain.Enums;
using RunAm.Infrastructure.Persistence;
using RunAm.Shared.Constants;

namespace RunAm.Api;

public static class DataSeeder
{
    public static async Task SeedAsync(IServiceProvider serviceProvider)
    {
        var roleManager = serviceProvider.GetRequiredService<RoleManager<IdentityRole<Guid>>>();
        var userManager = serviceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        var db = serviceProvider.GetRequiredService<AppDbContext>();

        // Seed roles
        string[] roles = { AppConstants.Roles.Customer, AppConstants.Roles.Rider, AppConstants.Roles.Merchant, AppConstants.Roles.Admin, AppConstants.Roles.SupportAgent };
        foreach (var role in roles)
        {
            if (!await roleManager.RoleExistsAsync(role))
                await roleManager.CreateAsync(new IdentityRole<Guid>(role));
        }

        // Seed admin user
        var adminEmail = "admin@runam.app";
        if (await userManager.FindByEmailAsync(adminEmail) == null)
        {
            var admin = new ApplicationUser
            {
                UserName = adminEmail,
                Email = adminEmail,
                FirstName = "System",
                LastName = "Admin",
                Role = UserRole.Admin,
                Status = UserStatus.Active,
                IsEmailVerified = true,
                EmailConfirmed = true
            };

            await userManager.CreateAsync(admin, "Admin@123456");
            await userManager.AddToRoleAsync(admin, AppConstants.Roles.Admin);
        }

        // Seed service categories (mirrors ErrandCategory enum for backward compat)
        if (!await db.ServiceCategories.AnyAsync())
        {
            var categories = new List<ServiceCategory>
            {
                new() { Name = "Package Delivery",         Slug = "package-delivery",          SortOrder = 0,  RequiresVendor = false, Description = "Send packages from point A to B" },
                new() { Name = "Food Delivery",            Slug = "food-delivery",             SortOrder = 1,  RequiresVendor = true,  Description = "Order from restaurants & food vendors" },
                new() { Name = "Grocery Shopping",         Slug = "grocery-shopping",          SortOrder = 2,  RequiresVendor = true,  Description = "Send a rider to buy groceries" },
                new() { Name = "Document Delivery",        Slug = "document-delivery",         SortOrder = 3,  RequiresVendor = false, Description = "Secure document transport" },
                new() { Name = "Pharmacy Pickup",          Slug = "pharmacy-pickup",           SortOrder = 4,  RequiresVendor = true,  Description = "Medication pickup & delivery" },
                new() { Name = "Laundry Pickup/Delivery",  Slug = "laundry-pickup-delivery",   SortOrder = 5,  RequiresVendor = true,  Description = "Laundry service logistics" },
                new() { Name = "Custom Errand",            Slug = "custom-errand",             SortOrder = 6,  RequiresVendor = false, Description = "Any custom task with description" },
                new() { Name = "Multi-Stop Delivery",      Slug = "multi-stop-delivery",       SortOrder = 7,  RequiresVendor = false, Description = "Multiple pickup/drop-off points" },
                new() { Name = "Return & Exchange",        Slug = "return-exchange",           SortOrder = 8,  RequiresVendor = true,  Description = "Product returns to merchants" },
                new() { Name = "Bill Payment",             Slug = "bill-payment",              SortOrder = 9,  RequiresVendor = false, Description = "Pay bills on behalf of user" },
            };

            await db.ServiceCategories.AddRangeAsync(categories);
            await db.SaveChangesAsync();
        }
    }
}
