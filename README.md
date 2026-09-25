# Ceyvora

ASP.NET Core 8 tourism API with PostgreSQL, JWT authentication and Customer/Admin roles.

## Local setup

1. Install the .NET 8 SDK and PostgreSQL.
2. Copy `backend/appsettings.example.json` to `backend/appsettings.json` and configure your local database connection. Local appsettings files are ignored by Git.
3. From `backend`, configure `Jwt:Key` using `dotnet user-secrets set "Jwt:Key" "<private-random-key-at-least-32-bytes>"`. Never commit a signing key or database password.
4. Run `dotnet restore`, `dotnet ef database update`, then `dotnet run --launch-profile http`.
5. Open http://localhost:5111/swagger.

For deployment, supply `ConnectionStrings__DefaultConnection` and `Jwt__Key` through your hosting provider's secret store. The example configuration contains placeholders only.

See [the Phase 2 report](backend/PHASE2.md) for architecture, endpoints, development admin setup and test instructions.
