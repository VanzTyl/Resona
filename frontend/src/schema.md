# Resona Frontend Architecture

Version: 1.0.0

## Overview

Resona's frontend is a single-page application built with vanilla HTML, CSS,
and JavaScript (no frameworks). It uses hash-based routing for navigation and
renders all content dynamically via DOM manipulation.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   index.html                         │
│  ┌───────────────────────────────────────────────┐  │
│  │                  script.js                     │  │
│  │  ┌────────────┐  ┌──────────────────────────┐ │  │
│  │  │   Router   │  │  Page Controllers         │ │  │
│  │  │  (hash)    │──│  - login.js               │ │  │
│  │  └────────────┘  │  - callback.js            │ │  │
│  │                   │  - feed.js                │ │  │
│  │  ┌────────────┐  │  - friends.js             │ │  │
│  │  │ API Client │  │  - messages.js            │ │  │
│  │  │ (auth)     │  │  - dashboard.js           │ │  │
│  │  └────────────┘  │  - profile.js             │ │  │
│  │                   └──────────────────────────┘ │  │
│  │  ┌──────────────────────────────────────────┐  │  │
│  │  │  Component Library (globals/components/) │  │  │
│  │  │  - button.js  - feed-card.js  - modal.js │  │  │
│  │  │  - toast.js   - skeleton-loader.js       │  │  │
│  │  │  - api-client.js                         │  │  │
│  │  └──────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────┐  │
│  │  style.css (Design System + Component Styles) │  │
│  └───────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────┐  │
│  │  Bottom Navigation Bar (rendered by router)   │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

## Directory Structure

```
frontend/
├── .env.example          ← Frontend environment variables
└── src/
    ├── index.html        ← Single entry point
    ├── style.css         ← Design system + all component styles
    ├── script.js         ← Router, navigation, app bootstrap
    ├── _redirects        ← Netlify SPA routing config
    ├── globals/
    │   └── components/   ← Reusable UI components
    │       ├── api-client.js
    │       ├── button.js
    │       ├── feed-card.js
    │       ├── modal.js
    │       ├── skeleton-loader.js
    │       └── toast.js
    ├── pages/            ← Page controllers (loaded dynamically)
    │   ├── login/login.js
    │   ├── callback/callback.js
    │   ├── feed/feed.js
    │   ├── friends/friends.js
    │   ├── messages/messages.js
    │   ├── dashboard/dashboard.js
    │   └── profile/profile.js
    ├── schema.md         ← This file
    └── version.md        ← Version history
```

## Pages & Routes

| Route | Page | Purpose |
|-------|------|---------|
| #/login | LoginPage | Spotify OAuth initiation |
| #/callback | AuthCallbackPage | OAuth callback handler |
| #/feed | FeedPage | Friend activity feed (infinite scroll) |
| #/friends | FriendDiscoveryPage | User search + friend requests |
| #/messages | MessagesPage | Chat thread list |
| #/dashboard | DashboardPage | Personal stats + top artists |
| #/profile | ProfilePage | Edit display name, avatar, settings |

## Component Library

| Component | Type | Purpose |
|-----------|------|---------|
| Button | UI | Reusable button with variants |
| FeedCard | Composite | Friend music activity display |
| Modal | UI | Accessible dialog overlay |
| Toast | UI | Non-intrusive notifications |
| SkeletonLoader | UI | Loading placeholders |
| ApiClient | Utility | HTTP client with JWT refresh |

## Design System

- **CSS Custom Properties**: All tokens via `--rs-*` variables
- **BEM Methodology**: `block__element--modifier` naming
- **Dark Theme**: Deep midnight background with vibrant accents
- **Mobile-First**: Responsive with 480px max-width
- **Accessibility**: WCAG AA compliant, reduced motion support
