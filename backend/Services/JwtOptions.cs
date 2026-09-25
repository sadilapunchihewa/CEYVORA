namespace backend.Services;

public class JwtOptions
{
    public string Key { get; set; } = string.Empty;
    public string Issuer { get; set; } = "CeyvoraAPI";
    public string Audience { get; set; } = "CeyvoraClient";
    public int ExpiryMinutes { get; set; } = 120;
}
