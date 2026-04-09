namespace RunAm.Application.ServiceCategories;

internal static class ServiceCategoryCacheKeys
{
    public const string All = "service-categories:active";

    public static string BySlug(string slug) => $"service-categories:slug:{slug.Trim().ToLowerInvariant()}";
}