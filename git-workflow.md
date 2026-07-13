# CODEBASE_STANDARDS.md

Version: 1.0

---

# Codebase Standards

This document defines the development standards, architecture, Git workflow, coding conventions, and collaboration protocols for this project.

These standards exist to ensure:

- Consistent code quality
- Maintainable architecture
- Easy onboarding
- Predictable Git history
- Easier debugging
- Cleaner pull requests

---

# 1. Project Architecture

## Architecture Style

This application follows a **Monolithic MVC (Model-View-Controller)** architecture.

Although the application communicates with external APIs, the application itself is considered **one service**.

```
Browser
    │
    ▼
Routes
    │
    ▼
Controllers
    │
    ▼
Services
    │
    ▼
External APIs / Database
    ▲
    │
Models
    │
    ▼
Views
```

---

## MVC Responsibilities

### Model

Responsible for:

- Data structures
- Database interactions
- Validation
- Business entities

Models MUST NOT:

- Render HTML
- Handle HTTP requests
- Perform UI logic

---

### View

Responsible for:

- User Interface
- Displaying data
- Forms
- User interactions

Views MUST NOT:

- Contain business logic
- Call APIs directly
- Access the database

Views should only receive processed data from controllers.

---

### Controller

Responsible for:

- Receiving requests
- Validating input
- Calling services
- Returning responses
- Selecting views

Controllers should remain thin.

Controllers MUST NOT contain large business logic.

---

### Service Layer

Business logic belongs here.

Services are responsible for:

- Calling external APIs
- Processing data
- Authentication
- Complex calculations
- Reusable business rules

Example:

Controller

↓

UserService

↓

External API

---

## Dependency Rule

The dependency direction must always be:

```
View
 ↓

Controller
 ↓

Service
 ↓

Model
```

Never the reverse.

Models should never know about Views.

Views should never know about Services.

---

# 2. Folder Structure

Example:

```
src/

controllers/
models/
services/
views/
routes/
middleware/
utils/
config/
public/
assets/
tests/
```

Each folder has a single responsibility.

---

# 3. General Coding Standards

## Naming

Variables

```
userEmail
apiResponse
productList
```

Functions

```
getUser()
createInvoice()
fetchProducts()
```

Classes

```
UserController
AuthService
InvoiceModel
```

Constants

```
MAX_RETRIES
API_TIMEOUT
DEFAULT_PAGE_SIZE
```

Avoid abbreviations unless universally understood.

Bad

```
usr
tmp
x
data1
```

Good

```
user
temporaryUser
cartItems
invoiceTotal
```

---

## Function Rules

Functions should:

- Have one responsibility
- Be easy to read
- Be reusable

Recommended:

- 10–30 lines

Avoid:

- Giant functions
- Deep nesting

Use early returns.

Instead of

```
if (...) {
    if (...) {
        if (...) {
```

Prefer

```
if (!user) return;
```

---

## Comments

Write code that explains itself.

Use comments only when explaining:

- Why something exists
- Complex business rules
- Workarounds

Do not comment obvious code.

Bad

```
// increment i

i++;
```

---

# 4. API Standards

All API communication belongs inside the Service layer.

Never call APIs directly inside Views.

Example

```
Controller

↓

UserService

↓

API
```

Every API request must include:

- Error handling
- Timeout handling
- Loading state
- Response validation

---

# 5. Error Handling

Never silently ignore errors.

Bad

```
catch (e) {}
```

Good

```
catch (error) {
    logger.error(error);

    return {
        success: false,
        message: "Unable to load data."
    };
}
```

---

# 6. Git Workflow

Main branches

```
main
develop
```

Feature branches

```
feature/login-page

feature/user-profile

feature/api-integration
```

Bug fixes

```
fix/navbar-overlap
```

Documentation

```
docs/setup-guide
```

Refactoring

```
refactor/auth-service
```

---

# 7. Branch Rules

Never commit directly to:

- main

All work should be developed in feature branches.

Workflow

```
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

# 8. Commit Standards

We use **Conventional Commits**.

Format

```
type(scope): description
```

Examples

```
feat(auth): add login page

fix(api): handle timeout errors

docs(readme): update installation guide

style(ui): improve button spacing

refactor(user): simplify validation

test(auth): add login unit tests

chore(deps): update packages
```

Commit Types

| Type | Purpose |
| --- | --- |
| feat | New feature |
| fix | Bug fix |
| docs | Documentation |
| style | Formatting only |
| refactor | Code improvement without behavior changes |
| perf | Performance improvements |
| test | Tests |
| chore | Maintenance |
| build | Build system |
| ci | Continuous Integration |
| revert | Revert previous commit |

---

## Commit Rules

One commit should represent one logical change.

Bad

```
feat: login page

+ updated navbar

+ fixed footer

+ changed README

+ updated API

+ removed tests
```

Good

```
feat(auth): add login page

fix(navbar): fix mobile alignment

docs(readme): update installation

test(auth): add login tests
```

---

# 9. Pull Request Rules

Every Pull Request should:

- Explain what changed
- Explain why
- Include screenshots (if UI changes)
- Pass all tests
- Be reviewed before merging

---

# 10. Code Review Checklist

Before approving:

- Naming is clear
- No duplicated logic
- MVC respected
- No unnecessary comments
- No console debugging
- Error handling exists
- API calls belong in Services
- Functions are small
- No dead code

---

# 11. Testing

Every completed feature should be tested.

Minimum:

- Happy path
- Invalid input
- API failure
- Empty responses

---

# 12. Logging

Remove before merging:

```
console.log()

print()

dump()

dd()
```

Use the project's logger when debugging production code.

---

# 13. Security

Never commit:

- API keys
- Secrets
- Passwords
- Environment files

Use:

```
.env
```

Commit only:

```
.env.example
```

---

# 14. Code Style

Indentation

- 4 spaces (backend languages)
- 2 spaces (HTML/CSS/JavaScript) if using Prettier

Maximum line length

- 100–120 characters

Always:

- Use meaningful names
- Remove unused imports
- Remove unused variables
- Keep files focused

---

# 15. Definition of Done

A task is considered complete only when:

- Code follows MVC
- Feature works
- No lint errors
- No console logs
- Commit follows Conventional Commits
- Branch is up to date
- Pull Request is approved
- Tests pass
- Documentation is updated if needed

---

# 16. Team Principles

 1. Readability over cleverness.
 2. Simplicity over premature optimization.
 3. Consistency over personal preference.
 4. Small commits over massive commits.
 5. Business logic belongs in Services.
 6. Controllers should stay thin.
 7. Views should only display data.
 8. Models represent the application's data.
 9. Every feature should be maintainable by another developer.
10. Leave the codebase cleaner than you found it.