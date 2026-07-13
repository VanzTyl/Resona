# <span style="color:#2563eb;">Project Structure</span>

A standardized project layout for organizing the frontend, backend, and database components.

---

## <span style="color:#16a34a;">Root Directory</span>

```text
project/
├── frontend/
├── backend/
└── database/
```

---

## <span style="color:#f59e0b;">Frontend Structure</span>

```text
frontend/
└── src/
    ├── pages/
    │   └── {page_name}/
    │       ├── styles/
    │       └── anims/
    │
    ├── globals/
    │   ├── styles/
    │   └── anims/
    │
    ├── index.html
    ├── style.css
    ├── script.js
    ├── schema.md
    └── version.md
```

### Directory Purpose

| Directory/File | Description |
|----------------|-------------|
| `pages/` | Contains all application pages. |
| `pages/{page_name}/styles/` | Page-specific stylesheets. |
| `pages/{page_name}/anims/` | Page-specific animations. |
| `globals/` | Shared resources used across all pages. |
| `globals/styles/` | Global styles and reusable CSS. |
| `globals/anims/` | Shared animations. |
| `index.html` | Application entry page. |
| `style.css` | Global stylesheet. |
| `script.js` | Global JavaScript entry point. |
| `schema.md` | Frontend documentation and architecture notes. |
| `version.md` | Frontend version history. |

---

## <span style="color:#8b5cf6;">Backend Structure</span>

```text
backend/
└── src/
    ├── models/
    ├── routers/
    ├── controllers/
    ├── schema.md
    └── version.md
```

### Directory Purpose

| Directory/File | Description |
|----------------|-------------|
| `models/` | Database models and data access logic. |
| `routers/` | API route definitions. |
| `controllers/` | Request handling and business logic. |
| `schema.md` | Backend architecture documentation. |
| `version.md` | Backend version history. |

---

## <span style="color:#dc2626;">Database Structure</span>

```text
database/
└── src/
    ├── migrations/
    │   ├── up_{version}.sql
    │   └── down_{version}.sql
    │
    ├── init.sql
    ├── schema.md
    └── version.md
```

### Directory Purpose

| Directory/File | Description |
|----------------|-------------|
| `migrations/` | Database migration scripts. |
| `up_{version}.sql` | Applies a database migration. |
| `down_{version}.sql` | Reverts a database migration. |
| `init.sql` | Executes all available `up_*.sql` migrations in order. |
| `schema.md` | Database schema documentation. |
| `version.md` | Database version history. |

---

## <span style="color:#0f766e;">Structure Summary</span>

| Component | Main Directories | Documentation |
|-----------|------------------|---------------|
| Frontend | `pages`, `globals` | `schema.md`, `version.md` |
| Backend | `models`, `routers`, `controllers` | `schema.md`, `version.md` |
| Database | `migrations` | `schema.md`, `version.md` |

---

## <span style="color:#2563eb;">Notes</span>

- Every major component maintains its own `schema.md` for documentation.
- Each component tracks its own release history using `version.md`.
- Database schema changes should always be made through migration files.
- Shared frontend assets belong in `globals`, while page-specific resources belong inside their respective page directories.