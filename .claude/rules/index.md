# Rules — entry point

This file is only a map. The rules live in the files below; each file covers one topic, every rule is written in exactly one place, and CLAUDE.md, skills and agents link to it instead of repeating it.

Claude Code always loads files without `paths`; files with `paths` load when a task touches matching files. If a task concerns a topic but no matching file has been opened yet (a question, a plan), read the relevant rule file yourself. Subagents read the files they need explicitly, using this map.

| Context | File |
|---|---|
| Always: git — commits, push, staging, working tree | [git.md](git.md) |
| Always: which local commands to run and when (build, tsc, lint, migrations, seed) | [commands.md](commands.md) |
| Always: actions outside the working tree (server, image registry, GitHub), destroying data, secrets | [operations.md](operations.md) |
| Any code change in `src/`, `test/`: style and formatting | [code-style.md](code-style.md) |
| New module or file in a module: folder layout | [module-anatomy.md](module-anatomy.md) |
| Endpoints: prefix, response wrapper, lists, CRUD return values, current user | [api-conventions.md](api-conventions.md) |
| Controllers and modules | [controllers.md](controllers.md) |
| Guards, permissions, role hierarchy, new `Permission` | [authorization.md](authorization.md) |
| DTOs and response models | [dto.md](dto.md) |
| Entities, migrations, seeds, schema quirks | [persistence.md](persistence.md) |
| Domain modules (lessons, accounts, roles, departments), `docs/domain.md` | [domain.md](domain.md) |
| Environment variables (`.env`, `src/config`) | [config.md](config.md) |
| Docker image, entrypoint, compose, `deploy/` | [docker.md](docker.md) |
| Branches, CI, Dependabot | [ci.md](ci.md) |

New rule file → add a row to this table. Project docs (CLAUDE.md, `docs/`, READMEs) stay in Ukrainian.
