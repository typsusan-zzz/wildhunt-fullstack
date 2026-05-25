# WildHunt Schema Notes

- Every persistent table includes `id`, `created_at`, `updated_at`, and `deleted`.
- Enum fields are stored as `VARCHAR` for readable local debugging.
- Realtime positions are not written every frame; only match events, snapshots, and settlement results should be persisted.
- The default leaderboard season starts as `S0_PRESEASON`; V3 seeds `season.pass.*` runtime config and V4 persists season pass progress/claims.
- Activities are configurable records in `wh_activity`; user claims are persisted in `wh_activity_claim` and are unique per activity/user.
- Runtime game values such as duration, arena radius, movement speeds, skill cooldowns, food count, and nature density are read from `wh_system_config` when present, with service defaults as local fallback.
