namespace RunAm.Domain.Interfaces;

/// <summary>
/// Abstraction for file/image storage (Cloudinary).
/// </summary>
public interface IFileStorageService
{
    /// <summary>Upload a file from a stream and return its public URL.</summary>
    Task<string> UploadAsync(Stream fileStream, string fileName, string folder, CancellationToken ct = default);

    /// <summary>Delete a file by its public URL or public ID.</summary>
    Task<bool> DeleteAsync(string publicIdOrUrl, CancellationToken ct = default);
}
