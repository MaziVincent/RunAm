using FluentAssertions;
using Npgsql;
using RunAm.Infrastructure.Persistence;
using Xunit;

namespace RunAm.UnitTests.Services;

public class DatabaseConnectionStringResolverTests
{
    [Fact]
    public void FromEnvironment_ReturnsNull_WhenDatabaseVariablesAreAbsent()
    {
        var result = DatabaseConnectionStringResolver.FromEnvironment(_ => null);

        result.Should().BeNull();
    }

    [Fact]
    public void FromEnvironment_PrefersDatabaseUrl()
    {
        var variables = new Dictionary<string, string?>
        {
            ["DATABASE_URL"] = "Host=production;Port=5432;Database=runam;Username=app;Password=secret",
            ["DATABASE_HOST"] = "local",
        };

        var result = DatabaseConnectionStringResolver.FromEnvironment(
            name => variables.GetValueOrDefault(name));
        var parsed = new NpgsqlConnectionStringBuilder(result);

        parsed.Host.Should().Be("production");
        parsed.Database.Should().Be("runam");
        parsed.SslMode.Should().Be(SslMode.Require);
        parsed.MaxPoolSize.Should().Be(20);
    }

    [Fact]
    public void FromEnvironment_BuildsConnectionFromCompleteIndividualVariables()
    {
        var variables = new Dictionary<string, string?>
        {
            ["DATABASE_HOST"] = "localhost",
            ["DATABASE_PORT"] = "5434",
            ["DATABASE_NAME"] = "runam",
            ["DATABASE_USER"] = "runam",
            ["DATABASE_PASSWORD"] = "password",
            ["DATABASE_SSL_MODE"] = "Require",
        };

        var result = DatabaseConnectionStringResolver.FromEnvironment(
            name => variables.GetValueOrDefault(name));
        var parsed = new NpgsqlConnectionStringBuilder(result);

        parsed.Host.Should().Be("localhost");
        parsed.Port.Should().Be(5434);
        parsed.Database.Should().Be("runam");
        parsed.Username.Should().Be("runam");
        parsed.Password.Should().Be("password");
        parsed.SslMode.Should().Be(SslMode.Require);
    }

    [Fact]
    public void FromEnvironment_RejectsPartialIndividualConfiguration()
    {
        var variables = new Dictionary<string, string?>
        {
            ["DATABASE_HOST"] = "localhost",
            ["DATABASE_PORT"] = "5434",
        };

        var action = () => DatabaseConnectionStringResolver.FromEnvironment(
            name => variables.GetValueOrDefault(name));

        action.Should()
            .Throw<InvalidOperationException>()
            .WithMessage("*DATABASE_NAME*DATABASE_USER*DATABASE_PASSWORD*");
    }

    [Fact]
    public void FromEnvironment_RejectsInvalidSslMode()
    {
        var variables = new Dictionary<string, string?>
        {
            ["DATABASE_HOST"] = "localhost",
            ["DATABASE_PORT"] = "5434",
            ["DATABASE_NAME"] = "runam",
            ["DATABASE_USER"] = "runam",
            ["DATABASE_PASSWORD"] = "password",
            ["DATABASE_SSL_MODE"] = "NotARealMode",
        };

        var action = () => DatabaseConnectionStringResolver.FromEnvironment(
            name => variables.GetValueOrDefault(name));

        action.Should()
            .Throw<InvalidOperationException>()
            .WithMessage("DATABASE_SSL_MODE 'NotARealMode' is invalid*");
    }
}
