create or replace function public.handle_new_user() returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  profile_name text;
  patient_id uuid;
begin
  profile_name := coalesce(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name');

  insert into public.profiles (id, email, phone, name, full_name)
  values (new.id, new.email, new.phone, profile_name, profile_name)
  on conflict (id) do update set
    email = coalesce(excluded.email, public.profiles.email),
    phone = coalesce(excluded.phone, public.profiles.phone),
    name = coalesce(excluded.name, public.profiles.name),
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    updated_at = now();

  select id into patient_id from public.patients where user_id = new.id limit 1;

  if patient_id is null then
    insert into public.patients (user_id, profile_id, patient_code, status)
    values (
      new.id,
      new.id,
      'LIVYA-' || upper(substr(replace(new.id::text, '-', ''), 1, 8)),
      'active'
    );
  else
    update public.patients
    set profile_id = new.id,
        status = coalesce(status, 'active'),
        updated_at = now()
    where id = patient_id;
  end if;

  return new;
end;
$$;

comment on function public.handle_new_user() is 'Creates or synchronizes the patient profile shell when a Supabase Auth user is created. Never stores credentials or OTP values.';
