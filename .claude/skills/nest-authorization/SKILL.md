---
name: nest-authorization
description: Переносний патерн авторизації в NestJS з трьома рівнями — доступ до ендпоінту (дозволи + guard, OR, admin-байпас), дія над конкретним об'єктом (сервіс-політика на кшталт ієрархії ролей) і доменна участь (сервіс правил із трійкою can* / assert* / apply* — предикат, виняток, SQL-умова), актор через param-pipe, 404 vs 403, прапорці рішень у відповіді, публічні ендпоінти з опційним JWT, feature flags. Використовуй, коли захищаєш ендпоінт, додаєш правило «хто може», дозвіл, нову роль чи публічний ендпоінт, або вирішуєш, на якому рівні має жити перевірка.
---

# Авторизація: три рівні

Доменні правила цього проєкту — у `scheduler-accounts` (ієрархія ролей) і `scheduler-lessons` (участь у заняттях); тут — загальний патерн, як і де їх виражати.

| Рівень | Питання | Механізм | Приклад тут |
|---|---|---|---|
| 1. Ендпоінт | чи може цей користувач викликати ендпоінт узагалі | `@Permissions(...)` + `PermissionsGuard` | `read_departments` |
| 2. Об'єкт (політика) | чи може A діяти над **цим** B | сервіс-політика, дані з БД | `AuthorityService.canManageUser` |
| 3. Доменна участь | чи пов'язаний користувач з об'єктом за бізнес-правилом | сервіс правил + актор | `LessonAccessService.canEdit` |

Не змішуй рівні: дозвіл не вирішує «над ким», а участь у домені не підміняється дозволом. Якщо в домені дозволи не діють (домен викладачів), адмін працює через окремі адмін-ендпоінти без правил участі.

## 1. Рівень ендпоінту

```ts
@Get()
@ApiBearerAuth()
@UseGuards(JwtAccessGuard, PermissionsGuard)
@Permissions(Permission.READ_USERS, Permission.MANAGE_USERS)
```

- Семантика **OR**: достатньо одного з дозволів. Читання — `read_x` **і** `manage_x`; зміна — лише `manage_x`.
- `admin` проходить guard завжди — у списках його **не** перелічують. `@Permissions(Permission.ADMIN)` — лише для «тільки адмін» (семестри).
- Дозволи guard бере з access-токена: після зміни ролей вони оновлюються лише після refresh. Рішення рівнів 2–3 завжди читають БД.
- Тільки токен, без дозволів, — `@UseGuards(JwtAccessGuard)`.
- Публічний з необов'язковим користувачем — `OptionalJwtAccessGuard`: без заголовка — анонім, з простроченим токеном — 401.
- Ендпоінт за прапорцем середовища — `@Feature('name')` + `FeatureGuard` (`features.<name>` у конфігу).
- У новому проєкті ці чотири рядки — один складений `@Auth(...permissions)` через `applyDecorators`.

Новий дозвіл — `scheduler-accounts` (розділ про enum) і `typeorm-migrations` (перестворення типу).

## 2. Рівень об'єкта — сервіс-політика

```ts
@Injectable()
export class AuthorityService {
  async getAuthority(userId: string): Promise<IAuthorityModel> { /* ролі з БД */ }
  canManageUser(actor: IAuthorityModel, target: Pick<IAuthorityModel, 'userId' | 'rank'>): boolean { ... }
  assertCanManageUser(actor: IAuthorityModel, target: ...): void {
    if (!this.canManageUser(actor, target)) throw new ForbiddenException('You can only manage users ranked below you');
  }
}
```

- Одна формула — в одному сервісі. Перевірки «чи може A змінити B» поза ним не пишуться.
- Пара `can*` (булеве, для прапорців у відповіді) + `assert*` (виняток, для змін).
- Список повертає прапорець для кожного рядка (`canManage`), щоб клієнт не повторював формулу.

## 3. Доменна участь — сервіс правил

Для правил, що залежать від зв'язків об'єкта з користувачем (викладач заняття, завідувач кафедри, студент групи):

**Актор** — проєкція користувача на домен, обчислюється один раз на запит через param-pipe:

```ts
export const LessonActor = () => CurrentUser(ResolveLessonActorPipe);   // pipe → LessonAccessService.resolveActor
// анонім: усі поля null
```

**Трійка на кожне правило:**

| Метод | Для чого | Приклад |
|---|---|---|
| `canX(actor, target): boolean` | прапорець у відповіді, умови | `canEdit`, `canSee`, `canUseGroup` |
| `assertCanX(actor, target): void` | захист змін | `assertCanEdit` → 403 |
| `applyX(qb, actor): SelectQueryBuilder` | те саме правило як SQL-умова для списків | `applyVisibility`, `applyScope`, `applyUsableGroups` |

`canX` і `applyX` **мусять означати одне й те саме** — при зміні правила змінюються обидва (і тест, якщо є).

**Шари сервісів:**

```
Access service    правила (can / assert / apply), без логіки даних
Base service      CRUD і запити БЕЗ перевірок доступу (його ж викликають адмін-контролери)
Managed service   спершу правила, потім base; перераховує прапорці (canEdit) для актора
Controller        @LessonActor() → managed;  admin-*.controller → base напряму
```

Нова дія = правило в access-сервісі → логіка в base → зв'язка в managed → ендпоінт з актором; адмін-варіант — окремий контролер поверх base.

## 4. 404 чи 403

| Ситуація | Відповідь |
|---|---|
| об'єкт не існує | 404 |
| об'єкт існує, але користувач не має його бачити (приховане) | **404** — не розкривати існування |
| бачить, але не може змінити | 403 |
| немає дозволу на ендпоінт | 403 (guard) |
| немає / прострочений токен | 401 |

Порядок перевірок у managed-сервісі: знайти → `assertCanSee` (404) → `assertCanEdit` (403) → дані.

## 5. Повідомлення

Англійською, для кінцевого користувача, з поясненням правила: `'Only the lesson teachers and the head of its department can edit the lesson'`, а не `'Forbidden'`.

## 6. Чекліст

- [ ] Визначено рівень перевірки (1 / 2 / 3), перевірка не дублюється на іншому рівні.
- [ ] `@Permissions`: OR, без `ADMIN` у списку; читання = read + manage.
- [ ] Правило об'єкта / домену — у своєму сервісі, пара `can` + `assert` (+ `apply` для списків).
- [ ] Відповідь несе прапорець рішення (`canEdit` / `canManage`).
- [ ] Приховане — 404, видиме чуже — 403.
- [ ] Base-сервіс без перевірок; адмін-контролер поверх base.
- [ ] `docs/domain.md` оновлено (таблиця доступу, карта ендпоінтів з позначками дозволів).
