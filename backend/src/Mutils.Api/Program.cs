using System.Security.Claims;
using System.Text.Json.Serialization;
using DotNetEnv;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Minio;
using Mutils.Api.Endpoints;
using Mutils.Api.Services;
using Mutils.Core.Services;
using Mutils.Infrastructure.Data;
using Mutils.Infrastructure.Services;
using Scalar.AspNetCore;

Env.TraversePath().Load();

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<MutilsDbContext>(options =>
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("Default")
        ?? builder.Configuration["ConnectionStrings__Default"]
        ?? throw new InvalidOperationException("Database connection string not configured")
    ));

builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IMudaeParser, MudaeParser>();
builder.Services.AddScoped<IOptimizerService, OptimizerService>();
builder.Services.AddScoped<IExportService, ExportService>();
builder.Services.AddScoped<IStorageService, MinioStorageService>();
builder.Services.AddHostedService<ImageProcessingService>();

var minioEndpoint = builder.Configuration["MINIO_ENDPOINT"] ?? "localhost:9000";
var minioAccessKey = builder.Configuration["MINIO_ACCESS_KEY"] ?? "minioadmin";
var minioSecretKey = builder.Configuration["MINIO_SECRET_KEY"] ?? "minioadmin";
var minioUseSsl = bool.TryParse(builder.Configuration["MINIO_USE_SSL"], out var ssl) && ssl;

builder.Services.AddSingleton<IMinioClient>(sp => {
    return new MinioClient()
        .WithEndpoint(minioEndpoint)
        .WithCredentials(minioAccessKey, minioSecretKey)
        .WithSSL(minioUseSsl)
        .Build();
});

var jwtSecret = builder.Configuration["JWT_SECRET"]
    ?? throw new InvalidOperationException("JWT_SECRET not configured");
var jwtIssuer = builder.Configuration["JWT_ISSUER"] ?? "mutils";
var jwtAudience = builder.Configuration["JWT_AUDIENCE"] ?? "mutils-users";

builder.Services.AddAuthentication(options => {
        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(options => {
        options.TokenValidationParameters = new TokenValidationParameters {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtIssuer,
            ValidAudience = jwtAudience,
            IssuerSigningKey = new SymmetricSecurityKey(System.Text.Encoding.UTF8.GetBytes(jwtSecret))
        };
    });

builder.Services.AddAuthorization();
builder.Services.AddOpenApi();

builder.Services.ConfigureHttpJsonOptions(options => {
    options.SerializerOptions.Converters.Add(new JsonStringEnumConverter());
});

builder.Services.AddCors(options => {
    options.AddDefaultPolicy(policy => {
        policy.WithOrigins("http://localhost:5173", "http://127.0.0.1:5173")
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

var app = builder.Build();

if (app.Environment.IsDevelopment()) {
    app.MapOpenApi();
    app.MapScalarApiReference(options => {
        options.Title = "Mutils API";
        options.Theme = ScalarTheme.Purple;
    });
}

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();

app.MapAuthEndpoints();
app.MapCollectionEndpoints();
app.MapListEndpoints();
app.MapOptimizerEndpoints();
app.MapUserEndpoints();
app.MapKakeraEndpoints();
app.MapCalculatorEndpoints();

using (var scope = app.Services.CreateScope()) {
    var db = scope.ServiceProvider.GetRequiredService<MutilsDbContext>();
    await db.Database.MigrateAsync();
}

app.Run();
