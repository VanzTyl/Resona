# Code Standards

Version: 1.0

---

# Philosophy

This project follows engineering principles inspired by safety-critical software
(NASA, CERT, MISRA, Google Engineering Practices) adapted for modern web
development.

Code must prioritize:

- Correctness
- Readability
- Maintainability
- Predictability
- Simplicity
- Security

Every line of code should be understandable by another developer without needing
additional explanation.

---

# Rule 1 — Readability Over Cleverness

Never write code that is difficult to understand just because it is shorter.

Bad

```js
const x=a?b:c?d:e;
```

Good

```js
if (userExists) {
    return existingUser;
}

return createUser();
```

Readable code is preferred over compact code.

---

# Rule 2 — One Responsibility

A function should perform one job only.

Bad

```php
loginUser();
sendEmail();
createSession();
writeLogs();
```

Good

```php
authenticateUser();

createSession();

logLogin();

sendLoginNotification();
```

---

# Rule 3 — Maximum Function Length

Maximum:

50 lines

If longer, split it.

---

# Rule 4 — Maximum File Length

Target:

300 lines

Hard Limit:

500 lines

If exceeded:

Refactor immediately.

---

# Rule 5 — Maximum Nesting

Maximum nesting depth:

3

Bad

if (...)
{
    if (...)
    {
        if (...)
        {
            if (...)
            {

            }
        }
    }
}

Good

Return early.

---

# Rule 6 — Return Early

Avoid giant if statements.

Bad

if (authenticated)
{
    ...
}

Good

if (!authenticated)
{
    return;
}

...

---

# Rule 7 — No Magic Numbers

Never write

```js
if(score > 73)
```

Instead

```js
const PASSING_SCORE = 73;
```

Every unexplained number becomes a named constant.

---

# Rule 8 — No Magic Strings

Never write

```php
if($role == "admin")
```

Instead

```php
const ROLE_ADMIN = "admin";
```

---

# Rule 9 — No Duplicate Code

If code appears twice:

Refactor.

Three copies means a design problem.

---

# Rule 10 — Naming Rules

Variables

camelCase

Functions

camelCase

Classes

PascalCase

Constants

UPPER_SNAKE_CASE

Folders

lowercase

Files

kebab-case

Example

```
user-profile.php

shopping-cart.js

login-page.css
```

---

# Rule 11 — Boolean Naming

Always use names that answer a question.

Good

isLoggedIn

hasPermission

canDelete

shouldRetry

Bad

logged

flag

status

---

# Rule 12 — Comments

Only explain

WHY

Never explain

WHAT

Bad

```js
// increment i
i++;
```

Good

```js
// Required because API starts indexing at 1
i++;
```

---

# Rule 13 — Every Function Needs Documentation

Example

```php
/**
 * Creates a new customer.
 *
 * @param array $data
 * @return int
 */
```

---

# Rule 14 — Input Validation

Every external input must be validated.

Sources

- Forms
- URL parameters
- Cookies
- Headers
- Database
- API
- Environment Variables

Never trust user input.

---

# Rule 15 — SQL

Always use prepared statements.

Never

```php
SELECT * FROM users WHERE id=$id
```

Always

Prepared Statements

---

# Rule 16 — HTML

Use semantic HTML.

Prefer

```
header

main

section

article

aside

footer

nav
```

Avoid unnecessary div nesting.

---

# Rule 17 — CSS

Avoid IDs.

Prefer classes.

Maximum selector depth:

3

Bad

```css
div div div div ul li a
```

---

# Rule 18 — JavaScript

Never use global variables.

Everything belongs inside modules or namespaces.

---

# Rule 19 — Error Handling

Never ignore errors.

Bad

```php
mysqli_query(...)
```

Good

```php
$result = mysqli_query(...);

if (!$result)
{
    throw new Exception(...);
}
```

---

# Rule 20 — Logging

Never log

- Passwords
- Tokens
- API Keys
- Database credentials
- Personal information

---

# Rule 21 — Versioning

Every structural change must update

version.md

Every architecture change must update

schema.md

---

# Rule 22 — Project Structure

Follow

project/

frontend/

backend/

database/

Never place backend code inside frontend.

Never place frontend assets inside backend.

Shared frontend assets belong inside

globals/

Page-specific resources belong inside

pages/{page}/

---

# Rule 23 — Database

Never modify production tables manually.

All changes must go through

migrations/

Every migration must have

up_x.sql

down_x.sql

---

# Rule 24 — Keep Controllers Thin

Controllers

Receive request

↓

Validate

↓

Call business logic

↓

Return response

Business logic should never live inside routers.

---

# Rule 25 — No Hardcoded Secrets

Never commit

Passwords

API Keys

Tokens

Secrets

Use environment variables.

---

# Rule 26 — Deterministic Code

Functions should produce the same output for the same input.

Avoid hidden side effects.

---

# Rule 27 — Explicitness

Prefer

```php
$userCount
```

instead of

```php
$c
```

Never abbreviate unless universally known.

---

# Rule 28 — Defensive Programming

Assume everything can fail.

Database

Network

Filesystem

API

Validate every dependency.

---

# Rule 29 — Consistent Formatting

Indentation

4 spaces

No tabs

Opening braces

Same line

Example

```php
if ($ready) {
    ...
}
```

---

# Rule 30 — Code Review Checklist

Before committing ask:

✓ Is it readable?

✓ Is it tested?

✓ Is there duplicate code?

✓ Is every input validated?

✓ Are secrets excluded?

✓ Are SQL queries parameterized?

✓ Does it follow project structure?

✓ Did I update schema.md if architecture changed?

✓ Did I update version.md if functionality changed?

✓ Would another developer understand this in six months?

If any answer is "No",

Do not commit.

---

# Golden Rule

Write code as if the person maintaining it five years from now
is a senior engineer who knows where you live.

Write software that is boring, predictable, and easy to reason about.

Simple code survives.
Complex code fails.