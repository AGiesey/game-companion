var builder = DistributedApplication.CreateBuilder(args);

var cosmos = builder.AddAzureCosmosDB("cosmos")
    .RunAsEmulator(emulator => emulator.WithDataExplorer());

var database = cosmos.AddCosmosDatabase("gamecompanion");

var api = builder.AddProject<Projects.GameCompanion_Api>("api")
    .WithReference(database)
    .WaitFor(database)
    .WithHttpHealthCheck("/health")
    .WithExternalHttpEndpoints();

var web = builder.AddViteApp("web", "../web")
    .WithReference(api)
    .WaitFor(api);

// On publish, the built front end is copied into the API's wwwroot and served from there.
api.PublishWithContainerFiles(web, "wwwroot");

builder.Build().Run();
