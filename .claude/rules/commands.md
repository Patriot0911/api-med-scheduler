# Команди

- Користувач тримає `npm run start:dev` (`nest --watch`, порт 3001) у своєму терміналі. `npm run build` перезаписує `dist/` і вбиває його сервер.
- Перевірка типів — лише `npx tsc --noEmit -p tsconfig.json`.
- Не запускати без попередження й згоди: `npm run build`, `migration:generate`, `migration:run`, `migration:revert`, `seed:run` (усі будують `dist/`). Міграцію пиши руками — dev-сервер застосує її сам (`migrationsRun: true`).
- `npm run lint` робить `eslint --fix` по всьому `src`, `npm run format` — prettier по всьому репозиторію: масових переформатувань не робити. Лінт лише змінених файлів: `npx eslint <files>`.
- Живу перевірку роби на вже запущеному сервері (`http://localhost:3001/api`, Swagger `/api/docs`). Ізольований запуск — `APP_PORT=<вільний> node dist/main.js` у фоні з обов'язковим завершенням після.
- `docker compose down -v` і будь-яке очищення БД — лише на пряме прохання.
