---
paths:
  - "src/modules/**/controllers/**"
  - "src/modules/**/*.module.ts"
---

# Контролери й модулі

- Шлях з префіксом вручну: `@Controller('api/<resource>')`; `@ApiTags`.
- Захищений ендпоінт: `@ApiBearerAuth()` + `@UseGuards(JwtAccessGuard, PermissionsGuard)` + `@Permissions(...)`. OR-семантика; `Permission.ADMIN` у списку не перелічувати (проходить завжди), крім ендпоінтів «тільки адмін». Читання — `read_x, manage_x`, зміна — `manage_x`.
- Публічний з необов'язковим користувачем — `OptionalJwtAccessGuard`; домен викладачів — `@LessonActor()`, без `@Permissions`.
- Поточний користувач — `@CurrentUser() { sub, }: IAccessTokenPayload`; `@Req()` у новому коді не вживати.
- id у шляху — `@Param('xId', ParseUUIDPipe)` у новому коді.
- Контролер тонкий: жодних репозиторіїв і перевірок доступу; не загортати відповідь вручну (`ResponseInterceptor`); не повертати entity.
- Ендпоінти довідників `{ id, name }` — лише в `DictionariesModule`.
- Модуль: чужі entity сервісів — у `TypeOrmModule.forFeature([...])`; `exports` — лише потрібне іншим модулям.
- Новий / змінений ендпоінт — у «Карті ендпоінтів» `docs/domain.md`.
