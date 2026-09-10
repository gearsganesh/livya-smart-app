-- LIVYA Supabase / Postgres verification suite
-- Run read-only in the Supabase SQL Editor.
-- Expected: every application table has RLS enabled; auth.users FKs are explicit;
-- on_auth_user_created points to public.handle_new_user().

-- 1) RLS status for all application tables in public schema.
select
  n.nspname as schema_name,
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as rls_forced,
  coalesce(p.policy_count, 0) as policy_count
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
left join (
  select schemaname, tablename, count(*)::int as policy_count
  from pg_policies
  group by schemaname, tablename
) p on p.schemaname = n.nspname and p.tablename = c.relname
where n.nspname = 'public'
  and c.relkind = 'r'
  and c.relname not in ('schema_migrations')
order by c.relname;

-- 2) RLS failures only. Empty result is the desired outcome for application tables.
select n.nspname as schema_name, c.relname as table_name
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'r'
  and c.relname not in ('schema_migrations')
  and c.relrowsecurity = false
order by c.relname;

-- 3) All foreign keys in public tables that reference auth.users(id).
select
  con.conname as constraint_name,
  ns.nspname as table_schema,
  cls.relname as table_name,
  att.attname as column_name,
  refns.nspname as referenced_schema,
  refcls.relname as referenced_table,
  refatt.attname as referenced_column,
  pg_get_constraintdef(con.oid) as definition
from pg_constraint con
join pg_class cls on cls.oid = con.conrelid
join pg_namespace ns on ns.oid = cls.relnamespace
join pg_class refcls on refcls.oid = con.confrelid
join pg_namespace refns on refns.oid = refcls.relnamespace
join lateral unnest(con.conkey) with ordinality as cols(attnum, ord) on true
join pg_attribute att on att.attrelid = cls.oid and att.attnum = cols.attnum
join lateral unnest(con.confkey) with ordinality as refcols(attnum, ord) on refcols.ord = cols.ord
join pg_attribute refatt on refatt.attrelid = refcls.oid and refatt.attnum = refcols.attnum
where con.contype = 'f'
  and ns.nspname = 'public'
  and refns.nspname = 'auth'
  and refcls.relname = 'users'
order by cls.relname, att.attname;

-- 4) Find public application columns that look like user IDs but have no FK to auth.users.
-- This is a review aid, not a hard failure, because some patient/actor columns may be intentional.
select table_name, column_name, data_type
from information_schema.columns c
where c.table_schema = 'public'
  and c.column_name in ('user_id', 'owner_id', 'created_by', 'updated_by')
  and not exists (
    select 1
    from pg_constraint fk
    join pg_class child on child.oid = fk.conrelid
    join pg_namespace child_ns on child_ns.oid = child.relnamespace
    join pg_class parent on parent.oid = fk.confrelid
    join pg_namespace parent_ns on parent_ns.oid = parent.relnamespace
    join pg_attribute child_att on child_att.attrelid = child.oid and child_att.attnum = any(fk.conkey)
    where fk.contype = 'f'
      and child_ns.nspname = 'public'
      and child.relname = c.table_name
      and child_att.attname = c.column_name
      and parent_ns.nspname = 'auth'
      and parent.relname = 'users'
  )
order by table_name, column_name;

-- 5) Profile bootstrap trigger validity.
select
  t.tgname as trigger_name,
  t.tgenabled as trigger_enabled,
  n.nspname as trigger_schema,
  c.relname as trigger_table,
  p.proname as function_name,
  pn.nspname as function_schema,
  pg_get_triggerdef(t.oid) as trigger_definition
from pg_trigger t
join pg_class c on c.oid = t.tgrelid
join pg_namespace n on n.oid = c.relnamespace
join pg_proc p on p.oid = t.tgfoid
join pg_namespace pn on pn.oid = p.pronamespace
where not t.tgisinternal
  and n.nspname = 'auth'
  and c.relname = 'users'
  and t.tgname = 'on_auth_user_created';

-- 6) Trigger/function source check. Expected function language=plpgsql and INSERT into public.profiles.
select
  n.nspname as function_schema,
  p.proname as function_name,
  l.lanname as language,
  p.prosecdef as security_definer,
  pg_get_functiondef(p.oid) as function_definition
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
join pg_language l on l.oid = p.prolang
where n.nspname = 'public'
  and p.proname = 'handle_new_user';

-- 7) Machine-friendly PASS/FAIL summary.
with app_tables as (
  select c.relname
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'r' and c.relname <> 'schema_migrations'
),
trigger_ok as (
  select exists (
    select 1
    from pg_trigger t
    join pg_class c on c.oid = t.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
    join pg_proc p on p.oid = t.tgfoid
    join pg_namespace pn on pn.oid = p.pronamespace
    where not t.tgisinternal
      and n.nspname = 'auth' and c.relname = 'users'
      and t.tgname = 'on_auth_user_created'
      and p.proname = 'handle_new_user' and pn.nspname = 'public'
      and t.tgenabled <> 'D'
  ) as ok
)
select
  (select count(*) from app_tables) as application_tables,
  (select count(*) from app_tables a join pg_class c on c.relname=a.relname join pg_namespace n on n.oid=c.relnamespace and n.nspname='public' where c.relrowsecurity) as rls_enabled_tables,
  (select count(*) from app_tables a join pg_class c on c.relname=a.relname join pg_namespace n on n.oid=c.relnamespace and n.nspname='public' where not c.relrowsecurity) as rls_disabled_tables,
  (select ok from trigger_ok) as profile_trigger_ok,
  case when (select count(*) from app_tables a join pg_class c on c.relname=a.relname join pg_namespace n on n.oid=c.relnamespace and n.nspname='public' where not c.relrowsecurity) = 0
        and (select ok from trigger_ok)
       then 'PASS' else 'REVIEW' end as overall_status;
