---
paths:
  - "src/modules/**/dto/**"
  - "src/modules/**/models/**"
---

# DTOs and models

- Every DTO field has at least one class-validator decorator (`@IsOptional()` counts): `whitelist: true` silently drops fields without them.
- A DTO `implements` an interface from `models/`; create = edit → `extends`; derived DTOs — `OmitType` / `PickType` / `PartialType` from `@nestjs/swagger`.
- Query: numbers `@Type(() => Number)`, booleans `@Transform(toBoolean)`, arrays `@Transform(toArray)`; dates `@Type(() => Date) @IsDate()`; nested `@ValidateNested() @Type(() => Dto)`.
- Id arrays — `@IsUUID('all', { each: true, })`, with `ArrayUnique` / size bounds where appropriate.
- Limits that protect the server are DTO decorators; changing them is a contract change (the frontend mirrors them in zod).
- Response models: `I<Entity>ItemModel`, `I<Entity>ListItemModel`, `I<Entity>DictionaryItem`; nullable — `| null`; decision flags (`canEdit`, `canManage`) live in the model.
- `description` in `@ApiProperty` — only for non-obvious semantics.
