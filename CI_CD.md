# GitHub Actions

Pushes to main and pull requests run frontend lint/build, .NET build plus PostgreSQL smoke tests, and mocked AI tests (no Gemini key or paid calls). Build artifacts are retained for 14 days. Frontend uses Node 24, backend .NET 8, AI Python 3.12.

Set repository variable VITE_API_BASE_URL to your public backend origin before using a frontend artifact in production. Set VITE_AGENT_API_BASE_URL to your public AI service origin as well. Localhost builds are for local validation only.

CD is opt-in because hosting has not been supplied. For a host supporting HTTPS deployment hooks, configure the production environment secrets FRONTEND_DEPLOY_HOOK, BACKEND_DEPLOY_HOOK and AI_DEPLOY_HOOK; enable the repository variable DEPLOY_ENABLED=true. Set production environment approval rules as desired. Only successful main push CI runs trigger CD. Hooks request deployment; a successful hook response does not verify a healthy deployment. Configure each host to deploy the validated commit, and its health checks. For hosts without deploy hooks, replace this job with that host's supported deployment action.

Never commit Gemini keys, database passwords, JWT keys or mail credentials. Configure runtime secrets on the host. Disable demo seeding in production, apply database migrations intentionally, and preserve uploads/published content. The backend artifact excludes the CI example configuration.
