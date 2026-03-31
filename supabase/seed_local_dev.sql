-- Local development / CI seed data.
--
-- The pepper value is hardcoded here because this file is exclusively for
-- local development. It must match PIN_PEPPER in local.env.

insert into app_user (full_name, email, role, active)
values
  ('Local Dev Booker', 'dev-booker@example.test', 'member', true),
  ('Local Dev Admin', 'dev-admin@example.test', 'admin', true),
  ('Locked Test User', 'dev-locked@example.test', 'member', true)
on conflict (email) do update
set
  full_name = excluded.full_name,
  role = excluded.role,
  active = excluded.active;

select set_app_user_pin(id, '1234', 'local-dev-pepper')
from app_user
where email = 'dev-booker@example.test';

select set_app_user_pin(id, '4321', 'local-dev-pepper')
from app_user
where email = 'dev-admin@example.test';

select set_app_user_pin(id, '9999', 'local-dev-pepper')
from app_user
where email = 'dev-locked@example.test';

update app_user
set pin_attempts = 5,
    locked_until = now() + interval '15 minutes'
where email = 'dev-locked@example.test';

insert into booking_action_audit (action, room_email, starts_at, ends_at, app_user_id, meta)
select
  'book',
  'avatar@zefyr.se',
  now() - interval '30 minutes',
  now(),
  id,
  jsonb_build_object('source', 'seed_local_dev', 'note', 'example audit row')
from app_user
where email = 'dev-booker@example.test'
on conflict do nothing;
