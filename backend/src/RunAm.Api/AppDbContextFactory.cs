using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using RunAm.Infrastructure.Persistence;

namespace RunAm.Api;

public sealed class AppDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
{
    public AppDbContext CreateDbContext(string[] args)
    {
        var connectionString =
            DatabaseConnectionStringResolver.FromEnvironment()
            ?? Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection");

        if (string.IsNullOrWhiteSpace(connectionString))
        {
            throw new InvalidOperationException(
                "No database connection is configured. Set DATABASE_URL, all DATABASE_* variables, " +
                "or ConnectionStrings__DefaultConnection.");
        }

        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(
                connectionString,
                npgsqlOptions =>
                {
                    npgsqlOptions.MigrationsAssembly(typeof(AppDbContext).Assembly.FullName);
                    npgsqlOptions.CommandTimeout(30);
                })
            .Options;

        return new AppDbContext(options);
    }
}
