---
paths:
  - "src/modules/**/dto/**"
  - "src/modules/**/models/**"
---

# DTO і моделі

- Кожне поле DTO має хоча б один декоратор class-validator (`@IsOptional()` рахується): `whitelist: true` мовчки викидає поля без них.
- DTO `implements` інтерфейс з `models/`; create = edit → `extends`; похідні — `OmitType` / `PickType` / `PartialType` з `@nestjs/swagger`.
- Query: числа `@Type(() => Number)`, булеві `@Transform(toBoolean)`, масиви `@Transform(toArray)`; дати `@Type(() => Date) @IsDate()`; вкладені `@ValidateNested() @Type(() => Dto)`.
- Масиви id — `@IsUUID('all', { each: true, })`, з `ArrayUnique` / межами, де доречно.
- Ліміти, що захищають сервер, — декораторами в DTO; їх зміна — зміна контракту (фронт віддзеркалює їх у zod).
- Моделі відповідей: `I<Entity>ItemModel`, `I<Entity>ListItemModel`, `I<Entity>DictionaryItem`; nullable — `| null`; прапорці рішень (`canEdit`, `canManage`) — у моделі.
- `description` у `@ApiProperty` — лише для неочевидної семантики.
