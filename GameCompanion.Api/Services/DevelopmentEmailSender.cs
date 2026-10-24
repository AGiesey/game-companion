using GameCompanion.Api.Models;
using Microsoft.AspNetCore.Identity;

namespace GameCompanion.Api.Services;

// Stands in for real email during development: logs the link instead of sending it. Registered only in
// Development, because reset links are secrets that don't belong in production logs.
public sealed partial class DevelopmentEmailSender(ILogger<DevelopmentEmailSender> logger) : IEmailSender<AppUser>
{
    public Task SendConfirmationLinkAsync(AppUser user, string email, string confirmationLink)
    {
        LogConfirmationLink(email, confirmationLink);
        return Task.CompletedTask;
    }

    public Task SendPasswordResetLinkAsync(AppUser user, string email, string resetLink)
    {
        LogPasswordResetLink(email, resetLink);
        return Task.CompletedTask;
    }

    public Task SendPasswordResetCodeAsync(AppUser user, string email, string resetCode)
    {
        LogPasswordResetCode(email, resetCode);
        return Task.CompletedTask;
    }

    [LoggerMessage(Level = LogLevel.Information, Message = "Confirmation link for {Email}: {Link}")]
    private partial void LogConfirmationLink(string email, string link);

    [LoggerMessage(Level = LogLevel.Information, Message = "Password reset link for {Email}: {Link}")]
    private partial void LogPasswordResetLink(string email, string link);

    [LoggerMessage(Level = LogLevel.Information, Message = "Password reset code for {Email}: {Code}")]
    private partial void LogPasswordResetCode(string email, string code);
}
