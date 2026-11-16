---
name: nest-module-anatomy
description: Переносний патерн модуля NestJS + TypeORM, прийнятий у цьому проєкті — розкладка папок, інтерфейси models ↔ класи DTO, mapper entity → модель відповіді, сервіс з репозиторіями й транзакціями, контролер, реєстрація в модулі, списки з пагінацією й пошуком, довідники { id, name }, обробка «не знайдено» й конфліктів. Використовуй, коли створюєш новий модуль, ресурс, ендпоінт, сервісний метод, mapper чи модель відповіді — у будь-якому модулі, не лише доменному.
---

# Анатомія модуля

Еталон простого модуля — `src/modules/departments/`. Валідація входу — `nest-dto-validation`, доступ — `nest-authorization`, схема — `typeorm-migrations`.

## 1. Розкладка

```
src/modules/<name>/
  <name>.module.ts
  controllers/<name>.controller.ts           # admin-<name>.controller.ts — адмін-варіант того ж ресурсу
  dto/<action>-<entity>-request.dto.ts       # класи: class-validator + @ApiProperty
  models/<entity>-<kind>.model.ts            # інтерфейси I...Model, enum-и *.enum.ts
  entities/<entity>.entity.ts
  mappers/<name>.mapper.ts
  services/<name>.service.ts
```

Великий модуль ділить `dto/` і `models/` на підпапки за ресурсом (`lesson/dto/lessons/`, `lesson/dto/lesson-groups/`). Назва модуля — множина (`semester`, `lesson` — історичні винятки; шляхи імпорту перевіряй).

## 2. Контракти: models ↔ DTO

| Що | Де | Приклад |
|---|---|---|
| вхід | інтерфейс у `models/`, DTO-клас `implements` його | `class EditDepartmentRequestDto implements IEditDepartmentModel` |
| create = edit | `extends` | `class CreateDepartmentRequestDto extends EditDepartmentRequestDto implements ICreateDepartmentModel {}` |
| фільтри списку | `I<X>FiltersModel extends IPaginationFilters` | `IGetDepartmentsFiltersModel` |
| одна сутність | `I<Entity>ItemModel` | |
| рядок списку | `I<Entity>ListItemModel` (часто `extends ItemModel`) | |
| для селекта | `I<Entity>DictionaryItem` — `{ id, name }` | |

Сервіси приймають і повертають **інтерфейси** — не DTO і не entity. Контролер ніколи не повертає entity.

Прапорці рішень для клієнта (`canEdit`, `canManage`) — поля моделі відповіді, рахуються в сервісі.

## 3. Mapper

```ts
@Injectable()
export class DepartmentsMapper {
  entityToDictionaryItem({ id, name, }: DepartmentEntity): IDepartmentDictionaryItem {
    return { id, name, };
  }

  entityToListItem(entity: DepartmentEntity): IDepartmentListItemModel {
    return this.entityToItem(entity);
  }

  entityToItem({ id, name, headTeacherId, }: DepartmentEntity): IDepartmentItemModel {
    return { id, name, headTeacherId: headTeacherId ?? null, };
  }
}
```

- Явно перелічені поля (жодних `...entity`, щоб не витекли хеші / токени).
- Nullable → `?? null`, а не `undefined`.
- Назви зв'язків для показу (`teachers: { id, name }[]`) додає mapper, щоб клієнтам не потрібні були довідники.

## 4. Сервіс

```ts
@Injectable()
export class DepartmentsService {
  constructor(
    private readonly departmentsMapper: DepartmentsMapper,
    @InjectRepository(DepartmentEntity)
    private departmentsRepository: Repository<DepartmentEntity>,
  ) {}

  async getById(departmentId: string): Promise<IDepartmentItemModel> {
    const department = await this.departmentsRepository.findOneOrFail({ where: { id: departmentId, }, });
    return this.departmentsMapper.entityToItem(department);
  }
}
```

