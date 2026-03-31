# Schema Summary

## Source

This summary is derived from `supabase/rest_openapi.json`, which was fetched from the project's Supabase REST API.

It reflects the API-visible `public` schema and exposed RPC surface.

It is useful for local development planning, test setup, and backend refactoring, but it is **not** a full SQL schema dump.

What it likely does **not** include completely:

- indexes
- foreign keys
- check constraints
- triggers
- function bodies
- non-exposed schemas beyond what the REST API surfaces

## Tables

### `app_user`

Purpose inferred from application code:

- stores application users for PIN-based booking
- stores lockout and PIN verification state

Columns:

| Column | Type | Required | Default | Notes |
| --- | --- | --- | --- | --- |
| `id` | `bigint` | yes |  | primary identifier |
| `full_name` | `text` | no |  | display name used in bookings |
| `email` | `citext` | yes |  | email appears to be unique by app logic |
| `role` | `text` | no | `'member'` | role is currently defaulted in app code |
| `active` | `boolean` | yes | `true` | used to enable/disable account use |
| `pin_hash` | `text` | no |  | hashed PIN storage |
| `pin_fingerprint` | `text` | no |  | likely uniqueness / lookup support |
| `pin_attempts` | `integer` | yes | `0` | failed-attempt tracking |
| `locked_until` | `timestamptz` | no |  | temporary lock state |
| `created_at` | `timestamptz` | yes | `now()` | creation timestamp |
| `updated_at` | `timestamptz` | yes | `now()` | update timestamp |

Notes:

- The presence of `pin_hash`, `pin_fingerprint`, `pin_attempts`, and `locked_until` strongly suggests the PIN logic is no longer entirely hidden in SQL; the table itself carries meaningful security state.
- The app code depends on `full_name`, `email`, `role`, `active`, and successful PIN verification.

### `booking_action_audit`

Purpose inferred from application code:

- records booking actions performed through the kiosk/app API

Columns:

| Column | Type | Required | Default | Notes |
| --- | --- | --- | --- | --- |
| `id` | `bigint` | yes |  | primary identifier |
| `action` | `text` | yes |  | expected values include `book`, `extend`, `cancel` |
| `room_email` | `text` | yes |  | room/calendar identifier |
| `starts_at` | `timestamptz` | no |  | used for booking actions |
| `ends_at` | `timestamptz` | no |  | used for booking actions |
| `app_user_id` | `bigint` | yes |  | references app user logically |
| `meta` | `jsonb` | no |  | extra action payload |
| `created_at` | `timestamptz` | yes | `now()` | audit timestamp |

Notes:

- Application code writes to this table for room booking, extension, and cancellation.
- The OpenAPI schema does not confirm the foreign key, but `app_user_id` is almost certainly intended to refer to `app_user.id`.

## RPCs

The REST-exposed RPC surface includes these functions:

### `verify_app_user_pin`

Parameters:

- `p_app_user_id: integer`
- `p_pin: string`

Observed from OpenAPI:

- exposed as both `GET` and `POST`

Likely purpose:

- verify a PIN for a specific application user

### `login_by_pin`

Parameters:

- `p_pin: string`
- `p_pepper: string`

Observed from OpenAPI:

- exposed as both `GET` and `POST`

Likely purpose:

- validate a PIN and return the matched app user if valid and unlocked

This is the function used directly by the backend.

### `set_app_user_pin`

Parameters:

- `p_app_user_id: integer`
- `p_pin: string`
- `p_pepper: string`

Observed from OpenAPI:

- exposed as both `GET` and `POST`

Likely purpose:

- securely assign or replace an app user's PIN

This is the function used directly by the backend when creating users.

## What the current app relies on

From the source code, the backend currently relies on this schema shape:

- `app_user`
- `booking_action_audit`
- `login_by_pin(...)`
- `set_app_user_pin(...)`

The frontend does not use the database directly.

## Implications for local development and CI

For a useful local database, the minimum needed behavior is:

1. `app_user` table
2. `booking_action_audit` table
3. PIN verification behavior compatible with `login_by_pin`
4. PIN assignment behavior compatible with `set_app_user_pin`

That compatibility can be provided in one of two ways:

- preserve equivalent SQL functions in the local DB
- or move the logic into backend code and reduce SQL-function dependence over time

## Recommended next schema step

The next best improvement is a real SQL schema dump from Postgres itself.

That would confirm:

- indexes
- constraints
- foreign keys
- extensions
- trigger definitions
- actual function bodies

Until that is available, `supabase/rest_openapi.json` is the best current source of truth in-repo.

