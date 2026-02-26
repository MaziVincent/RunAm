using RunAm.Domain.Entities;

namespace RunAm.Domain.Interfaces;

public interface IJwtTokenService
{
    string GenerateAccessToken(ApplicationUser user);
    string GenerateRefreshToken();
    (bool isValid, Guid userId) ValidateAccessToken(string token);
}
