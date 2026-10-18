var builder = WebApplication.CreateBuilder(args);

builder.AddServiceDefaults();
builder.AddAzureCosmosClient("gamecompanion");

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
