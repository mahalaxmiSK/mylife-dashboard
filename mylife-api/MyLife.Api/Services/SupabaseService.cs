using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Configuration;

public class SupabaseService : ISupabaseService
{
    private readonly HttpClient _http;
    private readonly string _baseUrl;

    private static readonly JsonSerializerOptions JsonOpts =
        new() { PropertyNameCaseInsensitive = true };

    public SupabaseService(HttpClient http, IConfiguration config)
    {
        _http = http;
        _baseUrl = config["SupabaseUrl"]
            ?? throw new InvalidOperationException("SupabaseUrl not configured");
        var key = config["SupabaseServiceKey"]
            ?? throw new InvalidOperationException("SupabaseServiceKey not configured");

        _http.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", key);
        _http.DefaultRequestHeaders.Add("apikey", key);
    }

    public async Task<T?> GetAsync<T>(string table, string? query = null)
    {
        var url = $"{_baseUrl}/rest/v1/{table}";
        if (query != null) url += $"?{query}";
        var response = await _http.GetAsync(url);
        response.EnsureSuccessStatusCode();
        return JsonSerializer.Deserialize<T>(
            await response.Content.ReadAsStringAsync(), JsonOpts);
    }

    public async Task<T?> InsertAsync<T>(string table, object payload)
    {
        var url = $"{_baseUrl}/rest/v1/{table}";
        using var request = new HttpRequestMessage(HttpMethod.Post, url)
        {
            Content = new StringContent(
                JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json")
        };
        request.Headers.Add("Prefer", "return=representation");
        var response = await _http.SendAsync(request);
        response.EnsureSuccessStatusCode();
        return JsonSerializer.Deserialize<T>(
            await response.Content.ReadAsStringAsync(), JsonOpts);
    }

    public async Task<T?> UpdateAsync<T>(string table, string filter, object payload)
    {
        var url = $"{_baseUrl}/rest/v1/{table}?{filter}";
        using var request = new HttpRequestMessage(HttpMethod.Patch, url)
        {
            Content = new StringContent(
                JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json")
        };
        request.Headers.Add("Prefer", "return=representation");
        var response = await _http.SendAsync(request);
        response.EnsureSuccessStatusCode();
        return JsonSerializer.Deserialize<T>(
            await response.Content.ReadAsStringAsync(), JsonOpts);
    }

    public async Task DeleteAsync(string table, string filter)
    {
        var url = $"{_baseUrl}/rest/v1/{table}?{filter}";
        var response = await _http.DeleteAsync(url);
        response.EnsureSuccessStatusCode();
    }
}
