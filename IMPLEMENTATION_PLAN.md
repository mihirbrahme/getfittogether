# IMPLEMENTATION PLAN: Get Fit Together

This document outlines the technical architecture, gamification logic, and roadmap for building the **Get Fit Together** platform.

---

## 1. Tech Stack (Free Forever Architecture)

- **Frontend:** Next.js (App Router) + Tailwind CSS + Lucide Icons.
- **Backend/DB:** Supabase (PostgreSQL + Auth + Real-time).
- **Hosting:** Vercel (Frontend) + Supabase (Database).
- **State Management:** React Context / TanStack Query (if needed).

---

## 2. Database Schema (Supabase)

### `profiles`
| Column | Type | Notes |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key (matches Auth ID). |
| `full_name` | String | Display name. |
| `role` | Enum | `participant` or `admin`. |
| `total_points`| Integer | Aggregated score. |
| `status` | Enum | `pending`, `approved`. |

### `wods` (Workout of the Day)
| Column | Type | Notes |
| :--- | :--- | :--- |
| `date` | Date | Unique per day. |
| `option_a` | JSON | { name, description, type }. |
| `option_b` | JSON | { name, description, type }. |

### `daily_logs`
| Column | Type | Notes |
| :--- | :--- | :--- |
| `id` | UUID | PK. |
| `user_id` | UUID | FK -> Profiles. |
| `date` | Date | Entry date. |
| `wod_done` | Boolean | +25 pts. |
| `steps` | Boolean | Yes/No (+10). |
| `water` | Boolean | Yes/No (+6). |
| `sleep` | Boolean | Yes/No (+6). |
| `clean_eating`| Boolean | Yes/No (+10). |
| `daily_points`| Integer | Calculated daily total. |

### `events`
| Column | Type | Notes |
| :--- | :--- | :--- |
| `id` | UUID | PK. |
| `date` | Date | Target date. |
| `title` | String | Event name. |
| `description`| Text | Details. |
| `points` | Integer | Bonus points for completion. |

### `user_goals`
| Column | Type | Notes |
| :--- | :--- | :--- |
| `user_id` | UUID | FK -> Profiles. |
| `goal_name` | String | e.g., '10k steps', 'No sugar'. |
| `active` | Boolean | |

---

## 3. Gamification Logic (The Engine)

### Scoring Rulebook
- **Daily Max (Weekdays):** 60 points.
- **Daily Floor:** -10 points (Score cannot drop below this).
- **Green Day:** Any day with **40+ points**.
- **Weekend Logic:** 
    - Saturdays/Sundays may have "Active Rest" or "Social Event" instead of standard WOD.
    - Weekend logs trigger different bonus multipliers or specific goals.
- **Day/Week Counter:**
    - Challenge start date is fixed. 
    - `current_day = (today - start_date).days + 1`
    - `current_week = floor((current_day - 1) / 7) + 1`

### Bonuses & Deductions
- **Streak Bonus:**
    - 3 Green Days: +12
    - 5 Green Days: +30
    - 10 Green Days: +70
- **Deductions:**
    - Skip WOD: -8 (unless valid reason).
    - No Check-in: -5.
    - Junk Day: -6.

---

## 4. Feature Roadmap

### Phase 1: Infrastructure
- [ ] Initialize Next.js & Supabase.
- [ ] Setup Auth (Email/Google).
- [ ] Create Database Tables & RLS Policies.

### Phase 2: Participant View
- [ ] Dashboard (Progress Rings/Score).
- [ ] Daily Check-in Modal (1-minute form).
- [ ] Real-time Leaderboard.

### Phase 3: Admin Experience [/]
- [ ] Admin Dashboard Shell.
- [ ] Event Scheduler (Admin added events).
- [ ] Weekend/Weekday WOD management.
- [ ] Bulk WOD Uploader.
- [ ] Participant Approval Queue.
- [ ] Manual Adjustment tool for "Valid Reason" overrides.

### Phase 4: Polish
- [ ] Glassmorphism UI (Premium Dark Mode).
- [ ] Micro-animations for Streak celebrations.
- [ ] Deployment to Vercel.

---

## 5. Deployment Instructions

1. Push code to **GitHub**.
2. Create project in **Supabase**, run the SQL schema.
3. Link GitHub repo to **Vercel**.
4. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel environment variables.
