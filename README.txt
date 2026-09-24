KAPLA OIEC v6.1 STABLE
- AI: 2 workers, 1 request = 1 batch max 5.
- Prefer Flash Lite; high-demand waits briefly then fallback; quota switches model immediately.
- Max 2 models per request to avoid Vercel timeout.
- Client timeout 24s.
- Retry exact failed batch.
- FIX Edit Save: safely migrates class/month cache key and refreshes dropdown/panel/report.
