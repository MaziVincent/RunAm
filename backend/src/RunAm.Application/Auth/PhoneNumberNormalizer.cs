namespace RunAm.Application.Auth;

public static class PhoneNumberNormalizer
{
    public static string Normalize(string phoneNumber)
    {
        if (string.IsNullOrWhiteSpace(phoneNumber))
            return string.Empty;

        var trimmed = phoneNumber.Trim();
        var hasLeadingPlus = trimmed.StartsWith('+');
        var digits = new string(trimmed.Where(char.IsDigit).ToArray());

        if (digits.Length == 0)
            return string.Empty;

        return hasLeadingPlus ? $"+{digits}" : digits;
    }
}