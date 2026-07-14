# <span style="color:#2563eb;">Git Workflow</span>

This document defines the branching strategy, commit conventions, and collaboration workflow for the project to ensure a clean and maintainable Git history.

---

## <span style="color:#16a34a;">Branch Strategy</span>

### Main Branches

```text
main
staging
production
```

| Branch | Purpose |
|---------|---------|
| `main` | Primary development branch containing the latest stable code. |
| `staging` | Pre-release branch used for testing and validation. |
| `production` | Live production-ready code. |

### Feature Branches

Create feature branches from the latest `main` branch.

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

## <span style="color:#f59e0b;">Branch Rules</span>

- Never commit directly to `main`.
- Always create a dedicated branch for every task.
- Keep feature branches focused on a single objective.
- Delete feature branches after they have been successfully merged.
- Keep your local repository synchronized with the latest changes before starting new work.

### Before Creating a Branch

Always update your local `main` branch before creating a new branch.

```bash
git checkout main
git pull origin main
git checkout -b feature/your-feature
```

This minimizes merge conflicts and ensures your work starts from the latest codebase.

### Workflow

```text
Update main
      ↓
Create Feature Branch
      ↓
Develop Changes
      ↓
Commit Changes
      ↓
Push Branch
      ↓
Open Pull Request
      ↓
Code Review
      ↓
Merge into main
```

---

## <span style="color:#8b5cf6;">Commit Standards</span>

The project follows the **Conventional Commits** specification.

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
|------|---------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation |
| `style` | Formatting changes only |
| `refactor` | Code improvements without changing behavior |
| `perf` | Performance improvements |
| `test` | Add or update tests |
| `chore` | Maintenance tasks |
| `build` | Build system changes |
| `ci` | Continuous Integration updates |
| `revert` | Revert a previous commit |

---

## <span style="color:#dc2626;">Commit Rules</span>

Each commit should represent **one logical change**.

Avoid combining unrelated changes into a single commit.

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

## <span style="color:#0f766e;">Pull Request Rules</span>

Every Pull Request should:

- Clearly describe what changed.
- Explain why the changes are necessary.
- Reference related issues or tasks when applicable.
- Include screenshots for UI changes.
- Pass all automated tests.
- Resolve merge conflicts before requesting review.
- Be reviewed and approved before merging.
- Focus on one feature or fix whenever possible.

### Merge Policy

- Always pull the latest changes from `main` before starting new work or before resolving merge conflicts.
- Always request a merge through a **Pull Request**.
- **Never perform or confirm a merge unless you have the required repository permissions or have been explicitly authorized to do so.**
- If additional changes are requested during review, update the existing Pull Request instead of creating a new one.
- Ensure the Pull Request is approved and all required checks have passed before merging.

---

## <span style="color:#2563eb;">Best Practices</span>

- Pull from `main` frequently to stay up to date.
- Keep branches short-lived.
- Write meaningful commit messages.
- Review your changes before committing.
- Resolve merge conflicts locally whenever possible.
- Remove merged branches to keep the repository clean.
- Avoid force-pushing shared branches unless the team has explicitly agreed to it.