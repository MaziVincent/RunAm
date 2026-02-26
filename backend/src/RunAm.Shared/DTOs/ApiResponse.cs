namespace RunAm.Shared.DTOs;

public class ApiResponse<T>
{
    public bool Success { get; set; }
    public T? Data { get; set; }
    public ApiError? Error { get; set; }
    public PaginationMeta? Meta { get; set; }

    public static ApiResponse<T> Ok(T data, PaginationMeta? meta = null) => new()
    {
        Success = true,
        Data = data,
        Meta = meta
    };

    public static ApiResponse<T> Fail(string message, string code = "ERROR") => new()
    {
        Success = false,
        Error = new ApiError { Code = code, Message = message }
    };
}

public class ApiResponse : ApiResponse<object>
{
    public static ApiResponse Ok() => new() { Success = true };

    public new static ApiResponse Fail(string message, string code = "ERROR") => new()
    {
        Success = false,
        Error = new ApiError { Code = code, Message = message }
    };
}

public class ApiError
{
    public string Code { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public Dictionary<string, string[]>? Details { get; set; }
}

public class PaginationMeta
{
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalCount { get; set; }
    public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);
}
