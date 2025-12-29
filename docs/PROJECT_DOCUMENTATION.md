# Get Fit Together - Project Documentation

## Project Overview

**Get Fit Together** is a gamified fitness challenge platform designed to motivate participants through daily workouts, progress tracking, and friendly squad competition.

---

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Technology Stack](#technology-stack)
3. [Database Schema](#database-schema)
4. [Features](#features)
5. [User Flows](#user-flows)
6. [API & Authentication](#api--authentication)
7. [Deployment](#deployment)
8. [Development Setup](#development-setup)

---

## System Architecture

### High-Level Overview

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│   Next.js App   │ ◄─────► │  Supabase API    │ ◄─────► │   PostgreSQL    │
│   (Frontend)    │         │  (Backend)       │         │   (Database)    │
└─────────────────┘         └──────────────────┘         └─────────────────┘
        │                           │
        │                           │
        ▼                           ▼
┌─────────────────┐         ┌──────────────────┐
│   Vercel CDN    │         │  Auth & Storage  │
│   (Hosting)     │         │  (Supabase)      │
└─────────────────┘         └──────────────────┘
```

### Application Layers

1. **Presentation Layer**
   - Next.js 14 with App Router
   - React components
   - Tailwind CSS styling
   - Client-side routing

2. **Authentication Layer**
   - Supabase Auth
   - Row-Level Security (RLS)
   - JWT tokens
   - Role-based access control

3. **API Layer**
   - Supabase REST API
   - Real-time subscriptions
   - Edge functions (if needed)

4. **Data Layer**
   - PostgreSQL database
   - Supabase managed
   - RLS policies
   - Database triggers

---

## Technology Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 14.x | React framework, SSR |
| React | 18.x | UI library |
| TypeScript | 5.x | Type safety |
| Tailwind CSS | 3.x | Styling |
| Lucide Icons | Latest | Icon library |
| date-fns | 3.x | Date manipulation |

### Backend & Database

| Technology | Version | Purpose |
|------------|---------|---------|
| Supabase | Latest | Backend-as-a-Service |
| PostgreSQL | 15.x | Database |
| PostgREST | Latest | REST API |

### Development Tools

| Tool | Purpose |
|------|---------|
| npm/pnpm | Package management |
| ESLint | Code linting |
| Git | Version control |

---

## Database Schema

### Core Tables

#### `profiles`
User profile information
```sql
- id (uuid, PK, FK to auth.users)
- email (text)
- first_name (text)
- last_name (text)
- full_name (text)
- display_name (text)
- role (text: 'admin' | 'participant')
- status (text: 'pending' | 'approved')
- total_points (integer)
- height_cm (numeric)
- weight_kg (numeric)
- body_fat_percentage (numeric)
- muscle_mass_percentage (numeric)
- created_at (timestamp)
```

#### `groups` (Squads)
Squad/team definitions
```sql
- id (uuid, PK)
- name (text)
- color (text)
- created_at (timestamp)
```

#### `group_members`
Squad membership mapping
```sql
- id (uuid, PK)
- group_id (uuid, FK to groups)
- user_id (uuid, FK to profiles)
- status (text: 'pending' | 'approved')
- joined_at (timestamp)
```

#### `workout_templates`
Reusable workout library
```sql
- id (uuid, PK)
- name (text)
- description (text)
- type (text: 'weekday' | 'weekend' | 'event')
- video_url (text)
- created_at (timestamp)
```

#### `scheduled_workouts`
Scheduled WODs
```sql
- id (uuid, PK)
- template_id (uuid, FK to workout_templates)
- date (date)
- created_at (timestamp)
```

#### `wod_squad_assignments`
Many-to-many: WODs ↔ Squads
```sql
- id (uuid, PK)
- workout_id (uuid, FK to scheduled_workouts)
- group_id (uuid, FK to groups)
- assigned_at (timestamp)
```

#### `workout_exercises`
Exercises within a workout
```sql
- id (uuid, PK)
- template_id (uuid, FK to workout_templates)
- order_index (integer)
- exercise_name (text)
- sets (integer)
- reps (integer)
- duration_seconds (integer)
- rest_seconds (integer)
- equipment (text)
- notes (text)
```

#### `goal_templates`
Reusable goal definitions
```sql
- id (uuid, PK)
- name (text)
- description (text)
- category (text)
- points (integer)
- duration (text)
- created_by (uuid, FK to profiles)
- created_at (timestamp)
```

#### `user_goal_assignments`
Goals assigned to users
```sql
- id (uuid, PK)
- user_id (uuid, FK to profiles)
- goal_template_id (uuid, FK to goal_templates)
- slot (integer: 1 or 2)
- assigned_by (uuid, FK to profiles)
- assigned_at (timestamp)
```

#### `squad_checkin_activities`
Squad-specific daily activities
```sql
- id (uuid, PK)
- squad_id (uuid, FK to groups)
- activity_name (text)
- activity_type (text)
- points (integer)
- icon (text)
- enabled (boolean)
- display_order (integer)
- created_at (timestamp)
```

#### `daily_logs`
Daily check-in submissions
```sql
- id (uuid, PK)
- user_id (uuid, FK to profiles)
- date (date)
- daily_points (integer)
- custom_logs (jsonb)
- created_at (timestamp)
```

### Key Relationships

```
profiles 1──────* group_members *──────1 groups
                                         │
                                         │
                                         *
                              wod_squad_assignments
                                         *
                                         │
                                         │
profiles 1─────* daily_logs    scheduled_workouts 1────* workout_exercises
         │                                │
         │                                1
         │                      workout_templates
         │
         *
user_goal_assignments *───────1 goal_templates
```

---

## Features

### Participant Features

#### 1. **Registration & Onboarding**
- Self-registration with biometric data
- Squad selection
- Admin approval workflow
- Pending approval page with auto-refresh

#### 2. **Dashboard**
- Welcome message with first name
- Points summary
- Quick navigation

#### 3. **Daily Workflow**

**View WOD**:
- Today's scheduled workout
- Exercise list with sets/reps/duration
- Video tutorial (if available)
- Squad-specific assignments

**Daily Check-In**:
- Dynamic activities from squad config
- Admin-assigned personal goals
- Yes/No tracking
- Points calculation
- One submission per day limit

#### 4. **Goals Management**
- View admin-assigned goals
- Read-only display
- Points and assignment date shown

#### 5. **Squad Leaderboard**
- Squad member rankings
- Points comparison
- Position tracking

#### 6. **Settings**
- Edit first/last name
- Change password
- View account details
- Logout

### Admin Features

#### 1. **Squad Management**
- Create/edit/delete squads
- Assign members to squads
- View member lists

#### 2. **User Approval**
- Approval queue
- Approve/reject registrations
- Bulk operations

#### 3. **WOD Management**

**Create WODs**:
- From scratch or library
- Multi-squad assignment
- YouTube video links
- Exercise builder

**Bulk Scheduler**:
- Date range selection
- Template selection
- Assignment strategies (sequential/random/round-robin)
- Conflict detection

**Calendar View**:
- Monthly visual overview
- Color-coded by type
- Click-to-edit

#### 4. **Workout Library**
- Create reusable templates
- Manage exercise library
- Quick WOD deployment

#### 5. **Goals System**
- Create goal templates
- Assign to participants (2 per user)
- Configure points

#### 6. **Check-In Configuration**
- Squad-specific activities
- Custom point values
- Activity ordering
- Enable/disable activities

#### 7. **Analytics Dashboard**
- Key metrics (completion rates, engagement)
- Squad comparison charts
- WOD type performance
- Engagement trends
- Auto-refresh (60s)

---

## User Flows

### Participant Registration Flow

```
Start → Fill Form (biometrics) → Submit → Pending Page
                                              ↓
                                    Admin Approves ← Admin Panel
                                              ↓
                                    Auto-redirect → Dashboard
```

### Daily Participant Flow

```
Login → Dashboard → View WOD → Complete Workout
                                     ↓
                              Go to Check-In
                                     ↓
                              Answer All Items
                                     ↓
                                   Submit
                                     ↓
                              Points Awarded → Update Leaderboard
```

### Admin WOD Creation Flow

```
Admin Login → WODS Tab → Create New
                               ↓
                    Fill Details (name, type, video)
                               ↓
                Select Squads (multi-select checkboxes)
                               ↓
                         Pick Date
                               ↓
                      Schedule → WOD Created
                               ↓
                  Add Exercises (optional)
                               ↓
                     Assign to Participants
```

---

## API & Authentication

### Authentication

**Supabase Auth** handles:
- User registration
- Login/logout
- Session management
- JWT tokens

**Flow**:
1. User submits credentials
2. Supabase validates
3. Returns JWT token
4. Client stores in localStorage
5. RLS uses JWT for authorization

### Row-Level Security (RLS)

**Profiles Table**:
- Users can read/update own profile
- Admins can read all profiles

**Groups Table**:
- All authenticated users can read
- Only admins can insert/update/delete

**Scheduled Workouts**:
- Participants see workouts assigned to their squad
- Admins see all workouts

**Daily Logs**:
- Users can insert/read own logs
- Admins can read all logs

### API Calls

**Standard Pattern**:
```typescript
const { data, error } = await supabase
  .from('table_name')
  .select('columns')
  .eq('filter_column', value);
```

**With Relations**:
```typescript
const { data } = await supabase
  .from('user_goal_assignments')
  .select(`
    slot,
    goal_templates (
      name,
      description,
      points
    )
  `)
  .eq('user_id', userId);
```

---

## Deployment

### Supabase Setup

1. **Create Project**:
   - Sign up at supabase.com
   - Create new project
   - Note project URL and anon key

2. **Run Migrations**:
   - Execute SQL scripts in order:
     - Schema creation
     - RLS policies
     - Functions/triggers

3. **Configure Auth**:
   - Enable email/password provider
   - Set redirect URLs
   - Email templates (optional)

### Vercel Deployment

1. **Connect Repository**:
   - Import from GitHub
   - Select Next.js framework

2. **Environment Variables**:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

3. **Deploy**:
   - Auto-deploy on push to main
   - Preview deployments for PRs

### Custom Domain

1. Add domain in Vercel
2. Configure DNS records
3. Enable HTTPS

---

## Development Setup

### Prerequisites

- Node.js 18+ and npm/pnpm
- Git
- Supabase account

### Installation

1. **Clone Repository**:
   ```bash
   git clone <repository-url>
   cd get-fit-together
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Environment Setup**:
   Create `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

4. **Run Development Server**:
   ```bash
   npm run dev
   ```
   App runs at `http://localhost:3000`

### Project Structure

```
get-fit-together/
├── src/
│   ├── app/              # Next.js app router pages
│   │   ├── admin/        # Admin dashboard pages
│   │   ├── dashboard/    # Participant dashboard pages
│   │   │   ├── check-in/ # Check-in page
│   │   │   ├── goals/    # Goals page
│   │   │   ├── settings/ # Settings page
│   │   │   ├── squad/    # Squad page
│   │   │   └── wod/      # WOD page
│   │   ├── auth/         # Authentication page
│   │   ├── pending-approval/ # Pending page
│   │   └── layout.tsx    # Root layout
│   ├── components/       # React components
│   │   ├── admin/        # Admin-specific components
│   │   ├── Auth.tsx      # Auth component
│   │   └── DashboardNav.tsx # Participant nav
│   └── lib/              # Utilities
│       ├── supabase.ts   # Supabase client
│       └── utils.ts      # Helper functions
├── public/               # Static assets
├── docs/                 # Documentation
└── *.sql                 # Database migration scripts
```

---

## Security Considerations

### RLS Policies

All tables have RLS enabled with policies:
- Participants: Own data only
- Admins: Full access

### Data Protection

- Passwords hashed by Supabase
- JWT tokens for authentication
- HTTPS only in production
- Environment variables for secrets

### Best Practices

- Never commit `.env.local`
- Use anon key (not service role key) in frontend
- Validate input on both client and server
- Sanitize user-generated content

---

## Performance Optimization

### Frontend

- **Code Splitting**: Next.js automatic
- **Image Optimization**: Next.js Image component
- **Lazy Loading**: Components load on demand
- **Caching**: Static assets cached by CDN

### Database

- **Indexes**: On foreign keys, frequently queried columns
- **Pagination**: Limit large query results
- **Efficient Queries**: Select only needed columns
- **Connection Pooling**: Managed by Supabase

### Analytics

- Auto-refresh limited to 60s
- Aggregate queries for metrics
- Caching where appropriate

---

## Future Enhancements

### Planned Features

1. **Notifications**:
   - Email reminders for check-ins
   - Push notifications
   - Admin announcements

2. **Gamification**:
   - Badges and achievements
   - Streak tracking
   - Level system

3. **Social Features**:
   - Squad chat
   - Activity feed
   - Photo sharing

4. **Advanced Analytics**:
   - Personal progress charts
   - Goal completion trends
   - Predictive insights

5. **Mobile App**:
   - React Native version
   - Offline support
   - Camera integration for photos

---

## Troubleshooting

### Common Issues

**Build Errors**:
- Clear `.next` folder
- Delete `node_modules`, reinstall
- Check TypeScript errors

**RLS Errors (403)**:
- Verify policies in Supabase
- Check user authentication
- Confirm role assignment

**Performance Issues**:
- Check database indexes
- Optimize queries
- Review network requests

---

## Contributing

### Development Workflow

1. Create feature branch
2. Make changes
3. Test locally
4. Submit pull request
5. Code review
6. Merge to main

### Code Standards

- Use TypeScript
- Follow ESLint rules
- Write descriptive commit messages
- Document complex logic

---

## Support & Maintenance

### Monitoring

- Supabase dashboard for DB health
- Vercel analytics for usage
- Error logging (if implemented)

### Backups

- Supabase auto-backups daily
- Manual exports as needed

### Updates

- Keep dependencies updated
- Monitor security advisories
- Test before deploying

---

## License

[Specify license here]

---

## Contact

For questions or support:
- Technical Issues: [Contact info]
- Feature Requests: [Contact info]
- General Inquiries: [Contact info]

---

**Project Version**: 1.0.0  
**Last Updated**: December 2025  
**Maintained by**: [Your Name/Team]
