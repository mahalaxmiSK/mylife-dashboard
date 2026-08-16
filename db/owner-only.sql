-- REQ-SYNC-04: account creation is closed to everyone but the owner.
--
-- A "disable signups" setting is a boolean in a dashboard that anyone with the
-- management token can flip, and it has to be flipped *after* the owner exists,
-- which leaves a window. This does it in the database instead: the only email
-- that can ever be inserted into auth.users is the owner's, so the window does
-- not exist and the rule survives a settings change.
--
-- Same reasoning as REQ-SYNC-05 for row access — the guarantee belongs where it
-- cannot be bypassed, not in a setting or in application code.

create or replace function public.only_owner_may_register()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if lower(new.email) is distinct from 'mahalaxmi.kumbari@gmail.com' then
    raise exception 'registration is closed';
  end if;
  return new;
end;
$$;

drop trigger if exists only_owner_may_register on auth.users;

create trigger only_owner_may_register
  before insert on auth.users
  for each row
  execute function public.only_owner_may_register();
