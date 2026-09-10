create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''), new.phone, new.email)
  on conflict (id) do update set phone = excluded.phone, email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create policy "profile owner insert" on public.profiles
for insert to authenticated with check (id = auth.uid());

create policy "patient self insert" on public.patients
for insert to authenticated with check (user_id = auth.uid());

create policy "family patient insert" on public.family_members
for insert to authenticated
with check (exists (select 1 from public.patients p where p.id = patient_id and p.user_id = auth.uid()));

create policy "appointments patient insert" on public.appointments
for insert to authenticated
with check (exists (select 1 from public.patients p where p.id = patient_id and p.user_id = auth.uid()));
