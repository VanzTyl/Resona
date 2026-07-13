# Git Workflow

## Branch Strategy

### Main Branches

```text
main
staging
production
```

### Feature Branches

```text
feature/login-page
feature/user-profile
feature/api-integration
```

### Bug Fixes

```text
fix/navbar-overlap
```

### Documentation

```text
docs/setup-guide
```

### Refactoring

```text
refactor/auth-service
```

---

## Branch Rules

- Never commit directly to `main`.
- All work should be developed in feature branches.

### Workflow

```text
develop
    ↓
feature branch
    ↓
Pull Request
    ↓
Code Review
    ↓
Merge into develop
    ↓
Release to main
```

---

## Commit Standards

We use **Conventional Commits**.

### Format

```text
type(scope): description
```

### Examples

```text
feat(auth): add login page

fix(api): handle timeout errors

docs(readme): update installation guide

style(ui): improve button spacing

refactor(user): simplify validation

test(auth): add login unit tests

chore(deps): update packages
```

### Commit Types

| Type | Purpose |
| --- | --- |
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation |
| `style` | Formatting only |
| `refactor` | Code improvement without behavior changes |
| `perf` | Performance improvements |
| `test` | Tests |
| `chore` | Maintenance |
| `build` | Build system |
| `ci` | Continuous Integration |
| `revert` | Revert previous commit |

---

## Commit Rules

One commit should represent one logical change.

### Bad

```text
feat: login page

+ updated navbar

+ fixed footer

+ changed README

+ updated API

+ removed tests
```

### Good

```text
feat(auth): add login page

fix(navbar): fix mobile alignment

docs(readme): update installation

test(auth): add login tests
```

---

## Pull Request Rules

Every Pull Request should:

- Explain what changed.
- Explain why.
- Include screenshots (if UI changes).
- Pass all tests.
- Be reviewed before merging.