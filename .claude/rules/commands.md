# Commands

- The user keeps `npm run start:dev` (`nest --watch`, port 3001) running in their terminal; `npm run build` overwrites the same `dist/`.
- While working, type-check with `npx tsc --noEmit -p tsconfig.json`.
- `npm run build` is allowed without asking, but as the **final check** at the end of the task (full compile, as in CI and Docker), not after every edit. If port 3001 is busy (`lsof -i :3001`), say in the summary that the watcher may have crashed and needs a restart.
- Do not run without warning and consent: `migration:generate`, `migration:run`, `migration:revert`, `seed:run` (they touch the DB). Write migrations by hand — the dev server applies them itself (`migrationsRun: true`).
- `npm run lint` is `eslint --fix` over all of `src`, `npm run lint:check` is the same without fixes (as in CI); the code is clean, so both are safe. Quick lint of your files: `npx eslint <files>`. There is no Prettier; formatting is the `@stylistic` rules in ESLint.
- Verify live against the already running server (`http://localhost:3001/api`, Swagger `/api/docs`). Isolated run: `APP_PORT=<free> node dist/main.js` in the background, always stopped afterwards.
