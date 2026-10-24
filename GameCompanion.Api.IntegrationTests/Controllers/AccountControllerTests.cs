using System.Net;
using System.Net.Http.Json;
using GameCompanion.Api.Controllers;
using GameCompanion.Api.Models;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.DependencyInjection;

namespace GameCompanion.Api.IntegrationTests.Controllers;

// Calls the account endpoints over HTTP against the Cosmos emulator. Each test gets its own API host and client,
// and the client keeps cookies like a browser.
public sealed class AccountControllerTests : IAsyncDisposable
{
    private const string Password = "Correct-horse-1";

    // WebApplicationFactory only uses its type argument to find the API's assembly. It's usually Program, but the
    // AppHost (referenced for the emulator) also has a public Program, so an API type names the assembly instead.
    private readonly WebApplicationFactory<AccountController> _factory;
    private readonly HttpClient _client;
    private readonly CapturingEmailSender _emails = new();

    public AccountControllerTests(CosmosFixture cosmos)
    {
        _factory = new WebApplicationFactory<AccountController>().WithWebHostBuilder(builder =>
        {
            builder.UseSetting("ConnectionStrings:gamecompanion", cosmos.ConnectionString);
            builder.ConfigureTestServices(services =>
                services.AddSingleton<IEmailSender<AppUser>>(_emails));
        });
        _client = _factory.CreateClient();
    }

    private static CancellationToken CancellationToken => TestContext.Current.CancellationToken;

    private static string NewEmail() => $"{Guid.NewGuid():N}@example.com";

    private Task<HttpResponseMessage> PostAsync(string path, object body)
        => _client.PostAsJsonAsync($"/api/account{path}", body, CancellationToken);

    private async Task<string> CreateAccountAsync()
    {
        var email = NewEmail();
        var response = await PostAsync("", new { email, password = Password });
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        return email;
    }

    private static async Task<ProblemDetails> ProblemFrom(HttpResponseMessage response)
    {
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
        var problem = await response.Content.ReadFromJsonAsync<HttpValidationProblemDetails>(CancellationToken);
        Assert.NotNull(problem);
        return problem;
    }

