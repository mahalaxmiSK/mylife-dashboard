using System.Net;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Xunit;

public class SupabaseServiceTests
{
    private SupabaseService CreateService(HttpClient httpClient)
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["SupabaseUrl"] = "https://fake.supabase.co",
                ["SupabaseServiceKey"] = "fake-key"
            })
            .Build();
        return new SupabaseService(httpClient, config);
    }

    [Fact]
    public async Task GetAsync_ReturnsDeserializedList()
    {
        var payload = JsonSerializer.Serialize(new[] { new { id = "abc", name = "Walk" } });
        var handler = new FakeHttpHandler(HttpStatusCode.OK, payload);
        var service = CreateService(new HttpClient(handler));

        var result = await service.GetAsync<List<Dictionary<string, string>>>("habits");

        Assert.NotNull(result);
        Assert.Single(result!);
        Assert.Equal("abc", result![0]["id"]);
    }

    [Fact]
    public async Task InsertAsync_PostsAndReturnsResult()
    {
        var payload = JsonSerializer.Serialize(new[] { new { id = "new-id", name = "Run" } });
        var handler = new FakeHttpHandler(HttpStatusCode.Created, payload);
        var service = CreateService(new HttpClient(handler));

        var result = await service.InsertAsync<List<Dictionary<string, string>>>("habits", new { name = "Run" });

        Assert.NotNull(result);
        Assert.Equal("new-id", result![0]["id"]);
        Assert.Equal(HttpMethod.Post, handler.LastRequest?.Method);
    }
}

public class FakeHttpHandler : HttpMessageHandler
{
    private readonly HttpStatusCode _status;
    private readonly string _content;
    public HttpRequestMessage? LastRequest { get; private set; }

    public FakeHttpHandler(HttpStatusCode status, string content)
    {
        _status = status;
        _content = content;
    }

    protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
    {
        LastRequest = request;
        return Task.FromResult(new HttpResponseMessage(_status)
        {
            Content = new StringContent(_content, Encoding.UTF8, "application/json")
        });
    }
}
