using Npgsql;

namespace RunAm.Infrastructure.Persistence;

public static class DatabaseConnectionStringResolver
{
    private static readonly string[] IndividualVariableNames =
    [
        "DATABASE_HOST",
        "DATABASE_PORT",
        "DATABASE_NAME",
        "DATABASE_USER",
        "DATABASE_PASSWORD",
    ];

    public static string? FromEnvironment(Func<string, string?>? getEnvironmentVariable = null)
    {
        getEnvironmentVariable ??= Environment.GetEnvironmentVariable;

        var databaseUrl = NullIfWhiteSpace(getEnvironmentVariable("DATABASE_URL"));
        if (databaseUrl is not null)
        {
            return ApplyNpgsqlDefaults(databaseUrl, requireSsl: true);
        }

        var values = IndividualVariableNames.ToDictionary(
            name => name,
            name => NullIfWhiteSpace(getEnvironmentVariable(name)));

        if (values.Values.All(value => value is null))
        {
            return null;
        }

        var missingVariables = values
            .Where(pair => pair.Value is null)
            .Select(pair => pair.Key)
            .ToArray();

        if (missingVariables.Length > 0)
        {
            throw new InvalidOperationException(
                $"Incomplete database configuration. Missing: {string.Join(", ", missingVariables)}.");
        }

        if (!int.TryParse(values["DATABASE_PORT"], out var port))
        {
            throw new InvalidOperationException("DATABASE_PORT must be a valid integer.");
        }

        var builder = new NpgsqlConnectionStringBuilder
        {
            Host = values["DATABASE_HOST"]!,
            Port = port,
            Database = values["DATABASE_NAME"]!,
            Username = values["DATABASE_USER"]!,
            Password = values["DATABASE_PASSWORD"]!,
        };

        var configuredSslMode = NullIfWhiteSpace(getEnvironmentVariable("DATABASE_SSL_MODE"));
        if (configuredSslMode is not null)
        {
            if (!Enum.TryParse<SslMode>(configuredSslMode, ignoreCase: true, out var sslMode))
            {
                throw new InvalidOperationException(
                    $"DATABASE_SSL_MODE '{configuredSslMode}' is invalid. " +
                    $"Valid values are: {string.Join(", ", Enum.GetNames<SslMode>())}.");
            }

            builder.SslMode = sslMode;
        }

        // Individual DATABASE_* variables are primarily used by local Docker.
        // Keep Npgsql's SSL preference instead of forcing SSL against that container.
        return ApplyNpgsqlDefaults(builder.ConnectionString, requireSsl: false);
    }

    private static string ApplyNpgsqlDefaults(string connectionString, bool requireSsl)
    {
        var builder = new NpgsqlConnectionStringBuilder(connectionString);

        if (!builder.ShouldSerialize("Timeout"))
            builder.Timeout = 30;
        if (!builder.ShouldSerialize("Command Timeout"))
            builder.CommandTimeout = 30;
        if (!builder.ShouldSerialize("Keepalive"))
            builder.KeepAlive = 30;
        if (requireSsl && !builder.ShouldSerialize("SSL Mode"))
            builder.SslMode = SslMode.Require;
        if (!builder.ShouldSerialize("Pooling"))
            builder.Pooling = true;
        if (!builder.ShouldSerialize("Minimum Pool Size"))
            builder.MinPoolSize = 0;
        if (!builder.ShouldSerialize("Maximum Pool Size"))
            builder.MaxPoolSize = 20;

        return builder.ConnectionString;
    }

    private static string? NullIfWhiteSpace(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value;
}
