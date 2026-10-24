using System.Security.Claims;
using GameCompanion.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace GameCompanion.Api.Controllers;

// Accounts and the signed-in session, backed by Identity and a cookie. The player's email is also their user name.
[ApiController]
[Route("api/account")]
public sealed class AccountController(
    UserManager<AppUser> userManager,
    SignInManager<AppUser> signInManager,
    TimeProvider timeProvider) : ControllerBase
{
    private const string InvalidResetLinkTitle = "Invalid or expired reset link";

    // Who is signed in. Answers 401 when nobody is, which the front end reads as "no session".
    [Authorize]
    [HttpGet("session")]
    public Results<Ok<SessionResponse>, UnauthorizedHttpResult> GetSession()
    {
        var userId = userManager.GetUserId(User);
        var email = User.FindFirstValue(ClaimTypes.Email);

        return userId is null || email is null
            ? TypedResults.Unauthorized()
            : TypedResults.Ok(new SessionResponse(userId, email));
    }

    // Named SignInPlayer and SignOutPlayer because ControllerBase already has SignIn and SignOut helpers.
    [HttpPost("sign-in")]
    public async Task<Results<Ok<SessionResponse>, ProblemHttpResult>> SignInPlayer(SignInRequest request)
    {
        var user = await userManager.FindByEmailAsync(request.Email);
        if (user is null)
        {
            return IncorrectEmailOrPassword();
        }

        var result = await signInManager.PasswordSignInAsync(
            user, request.Password, isPersistent: request.Remember, lockoutOnFailure: true);

        if (result.Succeeded)
        {
            return TypedResults.Ok(SessionFor(user));
        }

        if (result.IsLockedOut)
        {
            return TypedResults.Problem(
                statusCode: StatusCodes.Status403Forbidden,
                title: "Too many failed sign-in attempts. Try again in a few minutes.");
        }

        if (result.IsNotAllowed)
        {
            return TypedResults.Problem(
                statusCode: StatusCodes.Status403Forbidden,
                title: "This account can't sign in.");
        }

        return IncorrectEmailOrPassword();
    }

    [HttpPost("sign-out")]
    public async Task<NoContent> SignOutPlayer()
    {
        await signInManager.SignOutAsync();
        return TypedResults.NoContent();
    }

    // Creates the account and signs the player in, staying signed in like the sign-in screen's default.
    [HttpPost]
    public async Task<Results<Ok<SessionResponse>, ValidationProblem>> CreateAccount(CreateAccountRequest request)
    {
        var user = new AppUser
        {
            UserName = request.Email,
            Email = request.Email,
            CreatedAt = timeProvider.GetUtcNow(),
        };

        var result = await userManager.CreateAsync(user, request.Password);
        if (!result.Succeeded)
        {
            return TypedResults.ValidationProblem(FieldErrors(result.Errors));
        }

        await signInManager.SignInAsync(user, isPersistent: true);
        return TypedResults.Ok(SessionFor(user));
    }

    // Always answers 204, so the response doesn't reveal which emails have accounts.
    [HttpPost("forgot-password")]
    public async Task<NoContent> ForgotPassword(
        ForgotPasswordRequest request,
        [FromServices] IEmailSender<AppUser> emailSender)
    {
        var user = await userManager.FindByEmailAsync(request.Email);
        if (user?.Email is not null)
        {
            var token = await userManager.GeneratePasswordResetTokenAsync(user);
            // Relative on purpose: the absolute address must come from configuration, never from the request's
            // Host or Origin headers, or a forged header could send someone's reset link to another site.
            var resetLink =
                $"/reset-password?token={Uri.EscapeDataString(token)}&email={Uri.EscapeDataString(user.Email)}";

            await emailSender.SendPasswordResetLinkAsync(user, user.Email, resetLink);
        }

        return TypedResults.NoContent();
    }

    [HttpPost("reset-password")]
    public async Task<Results<NoContent, ValidationProblem, ProblemHttpResult>> ResetPassword(ResetPasswordRequest request)
    {
        var user = await userManager.FindByEmailAsync(request.Email);
        if (user is null)
        {
            return InvalidResetLink();
        }

        var result = await userManager.ResetPasswordAsync(user, request.Token, request.NewPassword);
        if (result.Succeeded)
        {
            return TypedResults.NoContent();
        }

        var invalidToken = userManager.ErrorDescriber.InvalidToken().Code;
        return result.Errors.Any(error => error.Code == invalidToken)
            ? InvalidResetLink()
            : TypedResults.ValidationProblem(FieldErrors(result.Errors));
    }

    private static SessionResponse SessionFor(AppUser user) => new(user.Id, user.Email ?? "");

    // The same answer for an unknown email and a wrong password, so neither is revealed.
    private static ProblemHttpResult IncorrectEmailOrPassword()
        => TypedResults.Problem(statusCode: StatusCodes.Status401Unauthorized, title: "Email or password is incorrect.");

    private static ProblemHttpResult InvalidResetLink()
        => TypedResults.Problem(statusCode: StatusCodes.Status400BadRequest, title: InvalidResetLinkTitle);

    // Groups Identity's errors under the form fields they belong to. The user name is the email, so a duplicate
    // user name always comes with a duplicate email and is left out rather than shown twice.
    private static Dictionary<string, string[]> FieldErrors(IEnumerable<IdentityError> errors)
        => errors
            .Where(error => error.Code != nameof(IdentityErrorDescriber.DuplicateUserName))
            .GroupBy(error => error.Code switch
            {
                _ when error.Code.StartsWith("Password", StringComparison.Ordinal) => "Password",
                nameof(IdentityErrorDescriber.DuplicateEmail)
                    or nameof(IdentityErrorDescriber.InvalidEmail)
                    or nameof(IdentityErrorDescriber.InvalidUserName) => "Email",
                _ => "",
            })
            .ToDictionary(group => group.Key, group => group.Select(error => error.Description).ToArray());
}

public sealed record SessionResponse(string UserId, string Email);

public sealed record SignInRequest(string Email, string Password, bool Remember);

public sealed record CreateAccountRequest(string Email, string Password);

public sealed record ForgotPasswordRequest(string Email);

public sealed record ResetPasswordRequest(string Email, string Token, string NewPassword);
