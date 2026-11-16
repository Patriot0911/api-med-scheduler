---
name: nest-dto-validation
description: Переносні правила DTO й валідації входу в NestJS (class-validator + class-transformer + Swagger) під глобальний ValidationPipe з whitelist / transform — чому поле без декоратора мовчки зникає, числа й булеві з query, масиви з повторюваних ключів (toArray), дати, вкладені об'єкти, nullable vs optional, ліміти масивів, OmitType / PickType для похідних DTO, @ApiProperty, UUID у шляху. Використовуй, коли створюєш чи змінюєш DTO, query-фільтри, тіло запиту, параметри шляху або дебажиш «поле не доходить до сервісу» чи 400 від валідації.
---

# DTO і валідація

Глобально: `new ValidationPipe({ transform: true, whitelist: true, })` (`main.ts`).

**Головна пастка `whitelist`:** поле без жодного декоратора class-validator **мовчки відкидається** — сервіс отримає `undefined` без помилки. Кожне поле DTO має мати хоча б один декоратор (`@IsOptional()` теж рахується). `@ApiProperty` — не валідатор і поле не рятує.

## 1. Типові поля

| Що | Декоратори |
|---|---|
| рядок обов'язковий | `@IsString() @MinLength(n)` (порожній рядок інакше пройде) |
| рядок опційний | `@IsOptional() @IsString()` |
| nullable id (`null` знімає зв'язок) | `@IsOptional() @IsUUID()` + тип `string \| null` (`IsOptional` пропускає і `undefined`, і `null`) |
| число з тіла | `@IsNumber() @Min(n)` |
| число з query | `@Type(() => Number) @IsNumber() @Min(n)` — query завжди рядок |
| булеве з query | `@Transform(toBoolean) @IsBoolean()` — `true` / `1` = так (`shared/transforms/to-boolean.transform.ts`) |
| enum | `@IsEnum(X)`; масив — `@IsEnum(X, { each: true, })` |
| дата | `@Type(() => Date) @IsDate()`; масив — `@Type(() => Date) @IsDate({ each: true, })` |
| масив id у тілі | `@IsArray() @ArrayUnique() @IsUUID('all', { each: true, })` (+ `@ArrayMinSize` / `@ArrayMaxSize`) |
| масив з query | `@IsOptional() @Transform(toArray) @IsArray() @IsUUID('all', { each: true, })` — одиночне `?ids=a` приходить рядком |
| вкладений об'єкт | `@ValidateNested() @Type(() => NestedDto)` |
| email | `@IsEmail()` |

Масиви id — `@IsUUID(..., { each: true })`, а не `@IsString({ each: true })`: інакше невалідний id дійде до Postgres і дасть 500.

## 2. Пагінація й фільтри

```ts
export class GetDepartmentsRequestDto implements IGetDepartmentsFiltersModel {
  @ApiProperty({ required: false, default: 1 })
  @Type(() => Number) @IsNumber() @Min(1)
  page: number;

  @ApiProperty({ required: false, default: 10 })
  @Type(() => Number) @IsNumber() @Min(0) @Max(100)
  pageSize: number;

  @ApiPropertyOptional({ type: 'string' })
  @IsOptional() @IsString()
  search?: string;
}
```

Імена фільтрів = імена, які бачить клієнт у URL (фронт тримає фільтри в query з тими ж ключами). Спільні фільтри кількох ендпоінтів — один базовий DTO, від якого наслідуються (`lessons-filters-request.dto.ts`).

## 3. Похідні DTO

- create = edit → `class CreateXRequestDto extends EditXRequestDto implements ICreateXModel {}`.
- Частина полів → `OmitType` / `PickType` / `PartialType` з `@nestjs/swagger` (не з `@nestjs/mapped-types`, щоб Swagger бачив поля): `class LessonTemplateRequestDto extends OmitType(CreateLessonRequestDto, ['date', 'lessonGroupId'] as const) {}`.
- PATCH з частковим оновленням → `PartialType(CreateDto)`; сервіс розрізняє `undefined` (не змінювати) і `null` (очистити).

## 4. Ліміти — у DTO

Межі, що захищають сервер (кількість дат серії ≤ 200, `lessonIds` 1–200, `pageSize` ≤ 100, `duration` ≥ 5), — декораторами в DTO, а не перевірками в сервісі. Ті ж межі віддзеркалює zod-схема фронту — при зміні ліміту повідом про це (`api-contract-change`).

## 5. Swagger

- `@ApiProperty` на обов'язковому, `@ApiPropertyOptional` на опційному; `nullable: true` для `| null`; `type: [String]` для масивів; `enum` + `isArray` для масиву enum.
- `description` — лише там, де поле має неочевидну семантику (повна заміна складу, `teacherId` = id профілю, а не user). Очевидні поля без опису.
- Обгортку `{ status, data }` у схемі відповіді дає `@ApiGenericResponses({ 200: Dto })`.

## 6. Параметри шляху

Зараз `@Param('id') id: string` без пайпа: невалідний UUID дає **500** з текстом Postgres. У новому коді — `@Param('lessonId', ParseUUIDPipe) lessonId: string`.

## 7. Чекліст

- [ ] Кожне поле має декоратор class-validator.
- [ ] Query: числа `@Type(() => Number)`, булеві `toBoolean`, масиви `toArray`.
- [ ] Масиви id — `IsUUID` each, з `ArrayUnique` / межами, де доречно.
- [ ] Дати `@Type(() => Date) @IsDate()`, вкладені — `ValidateNested` + `Type`.
- [ ] DTO `implements` інтерфейс з `models/`.
- [ ] Похідні DTO через mapped types з `@nestjs/swagger`.
- [ ] id у шляху — `ParseUUIDPipe`.
