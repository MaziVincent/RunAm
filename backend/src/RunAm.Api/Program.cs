using RunAm.Api;
using RunAm.Api.Hubs;
using RunAm.Api.Middleware;
using RunAm.Application;
using RunAm.Infrastructure;
using RunAm.Infrastructure.Persistence;
using Serilog;
using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;
using DotNetEnv;

// Load .env file (no-throw if missing — production uses real env vars)
Env.Load();

var builder = WebApplication.CreateBuilder(args);

// Map environment variables → Configuration sections
builder.Configuration.AddInMemoryCollection(new Dictionary<string, string?>
{
    // Database
    ["ConnectionStrings:DefaultConnection"] =
        $"Host={E("DATABASE_HOST")};Port={E("DATABASE_PORT")};Database={E("DATABASE_NAME")};Username={E("DATABASE_USER")};Password={E("DATABASE_PASSWORD")}",
    ["ConnectionStrings:Redis"] = E("REDIS_CONNECTION"),

    // JWT
    ["JwtSettings:SecretKey"] = E("JWT_SECRET_KEY"),
    ["JwtSettings:Issuer"] = E("JWT_ISSUER"),
    ["JwtSettings:Audience"] = E("JWT_AUDIENCE"),
    ["JwtSettings:ExpiryMinutes"] = E("JWT_EXPIRY_MINUTES"),
    ["JwtSettings:RefreshExpiryDays"] = E("JWT_REFRESH_EXPIRY_DAYS"),

    // Seq
    ["Seq:ServerUrl"] = E("SEQ_SERVER_URL"),

    // ZeptoMail
    ["ZeptoMail:ApiKey"] = E("ZEPTOMAIL_API_KEY"),
    ["ZeptoMail:FromEmail"] = E("ZEPTOMAIL_FROM_EMAIL"),
    ["ZeptoMail:FromName"] = E("ZEPTOMAIL_FROM_NAME"),

    // Termii
    ["Termii:ApiKey"] = E("TERMII_API_KEY"),
    ["Termii:SenderId"] = E("TERMII_SENDER_ID"),

    // Paystack
    ["Paystack:SecretKey"] = E("PAYSTACK_SECRET_KEY"),
    ["Paystack:PublicKey"] = E("PAYSTACK_PUBLIC_KEY"),
    ["Paystack:WebhookSecret"] = E("PAYSTACK_WEBHOOK_SECRET"),

    // File Storage
    ["Storage:Endpoint"] = E("STORAGE_ENDPOINT"),
    ["Storage:AccessKey"] = E("STORAGE_ACCESS_KEY"),
    ["Storage:SecretKey"] = E("STORAGE_SECRET_KEY"),
    ["Storage:Bucket"] = E("STORAGE_BUCKET"),
    ["Storage:UseSsl"] = E("STORAGE_USE_SSL"),

    // RabbitMQ
    ["RabbitMQ:Host"] = E("RABBITMQ_HOST"),
    ["RabbitMQ:Port"] = E("RABBITMQ_PORT"),
    ["RabbitMQ:User"] = E("RABBITMQ_USER"),
    ["RabbitMQ:Password"] = E("RABBITMQ_PASSWORD"),

    // FCM
    ["Fcm:ProjectId"] = E("FCM_PROJECT_ID"),
    ["Fcm:CredentialsJson"] = E("FCM_CREDENTIALS_JSON"),

    // CORS
    ["Cors:Origins"] = E("CORS_ORIGINS"),
}.Where(kv => kv.Value is not null)!);

// Helper: read env var (returns null when not set — filtered out above)
static string? E(string name) => Environment.GetEnvironmentVariable(name);

// Serilog
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .WriteTo.Seq(builder.Configuration["Seq:ServerUrl"] ?? "http://localhost:5341")
    .CreateLogger();

builder.Host.UseSerilog();

// Add services
builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// CORS — read origins from config, fallback to defaults
var corsOrigins = builder.Configuration["Cors:Origins"]?
    .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
    ?? ["http://localhost:3000", "http://localhost:3001", "http://localhost:19006"];

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy
            .WithOrigins(corsOrigins)
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials();
    });
});

builder.Services.AddSignalR();

builder.Services.AddHealthChecks()
    .AddNpgSql(builder.Configuration.GetConnectionString("DefaultConnection")!)
    .AddRedis(builder.Configuration.GetConnectionString("Redis") ?? "localhost:6379");

var app = builder.Build();

// Middleware pipeline
app.UseMiddleware<ExceptionMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.MapScalarApiReference(options =>
    {
        options.Title = "RunAm API";
        options.Theme = ScalarTheme.BluePlanet;
        options.OpenApiRoutePattern = "/swagger/{documentName}/swagger.json";
    });
}

app.UseSerilogRequestLogging();
app.UseCors("AllowAll");
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHealthChecks("/health");

// SignalR Hubs
app.MapHub<TrackingHub>("/hubs/tracking");
app.MapHub<ChatHub>("/hubs/chat");
app.MapHub<NotificationHub>("/hubs/notifications");
app.MapHub<AdminHub>("/hubs/admin");

// Apply migrations on startup in development
if (app.Environment.IsDevelopment())
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await db.Database.MigrateAsync();
    await DataSeeder.SeedAsync(scope.ServiceProvider);
}

app.Run();

// Make Program accessible for integration tests
public partial class Program { }
