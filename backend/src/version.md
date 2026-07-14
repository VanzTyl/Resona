# Resona Backend Version History

## 1.0.0 (2026-07-14)
- Initial release
- Spotify OAuth 2.0 authentication flow (login, callback, token refresh)
- User profile management (get, update, search by username)
- Social graph (friend request send/accept/reject/list/remove)
- Playback sync (cron-based Spotify polling, current track retrieval)
- Feed generation (paginated cards, weekly top tracks, artist comparison)
- Emoji reactions (add, remove, list, auto-message trigger)
- Peer-to-peer messaging (threads, messages, unread counts)
- Dashboard stats (personal listening summary, top artists)
- JWT authentication with token refresh
- AES-256-CBC encrypted token storage
- CORS middleware for Netlify frontend
