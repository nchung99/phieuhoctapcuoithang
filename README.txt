KAPLA OIEC v6.1 STABLE
- AI: 2 workers, 1 request = 1 batch max 5.
- Prefer Flash Lite; high-demand waits briefly then fallback; quota switches model immediately.
- Max 2 models per request to avoid Vercel timeout.
- Client timeout 24s.
- Retry exact failed batch.
- FIX Edit Save: safely migrates class/month cache key and refreshes dropdown/panel/report.


v8: Report template rebuilt from the supplied official OIEC PDF form. Logic based on v6.1.2.


v8.4: Enlarged A4 typography/spacing, corrected the 3-column table to five independent content fields, updated AI prompt/edit fields, and fixed logo URL for server PDF.


v8.5: Top row of Knowledge/Subject Skill is now fixed by subject. Robotics uses LEGO SPIKE Essential + robot assembly; Coding uses Scratch + programming products/games. Gemini only generates the personalized lower row, project, completion and criteria.
