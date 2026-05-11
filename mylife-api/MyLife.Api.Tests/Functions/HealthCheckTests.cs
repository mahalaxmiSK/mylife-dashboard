using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

public class HealthCheckTests
{
    [Fact]
    public void HealthCheck_CanBeInstantiated()
    {
        var logger = NullLogger<HealthCheck>.Instance;
        var function = new HealthCheck(logger);
        Assert.NotNull(function);
    }
}
