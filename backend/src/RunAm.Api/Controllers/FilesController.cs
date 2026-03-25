using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RunAm.Domain.Interfaces;
using RunAm.Shared.DTOs;

namespace RunAm.Api.Controllers;

[Route("api/v1/files")]
[Authorize]
public class FilesController : BaseApiController
{
    private readonly IFileStorageService _storageService;
    private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".jpg", ".jpeg", ".png", ".webp", ".gif"
    };
    private const long MaxFileSize = 5 * 1024 * 1024; // 5 MB

    public FilesController(IFileStorageService storageService)
    {
        _storageService = storageService;
    }

    /// <summary>Upload a profile image</summary>
    [HttpPost("profile-image")]
    [ProducesResponseType(typeof(ApiResponse<FileUploadResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> UploadProfileImage(IFormFile file)
    {
        var url = await UploadFile(file, "profiles");
        return Ok(ApiResponse<FileUploadResponse>.Ok(new FileUploadResponse(url)));
    }

    /// <summary>Upload a product image</summary>
    [HttpPost("product-image")]
    [ProducesResponseType(typeof(ApiResponse<FileUploadResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> UploadProductImage(IFormFile file)
    {
        var url = await UploadFile(file, "products");
        return Ok(ApiResponse<FileUploadResponse>.Ok(new FileUploadResponse(url)));
    }

    /// <summary>Upload a vendor logo or banner</summary>
    [HttpPost("vendor-image")]
    [ProducesResponseType(typeof(ApiResponse<FileUploadResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> UploadVendorImage(IFormFile file)
    {
        var url = await UploadFile(file, "vendors");
        return Ok(ApiResponse<FileUploadResponse>.Ok(new FileUploadResponse(url)));
    }

    /// <summary>Upload a rider document (ID, selfie)</summary>
    [HttpPost("rider-document")]
    [ProducesResponseType(typeof(ApiResponse<FileUploadResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> UploadRiderDocument(IFormFile file)
    {
        var url = await UploadFile(file, "rider-docs");
        return Ok(ApiResponse<FileUploadResponse>.Ok(new FileUploadResponse(url)));
    }

    /// <summary>Delete a previously uploaded file</summary>
    [HttpDelete]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> DeleteFile([FromQuery] string url)
    {
        await _storageService.DeleteAsync(url);
        return Ok(ApiResponse.Ok("File deleted."));
    }

    private async Task<string> UploadFile(IFormFile file, string folder)
    {
        if (file is null || file.Length == 0)
            throw new ArgumentException("No file provided.");

        if (file.Length > MaxFileSize)
            throw new ArgumentException("File size exceeds the 5 MB limit.");

        var ext = Path.GetExtension(file.FileName);
        if (!AllowedExtensions.Contains(ext))
            throw new ArgumentException($"File type '{ext}' is not allowed. Allowed: {string.Join(", ", AllowedExtensions)}");

        await using var stream = file.OpenReadStream();
        return await _storageService.UploadAsync(stream, file.FileName, folder);
    }
}

public record FileUploadResponse(string Url);
