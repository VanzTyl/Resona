# Project Tracker

## Project Name
Resona — Phase 04: Performance & Architecture

## Current Build
v2 (post-Phase-04)

## Last Updated
2026-07-17

## What Was Requested
Execute Phase 04 (Performance & Architecture) across 5 steps:
1. Fix Feed N+1 Query Problem — Batch-Eager-Load
2. Remove Redundant requireAuth() from getReactionSummary()
3. Split Oversized Backend Files
4. Standardize API Naming Convention to camelCase
5. Remove Dead Code and Merge Duplicates

## Changes Made

### Backend — Controllers
| File | Changes |
|------|---------|
| `backend/src/controllers/feed-controller.php` | Rewritten: batch-eager-loaded user artists, weekly tops, friend artists, reaction summaries before loop. Inline array lookups replace `computeFeedCardData()` and `getReactionSummary()` per-card calls. `getReactionSummary()` now takes `$currentUserId` param (no internal `requireAuth()`). |
| `backend/src/controllers/sync-controller.php` | `getDecryptedTokens()`, `decryptTokenValue()`, `refreshSpotifyToken()` extracted to `token-helper.php`. Added `require_once __DIR__ . '/token-helper.php'`. File reduced from 660 → 408 lines. |
| `backend/src/controllers/token-helper.php` | **Created.** Contains extracted `getDecryptedTokens()`, `decryptTokenValue()`, `refreshSpotifyToken()` functions. |
| `backend/src/controllers/user-controller.php` | Extracted 8 validation helpers (`validateDisplayName`, `validateAvatarUrl`, `validateUsername`, `validatePrivacyLevel`, `validateBio`, `validateInterests`, `validateFavoriteGenres`, `validateAboutMe`). `handleUpdateProfile` now uses field-definition loop. SQL `AS` aliases for camelCase response fields. Added `USERNAME_REGEX` check in `validateUsername` and `handleCheckUsername`. |
| `backend/src/controllers/friend-controller.php` | SQL `AS` aliases: `display_name AS displayName`, `avatar_url AS avatarUrl`, `track_name AS currentlyPlayingTrack`, `artist_names AS currentlyPlayingArtist`, `album_art_url AS albumArtUrl`, `is_playing AS isPlaying`, `unread_count AS unreadCount`. |
| `backend/src/controllers/reaction-controller.php` | SQL `AS` aliases: `user_id AS userId`, `created_at AS createdAt`. |
| `backend/src/controllers/onboarding-controller.php` | Removed dead code lines 97-98 (unused `$bodyField` computations). Added `USERNAME_REGEX` validation in username section. |
| `backend/src/controllers/stats-controller.php` | **Deleted.** Route now delegates to `handleGetPersonalStats` in dashboard-controller. |
| `backend/src/router.php` | Removed `require_once` for stats-controller. Changed `/api/user/stats` route to `handleGetPersonalStats`. |

### Frontend — All Pages
| File | Changes |
|------|---------|
| `frontend/src/pages/friends/friends.js` | `avatar_url`→`avatarUrl`, `display_name`→`displayName`, `currently_playing_track`→`currentlyPlayingTrack`. |
| `frontend/src/pages/messages/messages.js` | `avatar_url`→`avatarUrl`, `display_name`→`displayName`, `currently_playing_track`→`currentlyPlayingTrack`, `unread_count`→`unreadCount`. |
| `frontend/src/pages/feed/feed.js` | `is_playing`→`isPlaying`, `album_art_url`→`albumArtUrl`, `display_name`→`displayName`, `currently_playing_track`→`currentlyPlayingTrack`. |
| `frontend/src/pages/profile/profile.js` | `avatar_url`→`avatarUrl`, `display_name`→`displayName`, `favorite_genres`→`favoriteGenres`, `privacy_level`→`privacyLevel`, `spotify_connected`→`spotifyConnected`, `about_me`→`aboutMe`. |
| `frontend/src/pages/onboarding/onboarding.js` | `display_name`→`displayName`, `favorite_genres`→`favoriteGenres`, `avatar_url`→`avatarUrl`, `privacy_level`→`privacyLevel`, `onboarding_step`→`onboardingStep`. |
| `frontend/src/sidebar.js` | `display_name`→`displayName`, `avatar_url`→`avatarUrl`. |

### No Changes Needed
- `backend/src/constants.php` — `USERNAME_REGEX` already defined at line 84.
- `backend/src/controllers/dashboard-controller.php` — Already returns camelCase.
- `backend/src/controllers/discover-controller.php` — Already returns camelCase.

## Success Criteria Met
- [x] Batch-eager-load reduces per-request queries from ~40 to ~5-6
- [x] `getReactionSummary()` takes `$userId` parameter, no internal `requireAuth()`
- [x] No backend PHP file exceeds 500 lines
- [x] Validation helpers keep functions clean and under 50 lines
- [x] All API endpoints return camelCase field names
- [x] Frontend reads all API fields using camelCase names
- [x] Dead code removed from onboarding-controller (lines 97-98)
- [x] stats-controller.php removed, route delegates to dashboard controller
- [x] `USERNAME_REGEX` enforced in `handleUpdateProfile`, `handleOnboardingStep`, `handleCheckUsername`
