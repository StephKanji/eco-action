-- ─────────────────────────────────────────
-- PROFILES
-- ─────────────────────────────────────────

-- Users can read only their own profile
create policy "profiles: select own"
  on public.profiles for select
  using (auth.uid() = id);

-- Users can insert their own profile
create policy "profiles: insert own"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Users can update only their own profile
create policy "profiles: update own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ─────────────────────────────────────────
-- ORGANIZATIONS
-- ─────────────────────────────────────────

-- Orgs can read only their own row
create policy "orgs: select own"
  on public.organizations for select
  using (profile_id = auth.uid());

-- Orgs can update only their own row
create policy "orgs: update own"
  on public.organizations for update
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

-- Orgs can insert their own row (during sign-up)
create policy "orgs: insert own"
  on public.organizations for insert
  with check (profile_id = auth.uid());

-- ─────────────────────────────────────────
-- USERS
-- ─────────────────────────────────────────

-- Users can read only their own row
create policy "users: select own"
  on public.users for select
  using (id = auth.uid());

-- Users can update only their own row
create policy "users: update own"
  on public.users for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- Users can insert their own row (during sign-up)
create policy "users: insert own"
  on public.users for insert
  with check (id = auth.uid());