- Методи `async` з явним `Promise<IModel>`.
- «Має існувати» — `findOneOrFail` (фільтр перетворює на 404 `Not found`); потрібне конкретне повідомлення — `findOne` + `NotFoundException('Lesson not found')`.
- Порушення правила — `BadRequestException` (дані) / `ForbiddenException` (доступ) з англійським повідомленням для кінцевого користувача.
- Перевірки (`assert*`, `checkNameIsFree`) — до першого запису.
- Кілька записів, що мають пройти разом, — `repository.manager.transaction(async (manager) => { ... })` з репозиторіями від `manager`.
- Чужі entity, з якими працює сервіс, — у `TypeOrmModule.forFeature([...])` цього модуля, а не через імпорт чужого сервісу.
- Логіка без перевірок доступу живе в базовому сервісі; правила доступу — окремо (`nest-authorization`).

## 5. Списки

```ts
const qb = this.departmentsRepository
  .createQueryBuilder('dep')
  .orderBy('dep.name', 'ASC')
  .skip((page - 1) * pageSize)
  .take(pageSize);
if (search) {
  qb.andWhere('dep.name ILIKE :search', { search: `%${search}%`, });
}
const [rows, total] = await qb.getManyAndCount();
return { items: rows.map((row) => this.mapper.entityToListItem(row)), meta: { count: total, }, };
```

- Завжди детерміноване сортування.
- Параметри лише через `:param`, без інтерполяції значень у SQL.
- Пагінація опційна там, де клієнту потрібен весь діапазон (календар): `if (page && pageSize !== undefined)`.
- Складні фільтри — окремий `build<X>Query(filters)`, що повертає `SelectQueryBuilder`, щоб його доповнювали правила доступу й пагінація.

## 6. Контролер і модуль

```ts
@ApiTags('Departments')
@Controller('api/departments')        // префікс api/ — вручну
export class DepartmentsController {
  @Get(':departmentId')
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard, PermissionsGuard)
  @Permissions(Permission.READ_DEPARTMENTS, Permission.MANAGE_DEPARTMENTS)
  async getDepartment(@Param('departmentId') departmentId: string): Promise<IDepartmentItemModel> {
    return await this.departmentsService.getById(departmentId);
  }
}
```

- Контролер тонкий: параметри → сервіс. Жодних репозиторіїв і умов доступу в контролері.
- Відповідь не загортати вручну — це робить `ResponseInterceptor`.
- Поточний користувач — `@CurrentUser() { sub, }: IAccessTokenPayload` (`sub` = `users.id`); `@Req()` у новому коді не вживати.
- Повернення: `POST` → створений item; `DELETE` → видалений item; `PUT` — як у сусідніх ендпоінтах модуля (історично `boolean` або item, без потреби не уніфікувати).
- Модуль: `forFeature` усіх entity сервісів, `providers` (сервіси + mapper), `exports` — лише те, що реально потрібне іншим модулям.

## 7. Довідник

Сервіс має `get<Entity>Dictionary(): Promise<I<Entity>DictionaryItem[]>` (`select: ['id', 'name']`, сортування за назвою); ендпоінт — у `DictionariesModule` (`/api/dictionaries/<x>`), не в модулі сутності.

## 8. Чекліст

- [ ] Розкладка й імена файлів за розділом 1.
- [ ] Для кожного DTO є інтерфейс у `models/`; сервіс працює з інтерфейсами.
- [ ] Mapper перелічує поля явно, nullable → `null`.
- [ ] Існування — `findOneOrFail` / власний `NotFoundException`; перевірки до запису; транзакція для групи записів.
- [ ] Список: сортування, пошук `ILIKE` через параметр, `{ items, meta }`.
- [ ] Контролер тонкий, `api/` у шляху, без ручної обгортки.
- [ ] `docs/domain.md` (карта ендпоінтів) оновлено; контракт для фронту — `api-contract-change`.
- [ ] `npx tsc --noEmit` чистий.
