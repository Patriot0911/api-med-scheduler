---
paths:
  - "src/modules/**"
---

# Module anatomy

Every domain module has the same layout — follow it for new modules:

```
modules/<name>/
  <name>.module.ts
  controllers/<name>.controller.ts
  dto/<action>-<entity>-request.dto.ts     # classes with class-validator decorators + @ApiProperty
  models/<entity>-<kind>.model.ts          # I...Model interfaces, enums (*.enum.ts)
  entities/<entity>.entity.ts              # *Entity
  mappers/<name>.mapper.ts                 # @Injectable, entity → response model
  services/<name>.service.ts
```

Interfaces in `models/` ↔ DTO classes that `implements` them; services work with interfaces; mapper `entityToItem / ListItem / DictionaryItem`; a controller never returns an entity; dictionaries live in `DictionariesModule`. Full details — skill `nest-module-anatomy`.