    [Fact]
    public async Task SessionIsUnauthorizedWhenNobodyIsSignedIn()
    {
        var response = await _client.GetAsync("/api/account/session", CancellationToken);

        // 401, not a redirect to a sign-in page.
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task CreatingAnAccountSignsThePlayerIn()
    {
        var email = NewEmail();

        var created = await PostAsync("", new { email, password = Password });
        var session = await _client.GetFromJsonAsync<SessionResponse>("/api/account/session", CancellationToken);

        Assert.Equal(HttpStatusCode.OK, created.StatusCode);
        var createdSession = await created.Content.ReadFromJsonAsync<SessionResponse>(CancellationToken);
        Assert.Equal(email, createdSession?.Email);
        Assert.Equal(createdSession, session);
    }

    [Fact]
    public async Task CreatingAnAccountWithATakenEmailReturnsAnEmailFieldError()
    {
        var email = await CreateAccountAsync();

        var response = await PostAsync("", new { email, password = Password });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var problem = (HttpValidationProblemDetails)await ProblemFrom(response);
        Assert.Equal(["Email"], problem.Errors.Keys);
        // Only the email message, not a second one about the user name.
        Assert.Single(problem.Errors["Email"]);
    }

    [Fact]
    public async Task CreatingAnAccountWithAWeakPasswordReturnsPasswordFieldErrors()
    {
        // UserManager checks the password before the email, so a weak password is reported on its own.
        var response = await PostAsync("", new { email = NewEmail(), password = "short" });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var problem = (HttpValidationProblemDetails)await ProblemFrom(response);
        Assert.Equal(["Password"], problem.Errors.Keys);
        Assert.NotEmpty(problem.Errors["Password"]);
    }

    [Fact]
    public async Task SignInWithTheRightPasswordStartsASession()
    {
        var email = await CreateAccountAsync();
        await PostAsync("/sign-out", new { });

        var response = await PostAsync("/sign-in", new { email, password = Password, remember = false });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var session = await _client.GetFromJsonAsync<SessionResponse>("/api/account/session", CancellationToken);
        Assert.Equal(email, session?.Email);
    }

    [Fact]
    public async Task SignInWithAWrongPasswordOrUnknownEmailIsUnauthorized()
    {
        var email = await CreateAccountAsync();
        await PostAsync("/sign-out", new { });

        var wrongPassword = await PostAsync("/sign-in", new { email, password = "Wrong-password-1", remember = false });
        var unknownEmail = await PostAsync("/sign-in", new { email = NewEmail(), password = Password, remember = false });

        Assert.Equal(HttpStatusCode.Unauthorized, wrongPassword.StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, unknownEmail.StatusCode);
        Assert.Equal((await ProblemFrom(wrongPassword)).Title, (await ProblemFrom(unknownEmail)).Title);
    }

    [Fact]
    public async Task RepeatedWrongPasswordsLockTheAccountOut()
    {
        var email = await CreateAccountAsync();
        await PostAsync("/sign-out", new { });

        // Identity locks the account on the fifth failure by default.
        for (var attempt = 1; attempt <= 4; attempt++)
        {
            var failed = await PostAsync("/sign-in", new { email, password = "Wrong-password-1", remember = false });
            Assert.Equal(HttpStatusCode.Unauthorized, failed.StatusCode);
        }

        var fifth = await PostAsync("/sign-in", new { email, password = "Wrong-password-1", remember = false });
        var rightPasswordWhileLocked = await PostAsync("/sign-in", new { email, password = Password, remember = false });

        Assert.Equal(HttpStatusCode.Forbidden, fifth.StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, rightPasswordWhileLocked.StatusCode);
        Assert.False(string.IsNullOrEmpty((await ProblemFrom(rightPasswordWhileLocked)).Title));
    }

    [Fact]
    public async Task SignOutEndsTheSession()
    {
        await CreateAccountAsync();

        var signedOut = await PostAsync("/sign-out", new { });
        var session = await _client.GetAsync("/api/account/session", CancellationToken);

        Assert.Equal(HttpStatusCode.NoContent, signedOut.StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, session.StatusCode);
    }

    [Fact]
    public async Task ForgotPasswordSendsALinkThatResetsThePassword()
    {
        var email = await CreateAccountAsync();
        await PostAsync("/sign-out", new { });

        var forgot = await PostAsync("/forgot-password", new { email });

        Assert.Equal(HttpStatusCode.NoContent, forgot.StatusCode);
        var link = Assert.Single(_emails.ResetLinks);
        Assert.StartsWith("/reset-password?", link, StringComparison.Ordinal);
        var query = QueryHelpers.ParseQuery(new Uri(new Uri("https://localhost"), link).Query);

        var reset = await PostAsync("/reset-password", new
        {
            email = query["email"].ToString(),
            token = query["token"].ToString(),
            newPassword = "Brand-new-password-1",
        });
        var signIn = await PostAsync("/sign-in", new { email, password = "Brand-new-password-1", remember = false });

        Assert.Equal(HttpStatusCode.NoContent, reset.StatusCode);
        Assert.Equal(HttpStatusCode.OK, signIn.StatusCode);
    }

    [Fact]
    public async Task ForgotPasswordForAnUnknownEmailLooksTheSameButSendsNothing()
    {
        var response = await PostAsync("/forgot-password", new { email = NewEmail() });

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        Assert.Empty(_emails.ResetLinks);
    }

    [Fact]
    public async Task ResetPasswordWithAnInvalidTokenIsRefused()
    {
        var email = await CreateAccountAsync();

        var response = await PostAsync("/reset-password", new { email, token = "expired", newPassword = "Brand-new-password-1" });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal("Invalid or expired reset link", (await ProblemFrom(response)).Title);
    }

    public async ValueTask DisposeAsync()
    {
        _client.Dispose();
        await _factory.DisposeAsync();
    }

    private sealed class CapturingEmailSender : IEmailSender<AppUser>
    {
        public List<string> ResetLinks { get; } = [];

        public Task SendPasswordResetLinkAsync(AppUser user, string email, string resetLink)
        {
            ResetLinks.Add(resetLink);
            return Task.CompletedTask;
        }

        public Task SendConfirmationLinkAsync(AppUser user, string email, string confirmationLink) => Task.CompletedTask;

        public Task SendPasswordResetCodeAsync(AppUser user, string email, string resetCode) => Task.CompletedTask;
    }
}
