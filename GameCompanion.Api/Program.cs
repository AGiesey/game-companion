using System.Data.Common;            // DbConnectionStringBuilder
using GameCompanion.Api.Data;        // AppDbContext, AppUserStore
using GameCompanion.Api.Models;      // AppUser
using Microsoft.Azure.Cosmos;        // ConnectionMode
using Microsoft.EntityFrameworkCore; // UseCosmos

var builder = WebApplication.CreateBuilder(args);

builder.AddServiceDefaults();
builder.AddAzureCosmosClient("gamecompanion");

var cosmosConnectionString = builder.Configuration.GetConnectionString("gamecompanion")
    ?? throw new InvalidOperationException("Connection string 'gamecompanion' is missing.");

var cosmosSettings = new DbConnectionStringBuilder { ConnectionString = cosmosConnectionString };
var databaseName = cosmosSettings.TryGetValue("Database", out var value) && value is string name
    ? name
    : throw new InvalidOperationException("Connection string 'gamecompanion' has no Database.");

builder.Services.AddDbContext<AppDbContext>(options => 
    options.UseCosmos(cosmosConnectionString, databaseName, cosmos => 
        cosmos.ConnectionMode(ConnectionMode.Gateway)
    ));

builder.Services.AddIdentityCore<AppUser>(options =>
{
    options.User.RequireUniqueEmail = true;
})
.AddUserStore<AppUserStore>();

builder.Services.AddSingleton(TimeProvider.System);
builder.Services.AddProblemDetails();
builder.Services.AddControllers();
builder.Services.AddOpenApi();

var app = builder.Build();

app.UseExceptionHandler();
app.UseStatusCodePages();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.MapDefaultEndpoints();
app.MapControllers();

// Serves the built React app from wwwroot when published. In development, Vite serves it.
app.UseFileServer();

app.Run();
