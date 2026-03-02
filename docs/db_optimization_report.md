# Database Optimization Analysis

I have completed a thorough review of your Supabase database schema (`schema.sql`), specifically examining indexing strategies, Foreign Key cascades, and Row-Level Security (RLS) policies.

Overall, the database is in great shape! You've successfully added many critical indexes for high-read tables like `daily_logs` and `audit_logs`. However, I have identified **three areas for substantial performance optimization**, specifically concerning RLS function execution and missing indexes on cascading deletes.

---

### 1. The `is_admin()` RLS Bottleneck

Currently, the `is_admin()` function is written in `plpgsql` and does not define a volatility category.
Because it's used in almost every Admin RLS policy (e.g., `FOR SELECT USING (public.is_admin())`), PostgreSQL treats it as `VOLATILE` by default. This forces Postgres to execute the `SELECT 1 FROM profiles` query **for every single row** being evaluated during a large query, rather than executing it once per statement. 

**The Fix**: We need to rewrite this function to use `LANGUAGE sql` and mark it as `STABLE`. This instructs Postgres to execute it only once per query context and cache the result, drastically reducing DB load on admin views.

### 2. Missing Indexes on `ON DELETE CASCADE` Foreign Keys

When a Foreign Key has `ON DELETE CASCADE`, PostgreSQL must scan the child table to delete rows whenever a parent row is deleted. If there is no index on the child table's foreign key column, Postgres has to perform a **full table scan**, which locks the table and slows down deletions as the database grows.
I found two critical missing indexes:
*   `program_squad_dates(squad_id)`
*   `user_goal_assignments(goal_template_id)`

**The Fix**: Create `btree` indexes for these columns.

### 3. Missing `admin_id` Index on `groups`

Your RLS policies frequently check if an admin owns a group (e.g., `groups.admin_id = auth.uid()`). A composite index covering this query pattern will speed up dashboard data loading for admins who manage multiple squads.

**The Fix**: Create an index on `groups(admin_id)`.

---

Would you like me to generate a Supabase migration file with all of these optimizations and push it to the remote database?
