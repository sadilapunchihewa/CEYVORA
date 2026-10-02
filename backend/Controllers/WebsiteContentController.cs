using System.Security.Cryptography;
using System.Text.Json;
using System.Text.RegularExpressions;
using backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController, Route("api/content")]
public class WebsiteContentController(IWebHostEnvironment environment) : ControllerBase
{
    private static readonly SemaphoreSlim Gate = new(1, 1);
    private static readonly HashSet<string> Sections = ["journeys", "experiences", "tips", "faq", "business"];
    private string Published(string section) => Path.Combine(environment.ContentRootPath, "App_Data", "WebsiteContent", section + ".json");
    private string Seed(string section) => Path.Combine(environment.ContentRootPath, "Data", "WebsiteContent", section + ".json");
    private async Task<byte[]> Read(string section) => await System.IO.File.ReadAllBytesAsync(System.IO.File.Exists(Published(section)) ? Published(section) : Seed(section));
    private static string Version(byte[] data) => Convert.ToHexString(SHA256.HashData(data));

    [HttpGet("{section}"), AllowAnonymous]
    public async Task<IActionResult> Get(string section)
    {
        if (!Sections.Contains(section)) return NotFound();
        var bytes = await Read(section);
        return Ok(new { version = Version(bytes), items = JsonSerializer.Deserialize<JsonElement>(bytes) });
    }

    public record ContentUpdate(string Version, JsonElement Items);
    [HttpPut("{section}"), Authorize(Roles = Roles.Admin), RequestSizeLimit(1048576)]
    public async Task<IActionResult> Save(string section, ContentUpdate update)
    {
        if (!Sections.Contains(section)) return NotFound();
        if (update.Items.ValueKind != JsonValueKind.Array || update.Items.GetArrayLength() > 500)
            return BadRequest(new { message = "Supply a list of up to 500 entries." });
        var slugs = new HashSet<string>();
        foreach (var item in update.Items.EnumerateArray())
        {
            if (item.ValueKind != JsonValueKind.Object || !item.TryGetProperty("slug", out var slug)
                || slug.ValueKind != JsonValueKind.String || !Regex.IsMatch(slug.GetString()!, "^[a-z0-9]+(?:-[a-z0-9]+)*$")
                || !slugs.Add(slug.GetString()!)) return BadRequest(new { message = "Each entry needs a unique lowercase slug." });
            var required = section switch {
                "faq" => new[] { "question", "answer" },
                "journeys" => new[] { "name", "category", "description", "image", "heading", "advice" },
                "experiences" => new[] { "name", "category", "description", "image", "destination", "duration", "difficulty", "preparation" },
                "tips" => new[] { "name", "season", "access", "packing", "stay", "nearby" },
                _ => new[] { "name" }
            };
            foreach (var property in item.EnumerateObject())
                if (property.Name != "route" && property.Name != "nights" && property.Value.ValueKind != JsonValueKind.String)
                    return BadRequest(new { message = "Content fields must be text." });
            foreach (var field in required)
                if (!item.TryGetProperty(field, out var value) || value.ValueKind != JsonValueKind.String || string.IsNullOrWhiteSpace(value.GetString()))
                    return BadRequest(new { message = $"Each entry needs {field}." });
            if (section == "journeys" && (!item.TryGetProperty("route", out var route) || route.ValueKind != JsonValueKind.Array || route.GetArrayLength() < 2
                || route.EnumerateArray().Any(x => x.ValueKind != JsonValueKind.String || !Regex.IsMatch(x.GetString()!, "^[a-z0-9]+(?:-[a-z0-9]+)*$"))))
                return BadRequest(new { message = "A journey needs at least two destination slugs in its route." });
        }
        await Gate.WaitAsync();
        try
        {
            if (Version(await Read(section)) != update.Version) return Conflict(new { message = "Content changed in another session. Reload before saving." });
            var target = Published(section);
            Directory.CreateDirectory(Path.GetDirectoryName(target)!);
            var bytes = JsonSerializer.SerializeToUtf8Bytes(update.Items, new JsonSerializerOptions { WriteIndented = true });
            var temporary = target + ".tmp";
            await System.IO.File.WriteAllBytesAsync(temporary, bytes);
            System.IO.File.Move(temporary, target, true);
            return Ok(new { version = Version(bytes), items = update.Items });
        }
        finally { Gate.Release(); }
    }
}
