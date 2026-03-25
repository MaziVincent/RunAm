using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using RunAm.Domain.Interfaces;

namespace RunAm.Infrastructure.Services;

/// <summary>
/// Uploads and deletes files via Cloudinary.
/// </summary>
public class CloudinaryStorageService : IFileStorageService
{
    private readonly Cloudinary _cloudinary;
    private readonly ILogger<CloudinaryStorageService> _logger;

    public CloudinaryStorageService(IConfiguration configuration, ILogger<CloudinaryStorageService> logger)
    {
        _logger = logger;

        var section = configuration.GetSection("Cloudinary");
        var cloudName = section["CloudName"] ?? throw new InvalidOperationException("Cloudinary:CloudName is not configured.");
        var apiKey = section["ApiKey"] ?? throw new InvalidOperationException("Cloudinary:ApiKey is not configured.");
        var apiSecret = section["ApiSecret"] ?? throw new InvalidOperationException("Cloudinary:ApiSecret is not configured.");

        var account = new Account(cloudName, apiKey, apiSecret);
        _cloudinary = new Cloudinary(account);
        _cloudinary.Api.Secure = true;
    }

    public async Task<string> UploadAsync(Stream fileStream, string fileName, string folder, CancellationToken ct = default)
    {
        var publicId = $"{folder}/{Path.GetFileNameWithoutExtension(fileName)}_{Guid.NewGuid():N}";

        var uploadParams = new ImageUploadParams
        {
            File = new FileDescription(fileName, fileStream),
            PublicId = publicId,
            Overwrite = false,
        };

        var result = await _cloudinary.UploadAsync(uploadParams, ct);

        if (result.Error != null)
        {
            _logger.LogError("Cloudinary upload failed: {Error}", result.Error.Message);
            throw new InvalidOperationException($"File upload failed: {result.Error.Message}");
        }

        _logger.LogInformation("File uploaded to Cloudinary: {PublicId}", result.PublicId);
        return result.SecureUrl.ToString();
    }

    public async Task<bool> DeleteAsync(string publicIdOrUrl, CancellationToken ct = default)
    {
        // Extract public ID from URL if a full URL was provided
        var publicId = publicIdOrUrl;
        if (Uri.TryCreate(publicIdOrUrl, UriKind.Absolute, out var uri))
        {
            // Cloudinary URLs: .../upload/v1234567/folder/filename.ext
            var path = uri.AbsolutePath;
            var uploadIdx = path.IndexOf("/upload/", StringComparison.Ordinal);
            if (uploadIdx >= 0)
            {
                // Skip "/upload/vXXX/"
                var afterUpload = path[(uploadIdx + 8)..];
                var versionSlash = afterUpload.IndexOf('/');
                publicId = versionSlash >= 0
                    ? Path.GetFileNameWithoutExtension(afterUpload[(versionSlash + 1)..])
                    : Path.GetFileNameWithoutExtension(afterUpload);
            }
        }

        var result = await _cloudinary.DestroyAsync(new DeletionParams(publicId) { ResourceType = ResourceType.Image });

        if (result.Result == "ok")
        {
            _logger.LogInformation("File deleted from Cloudinary: {PublicId}", publicId);
            return true;
        }

        _logger.LogWarning("Cloudinary delete returned: {Result} for {PublicId}", result.Result, publicId);
        return false;
    }
}
