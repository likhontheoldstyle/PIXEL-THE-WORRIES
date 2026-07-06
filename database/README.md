# database/

Reserved for future persistence needs (e.g. SQLite, MongoDB, or a JSON-file
store for tool usage stats). No database is required for the current feature
set — the ImgBB tool is stateless and talks directly to the ImgBB API.

If you add a database later:
1. Keep connection logic in `server/utils/db.js` (create this file).
2. Read connection strings from `.env`, never hardcode credentials.
3. Document the new environment variables in the root `README.md`.
