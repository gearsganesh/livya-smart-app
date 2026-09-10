-- Role-aware RLS. Roles live in staff_users and are checked through a SECURITY DEFINER helper to avoid RLS recursion.
create or replace function public.is_staff(required_role text default null)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.staff_users s where s.user_id = auth.uid() and s.active = true and (required_role is null or s.role = required_role or s.role = 'admin')); $$;
revoke all on function public.is_staff(text) from public;
grant execute on function public.is_staff(text) to authenticated;

-- Staff can operate the clinical tables; patients remain restricted to their own patient row.
drop policy if exists "patient self read" on public.patients;
drop policy if exists "patient self update" on public.patients;
create policy "patient owner read" on public.patients for select to authenticated using (user_id = auth.uid());
create policy "patient staff read" on public.patients for select to authenticated using (public.is_staff());
create policy "patient owner update" on public.patients for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "patient staff update" on public.patients for update to authenticated using (public.is_staff()) with check (public.is_staff());

-- Audit log is append-only for authenticated actors and readable by active staff.
create policy "audit actor insert" on public.audit_log for insert to authenticated with check (actor_user_id = auth.uid());

-- Keep role records self-readable; admin/staff management must be done server-side.
drop policy if exists "staff own row" on public.staff_users;
create policy "staff own row" on public.staff_users for select to authenticated using (user_id = auth.uid());

comment on function public.is_staff(text) is 'Returns whether the authenticated user is active staff. Admin satisfies every role check.';
